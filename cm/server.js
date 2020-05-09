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

const express = require('express');
const request = require('request');
const messagingApi = require('@cmdotcom/text-sdk');
const app = express();
const dialogflowSessionClient = require('../botlib/dialogflow_session_client');

app.use(express.json());

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

const cmMessagingApi = new messagingApi.MessageApiClient(cmProductToken);
const sessionClient = new dialogflowSessionClient(projectId);

const listener = app.listen(process.env.PORT, function () {
  console.log('Your CM integration server is listening on port '
    + listener.address().port);
});

app.post('/', async function (req, res) {
  const body = req.body;
  const text = body.message.text ||
    (!!body.message.media.mediaUri
      ? (body.message.media.title + '\n media:' + body.message.media.mediaUri)
      : "unsupported content"
    );
  const dialogflowResponse = (await sessionClient.detectIntent(text, body.from.number, body));
  const response = await sendMessage(dialogflowResponse, body);
  console.log("response", JSON.stringify(response));
  return res.send(response);
});

app.post('/dialog', async function (req, res) {
  const body = req.body;
  return res.send();
});

process.on('SIGTERM', () => {
  listener.close(async () => {
    console.log('Closing http server.');
    process.exit(0);
  });
});

function sendMessage(intent, source) {
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

  const response = cmMessagingApi.createMessage()
    .setMessage([source.from.number], source.to.number, intent.fulfillmentText)
    .setAllowedChannels([source.channel])
    .setConversation(content)
    .send()
    .then((response) => response.body)
    .catch((error) => console.error(error));
  return response;
}
