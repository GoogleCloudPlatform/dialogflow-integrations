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
const express = require('express');
const request = require('request');
const twilio = require('twilio');
const app = express();
const dialogflowSessionClient =
    require('../botlib/dialogflow_session_client.js');
const bodyParser = require('body-parser');

// Cloud Run (and tunnels such as ngrok) terminate TLS in front of this server.
// Trust X-Forwarded-Proto so that req.protocol is the scheme Twilio called,
// which is part of the URL that Twilio signs.
app.set('trust proxy', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const projectId = 'Place your dialogflow projectId here';
const phoneNumber = "Place your twilio phone number here";
const accountSid = 'Place your accountSid here';
const authToken = 'Place your authToken here';
// Optional: the exact webhook URL configured in the Twilio console. When set,
// only requests that Twilio signed for this URL are accepted. It is required
// when the URL cannot be derived from the incoming request, for example behind
// a proxy that rewrites the Host header.
const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
// The placeholder value of authToken above is public, so it must never be
// accepted as a signing key.
const authTokenConfigured =
    Boolean(authToken) && authToken !== 'Place your authToken here';

const client = require('twilio')(accountSid, authToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const sessionClient = new dialogflowSessionClient(projectId);

const listener = app.listen(process.env.PORT, function() {
  console.log('Your Twilio integration server is listening on port '
      + listener.address().port);
});

/**
 * Express middleware that rejects every request that was not signed by Twilio
 * with this account's auth token. This endpoint is publicly reachable, so
 * without this check anyone could send messages on behalf of any phone number.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function requireTwilioSignature(req, res, next) {
  let valid = false;
  try {
    // The URL that Twilio signed: the configured webhookUrl, or else the URL
    // at which this request was received.
    const url = webhookUrl ||
        req.protocol + '://' + req.get('host') + req.originalUrl;
    // Messaging webhooks are signed over their POST parameters. A URL with
    // bodySHA256 selects the validator's JSON body mode, which does not cover
    // req.body, so such a URL is never accepted here.
    valid = authTokenConfigured &&
        Boolean(req.header('X-Twilio-Signature')) &&
        !url.includes('bodySHA256') &&
        twilio.validateExpressRequest(req, authToken, {url: url});
  } catch (err) {
    // The validator throws on some malformed requests. Treat those as invalid.
    valid = false;
  }
  if (!valid) {
    res.status(403).type('text/plain')
        .send('Twilio request validation failed.');
    return;
  }
  next();
}

app.post('/', requireTwilioSignature, async function(req, res) {
  const body = req.body;
  const text = body.Body;
  const id = body.From;
  const dialogflowResponse = (await sessionClient.detectIntent(
      text, id, body)).fulfillmentText;
  const twiml = new  MessagingResponse();
  const message = twiml.message(dialogflowResponse);
  res.send(twiml.toString());
});

process.on('SIGTERM', () => {
  listener.close(() => {
    console.log('Closing http server.');
    process.exit(0);
  });
});