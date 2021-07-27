/**
 * To-Do:
 * Create a Service Account and download its key file.
 * Set the environmental variable GOOGLE_APPLICATION_CREDENTIALS
 * to the key file's location.
 * See https://cloud.google.com/dialogflow/cx/docs and
 * https://cloud.google.com/dialogflow/cx/docs/quick/setup for details.
 */
const express = require('express');
const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const app = express();

// Uncomment and insert your values here
// const webhookUrl = 'https://example.com';
// const projectId = 'my-project';
// const botName = 'botName';
// const botAvatarLink = 'https://example.com.jpg';
// const viberToken = '1234567898-ABCdfghTtaD8dfghdfgh-45sdf65467M';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en';

const bot = new ViberBot({
  logger: console,
  authToken: viberToken,
  name: botName,
  avatar: botAvatarLink,
  registerToEvents: [
    'subscribed',
    'unsubscribed',
    'conversation_started',
    'message'],
});

// Imports the Google Cloud Some API library
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
/**
 * Example for regional endpoint:
 *   const locationId = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient({apiEndpoint: locationId + '-dialogflow.googleapis.com'});

app.use('/', bot.middleware());

const port = process.env.PORT;

const listener = app.listen(port, () => {
  console.log('Your Viber integration server is listening on port ' +
      listener.address().port);
  init();
});

bot.on(BotEvents.MESSAGE_RECEIVED, async (message, response) => {
  const sessionId = response.userProfile.id;
  const dialogflowResponse = await detectIntentResponse(message, sessionId);
  const reply = await convertToViberMessage(dialogflowResponse);
  bot.sendMessage(response.userProfile, reply);
});

bot.on(BotEvents.CONVERSATION_STARTED, async (response) => {
  const sessionId = response.userProfile.id;
  const dialogflowResponse = await detectIntentResponse('VIBER_WELCOME', sessionId);
  const replies = await convertToViberMessage(dialogflowResponse);
  bot.sendMessage(response.userProfile, replies);
});

process.on('SIGTERM', () => {
  listener.close(async ()=> {
    console.log('Closing server.');
    removeWebhook();
    process.exit(0);
  });
});

const init = () => {
  bot.setWebhook(webhookUrl).catch((err) => console.log(err));
};

const removeWebhook = () => {
  // Setting a webhook with empty string removes prior webhook
  bot.setWebhook('');
};

async function convertToViberMessage(responses) {
  const replies = [];

  for (const message of responses.queryResult.responseMessages) {
    const reply = new TextMessage(message.text.text[0]);
    replies.push(reply);
  }
  return replies;
}

/**
 * This function calls Dialogflow CX API to retrieve the response
 * https://cloud.google.com/dialogflow/cx/docs/quick/api
 */
async function detectIntentResponse(message, id) {
  let request = null;
  const sessionId = id;
  const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      locationId,
      agentId,
      sessionId,
  );
  console.info(sessionPath);

  if (message == 'VIBER_WELCOME') {
    request = viberToDetectIntentEvent('VIBER_WELCOME', sessionPath);
  } else {
    request = viberToDetectIntent(message, sessionPath);
  }
  const [response] = await client.detectIntent(request);

  return response;
}

// Converts Viber message to a detectIntent request.
function viberToDetectIntent(message, sessionPath) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message.text,
      },
      languageCode,
    },
  };

  return request;
}

// Converts Viber welcome event to a detectIntent request.
function viberToDetectIntentEvent(event, sessionPath) {
  const request = {
    session: sessionPath,
    queryInput: {
      event: {
        event: event,
      },
      languageCode,
    },
  };

  return request;
};

module.exports = {convertToViberMessage, viberToDetectIntent, viberToDetectIntentEvent};
