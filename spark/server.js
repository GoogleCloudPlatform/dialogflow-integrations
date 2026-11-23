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
const crypto = require('crypto');
const express = require('express');
const request = require('request');

// Upon start a webhook is registered with spark
// Upon closure the webhook is removed from spark

// Insert your values here
const sparkAccessToken = 'Place your spark personal access token here';
const sparkWebhookSecret = 'Place your spark webhook secret here';
const targetUrl = 'Place you servers URL here';
const projectId = 'Place your dialogflow projectId here';

// Refuse to register or verify webhooks while the secret is unset, empty, or
// still set to a public placeholder value.
const SPARK_SECRET_PLACEHOLDERS = new Set([
  'Place your spark webhook secret here',
  'your-spark-webhook-secret',
]);
const SPARK_SIGNATURE_PATTERN = /^[0-9a-fA-F]{40}$/;
const SPARK_ID_PATTERN = /^[A-Za-z0-9+=_.-]{1,512}$/;

function getConfiguredAccessToken() {
  return process.env.SPARK_ACCESS_TOKEN !== undefined ?
      process.env.SPARK_ACCESS_TOKEN :
      sparkAccessToken;
}

function getConfiguredTargetUrl() {
  return process.env.SPARK_TARGET_URL !== undefined ?
      process.env.SPARK_TARGET_URL :
      targetUrl;
}

function getConfiguredProjectId() {
  return process.env.PROJECT_ID !== undefined ?
      process.env.PROJECT_ID :
      projectId;
}

function resolveWebhookSecret(secretOverride) {
  const candidate = secretOverride !== undefined ?
      secretOverride :
      (process.env.SPARK_WEBHOOK_SECRET !== undefined ?
          process.env.SPARK_WEBHOOK_SECRET :
          sparkWebhookSecret);
  if (typeof candidate !== 'string' ||
      candidate.trim().length === 0 ||
      SPARK_SECRET_PLACEHOLDERS.has(candidate)) {
    return null;
  }
  return candidate;
}

function hasSparkSecret(secretOverride) {
  return resolveWebhookSecret(secretOverride) !== null;
}

function computeSparkSignature(rawBody, secret) {
  return crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
}

function isValidSparkSignature(req, secretOverride) {
  const secret = resolveWebhookSecret(secretOverride);
  const signature = req.get('X-Spark-Signature');
  if (!secret ||
      typeof signature !== 'string' ||
      !SPARK_SIGNATURE_PATTERN.test(signature) ||
      !Buffer.isBuffer(req.rawBody)) {
    return false;
  }
  const expected = Buffer.from(
      computeSparkSignature(req.rawBody, secret), 'utf8');
  const actual = Buffer.from(signature.toLowerCase(), 'utf8');
  return actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected);
}

/**
 * Validates that a Webex resource ID is a single safe path segment and cannot
 * traverse paths (e.g. '..' or '../webhooks') or inject query/fragment parts.
 */
function isValidSparkId(id) {
  return typeof id === 'string' &&
      SPARK_ID_PATTERN.test(id) &&
      id !== '.' &&
      id !== '..' &&
      !id.includes('..');
}

/**
 * Express middleware that rejects every webhook request that was not signed by
 * Webex with the configured webhook secret.
 */
function createRequireSparkSignature(secretOverride) {
  return function requireSparkSignature(req, res, next) {
    if (!isValidSparkSignature(req, secretOverride)) {
      res.status(403).type('text/plain')
          .send('Spark request validation failed.');
      return;
    }
    next();
  };
}

const requireSparkSignature = createRequireSparkSignature();

function createApp(options = {}) {
  const app = express();
  const activeSecret = options.webhookSecret;
  const retrieveMessageFn = options.retrieveMessage ||
      ((id) => retrieveMessage(id, {
        requestClient: options.requestClient,
        accessToken: options.accessToken,
      }));
  const sendMessageFn = options.sendMessage ||
      ((text, email) => sendMessage(text, email, {
        requestClient: options.requestClient,
        accessToken: options.accessToken,
      }));
  let activeSessionClient = options.sessionClient;
  const getSessionClient = () => {
    if (!activeSessionClient) {
      const DialogflowSessionClient =
          require('../botlib/dialogflow_session_client.js');
      activeSessionClient = new DialogflowSessionClient(
          getConfiguredProjectId());
    }
    return activeSessionClient;
  };

  // Keep the raw request bytes so that the X-Spark-Signature header, which
  // Webex computes over the exact UTF-8 JSON body it sent, can be verified.
  app.use(express.json({
    verify: (req, res, buf, encoding) => {
      if (encoding !== 'utf-8') {
        const err = new Error('unsupported charset');
        err.status = 415;
        throw err;
      }
      req.rawBody = buf;
    },
  }));

  const signatureMiddleware = activeSecret !== undefined ?
      createRequireSparkSignature(activeSecret) :
      requireSparkSignature;

  app.post('/', signatureMiddleware, async function(req, res) {
    const messageId = req.body && req.body.data && req.body.data.id;
    if (!isValidSparkId(messageId)) {
      res.sendStatus(400);
      return;
    }
    try {
      const message = await retrieveMessageFn(messageId);
      if (message == null) {
        res.sendStatus(200);
        return;
      }
      const dialogflowResponse = (await getSessionClient().detectIntent(
          message.text, message.email, message.payload)).fulfillmentText;
      sendMessageFn(dialogflowResponse, message.email);
      res.sendStatus(200);
    } catch (err) {
      console.error('Failed to handle Spark webhook :' + err);
      res.sendStatus(500);
    }
  });

  // Respond to errors (e.g. malformed or rejected request bodies) with just
  // the status code, so stack traces and file paths are never sent to callers.
  app.use(function(err, req, res, next) {
    res.sendStatus(err.status || err.statusCode || 500);
  });

  return app;
}

