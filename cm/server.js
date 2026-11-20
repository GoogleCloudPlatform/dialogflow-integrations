/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//Insert your values here
const cmProductToken = 'YOUR_CM_PRODUCT_TOKEN';
const projectId = 'YOUR_PROJECT_ID';

const crypto = require('crypto');
const express = require('express');

// The webhook secret is part of the URL registered at CM.com, so it is
// restricted to characters that need no URL encoding.
const WEBHOOK_SECRET_PATTERN = /^[A-Za-z0-9_-]{32,}$/;

/**
 * Throws unless the secret is usable. There is deliberately no default value:
 * without a secret anyone who knows the service URL could send messages that
 * are billed to the owner of the CM.com product token.
 */
function validateWebhookSecret(webhookSecret) {
  if (typeof webhookSecret !== 'string' ||
      !WEBHOOK_SECRET_PATTERN.test(webhookSecret)) {
    throw new Error(
        'CM_WEBHOOK_SECRET must be set to a random value of at least 32 ' +
        'characters from [A-Za-z0-9_-]. See the README for details.');
  }
}

/** Parses the optional comma separated CM_ALLOWED_SENDERS value. */
function parseAllowedSenders(value) {
  return (value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

/**
 * Creates the express app.
 *
 * @param {object} options
 * @param {object} options.sessionClient Dialogflow session client.
 * @param {object} options.messagingApi CM.com MessageApiClient.
 * @param {string} options.webhookSecret Secret expected in the webhook URL.
 * @param {string[]=} options.allowedSenders When not empty, only messages
 *     addressed to one of these numbers are answered.
 */
function createApp({sessionClient, messagingApi, webhookSecret,
    allowedSenders = []}) {
  validateWebhookSecret(webhookSecret);
  const expectedSecretHash = sha256(webhookSecret);
  const app = express();

  // Runs before the request body is parsed. Both values are hashed so that
  // the comparison is constant time regardless of the length of the input.
  const authenticate = (req, res, next) => {
    if (!crypto.timingSafeEqual(
        sha256(req.params.token), expectedSecretHash)) {
      return res.sendStatus(401);
    }
    return next();
  };

  app.post('/webhook/:token', authenticate, express.json(),
      async function (req, res) {
    const body = req.body || {};
    const from = body.from && body.from.number;
    const to = body.to && body.to.number;
    if (typeof from !== 'string' || typeof to !== 'string' || !body.message ||
        (allowedSenders.length > 0 && !allowedSenders.includes(to))) {
      // CM.com retries every response other than 200 for up to 7 days, so
      // payloads that can never be handled are acknowledged and dropped.
      console.warn('Dropping unsupported CM.com webhook payload.');
      return res.sendStatus(200);
    }
    const media = body.message.media || {};
    const text = body.message.text ||
      (!!media.mediaUri
        ? (media.title + '\n media:' + media.mediaUri)
        : "unsupported content"
      );
    try {
      const dialogflowResponse =
          await sessionClient.detectIntent(text, from, body);
      const response = await sendMessage(messagingApi, dialogflowResponse, body);
      console.log("response", JSON.stringify(response));
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
    return res.sendStatus(200);
  });

  app.post('/dialog', express.json(), async function (req, res) {
    return res.send();
  });

  return app;
}

function sendMessage(messagingApi, intent, source) {
  var content = [];
  intent.fulfillmentMessages.forEach(r => {
    if (!!r.text) {
      content.push(...r.text.text.map(t => ({ text: t })));
    } else if (!!r.image) {
      content.push({
        media: {
          mediaName: r.image.imageUri,
          mediaUri: r.image.accessibilityText,
          mimeType: 'image/' + r.image.imageUri.replace(/^.*\.([^.]+)$/, "$1")
        }
      });
    } else {
      console.warn(JSON.stringify({ unsupportedMedia: r }));
    }
  });

  // The reply goes to the number the message came from, using the number it
  // was sent to as the sender.
  const response = messagingApi.createMessage()
    .setMessage([source.from.number], source.to.number, intent.fulfillmentText)
    .setAllowedChannels([source.channel])
    .setConversation(content)
    .send()
    .then((response) => response.body);
  return response;
}

if (require.main === module) {
  const webhookSecret = process.env.CM_WEBHOOK_SECRET;
  try {
    validateWebhookSecret(webhookSecret);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const cmMessagingApi = require('@cmdotcom/text-sdk');
  const dialogflowSessionClient =
      require('../botlib/dialogflow_session_client');

  const app = createApp({
    sessionClient: new dialogflowSessionClient(projectId),
    messagingApi: new cmMessagingApi.MessageApiClient(cmProductToken),
    webhookSecret: webhookSecret,
    allowedSenders: parseAllowedSenders(process.env.CM_ALLOWED_SENDERS),
  });

  const listener = app.listen(process.env.PORT, function () {
    console.log('Your CM integration server is listening on port '
      + listener.address().port);
  });

  process.on('SIGTERM', () => {
    listener.close(async () => {
      console.log('Closing http server.');
      process.exit(0);
    });
  });
}

module.exports = {createApp, parseAllowedSenders, validateWebhookSecret};
