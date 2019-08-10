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
const dialogflowSessionClient =
    require('../botlib/dialogflow_session_client.js');
const AccessToken = require('twilio').jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const Chat = require('twilio-chat');

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

const projectId = 'Place your dialogflow projectId here';
const accountSid = 'Place your accont SID here';
const apiKey = 'Place your API key here';
const apiSecret = 'Place your secret API key here';
const serviceSid = 'Place your service SID here';

const identity = 'dialogflow_bot';
const sessionClient = new dialogflowSessionClient(projectId);
let channel = null;
let thisClient = null;

const listener = app.listen(process.env.PORT, async function() {
  await initialize();
  console.log('Your Twilio-IP integration server is listening on port '
      + listener.address().port);
});

process.on('SIGTERM', () => {
  listener.close(async () => {
    console.log('Closing http server.');
    if (channel) {
      await channel.leave();
    }
    if (thisClient) {
      await thisClient.shutdown();
    }
    process.exit(0);
  });
});

async function initialize(){
  let token = await getToken();
  const chatClient = await Chat.Client.create(token);
  thisClient = chatClient;
  const channel = await createChannel(chatClient);
  //Reference to API:
  //https://www.twilio.com/docs/chat/channels?code-sample=code-listening-for-new-messages-13&code-language=JavaScript&code-sdk-version=default
  channel.on('messageAdded', async (message) => {
    const text = message.state.body;
    const sessionId = message.state.author;
    const payload = message.state;
    if (sessionId !== identity) {
      const response = (await sessionClient.detectIntent(
          text, sessionId, payload)).fulfillmentText;
      channel.sendMessage(response);
    }
  });
  //Reference to API: https://www.twilio.com/docs/chat/access-token-lifecycle#
  chatClient.on('tokenAboutToExpire', async () => {
    token = await getToken();
    chatClient.updateToken(token);
  });
}

function getToken(){
  const chatGrant = new ChatGrant({
    serviceSid: serviceSid,
  });
  const token = new AccessToken(accountSid, apiKey, apiSecret);
  token.addGrant(chatGrant);
  token.identity = identity;
  return token.toJwt();
}

async function createChannel(client){
  try{
    channel = await client.getChannelByUniqueName('bot_channel');
  } catch (error) {}
  if (!channel) {
    client.createChannel({
      uniqueName: 'bot_channel',
      friendlyName: 'Channel for Dialogflow bot'
    }).then(async function (createdChannel) {
      channel= createdChannel;
    });
  }
  try {
    await channel.join();
  } catch (error) {}
  return channel;
}