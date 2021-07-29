/**
 * TODO(developer):
 * Add your service key to the current folder.
 * Uncomment and fill in these variables.
 */
// const projectId = 'my-project';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en'
// const discordToken = '...'

const express = require("express")
const server = express()

const {Client} = require('discord.js');
const bot = new Client()
require('discord-buttons')(bot);

bot.login(discordToken)
bot.on('ready', () => {console.log(`Logged in as ${bot.user.tag}!`)})

const structProtoToJson =
    require('../../botlib/proto_to_json.js').structProtoToJson;

// Imports the Google Cloud Some API library
const {SessionsClient} = require('@google-cloud/dialogflow-cx');

/**
 * Example for regional endpoint:
 *   const locationId = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint:
 * 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient(
    {apiEndpoint: locationId + '-dialogflow.googleapis.com'});

/**
 * Converts Discord request to a detectIntent request.
 */
function discordToDetectIntent(discordRequest, sessionPath) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: discordRequest.content,
      },
      languageCode,
    },
  };

  return request;
}

/**
 * Takes as input a request from Discord and converts the request to
 * detectIntent request which is used to call the detectIntent() function
 * and finally output the response given by detectIntent().
 */
async function detectIntentResponse(discordRequest) {
  const sessionId = await discordRequest.channel.id;
  const sessionPath = client.projectLocationAgentSessionPath(
      projectId, locationId, agentId, sessionId);

  request = discordToDetectIntent(discordRequest, sessionPath);
  const [response] = await client.detectIntent(request);
  return response;
};

async function convertToDiscordMessage(responses) {
  let replies = [];

  for (let response of responses.queryResult.responseMessages) {
    let reply;

    switch (true) {
      case response.hasOwnProperty('text'): {
        reply = response.text.text.join();
      } break;

      /**
       * For information on the layouts for rich messages on Discord visit:
       * Images and Audio:
       * https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=send
       * Buttons:
       * https://discord.com/developers/docs/interactions/message-components
       */
      case response.hasOwnProperty('payload'): {
        reply = await structProtoToJson(response.payload);
      } break;

      default:
    }
    if (reply) {
      replies.push(reply);
    }
  }

  return replies;
}

/**
 * The check at the beginning is required to make sure that the bot does
 * not respond to its own messages and that it only responds when users
 * directly ask it a question either through direct message or by mentioning
 * it in their message.
 */
bot.on('message', async message => {
  if (message.author != bot.user && !message.author.bot &&
      (message.mentions.users.has(bot.user.id) ||
       message.channel.type == 'dm')) {
    const responses = await detectIntentResponse(message);
    var requests = await convertToDiscordMessage(responses);
        
    for (req of requests) {
      try {
        await message.channel.send(req);
      } catch (error) {
        console.log(error.data)
      }
    }
  }
})

server.listen(process.env.PORT, () => {
  console.log(
      'Your Dialogflow integration server is listening on port ' +
      process.env.PORT);
})

module.exports = {
  discordToDetectIntent,
  convertToDiscordMessage
};
