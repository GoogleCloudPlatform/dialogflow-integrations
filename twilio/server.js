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
// Optional: the exact webhook URL configured in the Twilio console. Only
// needed when it cannot be derived from the incoming request, for example
// behind a proxy that rewrites the Host header.
const webhookUrl = process.env.TWILIO_WEBHOOK_URL;

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
    // Without a configured webhookUrl, the signed URL is derived from the
    // request's protocol, Host header and path.
    valid = Boolean(authToken) &&
        Boolean(req.header('X-Twilio-Signature')) &&
        twilio.validateExpressRequest(req, authToken, {url: webhookUrl});
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