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
const app = express();
const dialogflowSessionClient =
    require('../botlib/dialogflow_session_client.js');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

const projectId = 'Place your dialogflow projectId here';
const phoneNumber = "Place your twilio phone number here";
const accountSid = 'Place your accountSid here';
const authToken = 'Place your authToken here';
const chatbaseApiKey = ''; // (Optional) To enable Chatbase logging, provide your bot's API Key from https://chatbase.com/bots/main-page
if (chatbaseApiKey) chatbase = require('@google/chatbase'); // Chatbase is Google's chatbot analytics service. Docs here: https://github.com/google/chatbase-node

const client = require('twilio')(accountSid, authToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const sessionClient = new dialogflowSessionClient(projectId);

const listener = app.listen(process.env.PORT, function() {
  console.log('Your Twilio integration server is listening on port '
      + listener.address().port);
});

app.post('/', async function(req, res) {
  const userMsgTimestamp = Date.now().toString(); // Used for Chatbase message timing
  const body = req.body;
  const text = body.Body;
  const id = body.From;
  const dialogflowResponse = (await sessionClient.detectIntent(text, id, body));
  const twiml = new  MessagingResponse();
  const message = twiml.message(dialogflowResponse.fulfillmentText);
  
  // Enable Chatbase functionality if API key is set & module is loaded
  if(chatbaseApiKey && chatbase) {
      // Create a new message set to encompass both the user's request and Dialogflow's response
      const msgSet = chatbase.newMessageSet()
          .setApiKey(chatbaseApiKey)
          .setPlatform('SMS') // Can be anything
          .setUserId(id); // This is the "From" phone number from Twilio, used to track users & sessions in Chatbase

      const userMsg = msgSet.newMessage()
          .setAsTypeUser()
          .setMessage(text)
          .setTimestamp(userMsgTimestamp) // If we don't explicitly set this, Chatbase mixes up message order
          .setIntent(dialogflowResponse.intent.displayName);

      const agentMsg = msgSet.newMessage()
          .setAsTypeAgent()
          .setMessage(dialogflowResponse.fulfillmentText)
          .setTimestamp(Date.now().toString()); // Make sure it's later than userMsgTimeStamp

      if (dialogflowResponse.intent.isFallback === false && dialogflowResponse.intent.displayName !== "") {
          userMsg.setAsHandled();
      } else {
          userMsg.setAsNotHandled();
      }

      msgSet.sendMessageSet() // Send both query and response to Chatbase in a single bundle
          .then(set => {
              // The API accepted our request!
              // console.log('Successfully sent to Chatbase: ', set.getCreateResponse());
          })
          .catch(error => {
              // Something went wrong!
              console.error('Chatbase Error: ', error);
          })
  }
  
  res.send(twiml.toString());
});

process.on('SIGTERM', () => {
  listener.close(() => {
    console.log('Closing http server.');
    process.exit(0);
  });
});
