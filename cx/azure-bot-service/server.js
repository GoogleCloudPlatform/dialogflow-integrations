/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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

const {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication
  } = require('botbuilder');
const dialogflowSessionClient = require('./dialogflow_cx_session_client.js');
const express = require('express');
const path = require('path');

// Read environment variables from .env file
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const app = express();

// The integration backend will authenticate with Azure Bot Service using the 
// Microsoft Application Id assigned to the bot and an application password created
// within the Azure console.
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({
  MicrosoftAppId: process.env.MICROSOFT_APP_ID,
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD});
const botAdapter = new CloudAdapter(botFrameworkAuthentication);

// The Dialogflow Client will authenticate locally using GOOGLE_APPLICATION_CREDENTIALS.
// Use `google auth login` to configure your local GCP credientials.
const dialogflowClient = new dialogflowSessionClient(
  process.env.PROJECT_ID, 
  process.env.LOCATION, 
  process.env.AGENT_ID, 
  process.env.DIALOGFLOW_ENDPOINT);

app.post('/', (req, res) => {
  // Use the adapter to process the incoming web request into a TurnContext object.
  //adapter.processActivity(req, res, async (turnContext) => {
  botAdapter.process(req, res, async (turnContext) => {
    if (isMessage(turnContext)) {
      const utterance = turnContext.activity.text;
      const senderId = turnContext.activity.from.id;

      const responses = (await dialogflowClient.detectIntent(
          utterance, senderId)).responseMessages;

      for (let response of responses) {
        if (response.message === 'text') {
          await turnContext.sendActivity(response.text.text.join());
        }
      }
    } 
  });
});
  
function isMessage(turnContext){
  if (turnContext.activity.type === 'message') {
    return true;
  } else {
    return false;
  }
}
  
botAdapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights. See https://aka.ms/bottelemetry for telemetry
  //       configuration instructions.
  console.error(`\n [onTurnError] unhandled error: ${ error }`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
      'OnTurnError Trace',
      `${ error }`,
      'https://www.botframework.com/schemas/error',
      'TurnError'
  );

  // Send a message to the user
  await context.sendActivity('The bot encountered an error or bug.');
  await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

module.exports = {
  app
};
  