async function init(options = {}) {
  const activeTargetUrl = options.targetUrl !== undefined ?
      options.targetUrl :
      getConfiguredTargetUrl();
  await deleteWebhooksByUrl(activeTargetUrl, options);
  registerWebhook(options);
}

function sendMessage(text, personEmail, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  httpClient.post('https://api.ciscospark.com/v1/messages', {
    auth: {
      bearer: accessToken,
    },
    json: {
      'toPersonEmail': personEmail,
      'text': text,
    },
  }, (err, resp, body) => {
    if (err) {
      console.error('Failed to send message :' + err);
    }
  });
}

function registerWebhook(options = {}) {
  const secret = resolveWebhookSecret(options.webhookSecret);
  if (!secret) {
    console.error(
        'Spark webhook secret is not configured; refusing to register ' +
        'an unauthenticated webhook.');
    return false;
  }
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  const activeTargetUrl = options.targetUrl !== undefined ?
      options.targetUrl :
      getConfiguredTargetUrl();
  httpClient.post('https://api.ciscospark.com/v1/webhooks', {
    auth: {
      bearer: accessToken,
    },
    json: {
      'name': 'test',
      'targetUrl': activeTargetUrl,
      'resource': 'messages',
      'event': 'created',
      'secret': secret,
    },
  }, (err, resp, body) => {
    if (err) {
      console.error('Failed to create Webhook :' + err);
    }
  });
  return true;
}

async function deleteWebhooksByUrl(webhookTargetUrl, options = {}) {
  const webhooks = await listWebhooks(webhookTargetUrl, options);
  for (const webhook of webhooks) {
    if (webhook && webhook.id) {
      await deleteWebhookById(webhook.id, options);
    }
  }
}

function deleteWebhookById(webhookId, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  return new Promise((resolve, reject) => {
    if (!isValidSparkId(webhookId)) {
      reject(new Error('Invalid Spark webhookId'));
      return;
    }
    httpClient.delete(
        'https://api.ciscospark.com/v1/webhooks/' +
            encodeURIComponent(webhookId), {
          auth: {
            bearer: accessToken,
          },
        }, (err, resp, body) => {
          if (err) {
            console.error('Failed to delete webhook :' + err);
            reject(err);
            return;
          }
          resolve();
        });
  });
}

function listWebhooks(webhookTargetUrl, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  return new Promise((resolve, reject) => {
    httpClient.get('https://api.ciscospark.com/v1/webhooks?max=100', {
      auth: {
        bearer: accessToken,
      },
    }, (err, resp, body) => {
      if (err) {
        console.error('Failed to check webhooks :' + err);
        reject(err);
        return;
      }
      if (!resp ||
          (typeof resp.statusCode === 'number' &&
              (resp.statusCode < 200 || resp.statusCode >= 300))) {
        reject(new Error('Failed to check webhooks: status ' +
            (resp && resp.statusCode)));
        return;
      }
      let webhooks;
      try {
        const raw = resp.body !== undefined ? resp.body : body;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        webhooks = parsed && parsed.items;
      } catch (parseErr) {
        reject(parseErr);
        return;
      }
      if (Array.isArray(webhooks)) {
        resolve(webhooks.filter((value) => {
          return value && value.targetUrl === webhookTargetUrl;
        }));
        return;
      }
      resolve([]);
    });
  });
}

function retrieveMessage(messageId, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  return new Promise((resolve, reject) => {
    if (!isValidSparkId(messageId)) {
      reject(new Error('Invalid Spark messageId'));
      return;
    }
    httpClient.get(
        'https://api.ciscospark.com/v1/messages/' +
            encodeURIComponent(messageId), {
          auth: {
            bearer: accessToken,
          },
        }, (err, resp, body) => {
          if (err) {
            console.error('Failed to retrieve message :' + err);
            reject(err);
            return;
          }
          if (!resp ||
              (typeof resp.statusCode === 'number' &&
                  (resp.statusCode < 200 || resp.statusCode >= 300))) {
            reject(new Error('Failed to retrieve message: status ' +
                (resp && resp.statusCode)));
            return;
          }
          let payload;
          try {
            const raw = resp.body !== undefined ? resp.body : body;
            payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch (parseErr) {
            console.error('Failed to parse message :' + parseErr);
            reject(parseErr);
            return;
          }
          if (!payload || typeof payload.personEmail !== 'string') {
            resolve(null);
            return;
          }
          // checks to make sure the message is not from itself
          if (!payload.personEmail.includes('webex.bot')) {
            resolve({
              text: payload.text,
              email: payload.personEmail,
              payload: payload,
            });
          } else {
            resolve(null);
          }
        });
  });
}

const app = createApp();

if (require.main === module) {
  const listener = app.listen(process.env.PORT, async function() {
    try {
      await init();
    } catch (err) {
      console.error('Failed to initialize Spark webhook :' + err);
    }
    console.log('Your Spark integration server is listening on port ' +
        listener.address().port);
  });

  process.on('SIGTERM', () => {
    listener.close(async () => {
      console.log('Closing http server.');
      try {
        await deleteWebhooksByUrl(getConfiguredTargetUrl());
      } catch (err) {
        console.error('Failed to clean up Spark webhooks :' + err);
      }
      process.exit(0);
    });
  });
}

module.exports = {
  app,
  computeSparkSignature,
  createApp,
  createRequireSparkSignature,
  deleteWebhookById,
  hasSparkSecret,
  isValidSparkId,
  isValidSparkSignature,
  registerWebhook,
  requireSparkSignature,
  retrieveMessage,
};
