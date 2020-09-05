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
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dialogflowSessionClient =
  require('../botlib/dialogflow_session_client.js');

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

const MessagingResponse = require('twilio').twiml.MessagingResponse;
const sessionClient = new dialogflowSessionClient(process.env.PROJECT_ID);

const listener = app.listen(process.env.PORT, function () {
  console.log('Your Twilio integration server is listening on port '
    + listener.address().port);
});

app.post('/', async function (req, res) {
  const {
    body, body: {
      Body: text,
      From: id,
    }
  } = req
  const dialogflowResponse = (await sessionClient.detectIntent(
    text, id, body)).fulfillmentText;
  const twiml = new MessagingResponse();
  twiml.message(dialogflowResponse);
  res.send(twiml.toString());
});

process.on('SIGTERM', () => {
  listener.close(() => {
    console.log('Closing http server.');
    process.exit(0);
  });
});