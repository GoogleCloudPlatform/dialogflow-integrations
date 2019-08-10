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
const Bot = require('@kikinteractive/kik');
const dialogflowSessionClient =
    require('../botlib/dialogflow_session_client.js');
const filterResponses = require('../botlib/filter_responses.js');
const protoToJson = require('../botlib/proto_to_json.js');

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

const botName = 'Place kik bot name here';
const kikApiKey = 'Place kik api key here';
const webhookUrl = 'Place webhook url here';
const projectId = 'Place dialogflow project id here';
const sessionClient = new dialogflowSessionClient(projectId);

let kikBot = new Bot({
  username: botName,
  apiKey: kikApiKey,
  baseUrl: webhookUrl
});

const port = process.env.PORT;

const listener = app.listen(port, () => {
  console.log('Your Kik integration server is listening on port ' +
      listener.address().port);
  init();
});

kikBot.onTextMessage(async(originalMessage) => {
  try {
    let result = await sessionClient.detectIntent(
        originalMessage.body, originalMessage.from, originalMessage);
    let kikMessages = await convertToKikMessages(result.fulfillmentMessages);
    await sendKikMessages(originalMessage, kikMessages);
  } catch(e) {
    console.error(e);
    originalMessage.reply('Error');
  }
});

kikBot.onStartChattingMessage(async (originalMessage) => {
  let result = await sessionClient.detectIntentWithEvent(
      'KIK_WELCOME', projectId);
  const kikWelcomeMessages = await convertToKikMessages(
      result.fulfillmentMessages);
  await sendKikMessages(originalMessage, kikWelcomeMessages);
});

//Next 3 functions exist for the bot to meet Kik's bot shop requirements
kikBot.onPictureMessage(async (message) => {
  sendMessageTypeNotSupported(message);
});

kikBot.onLinkMessage((message) => {
  sendMessageTypeNotSupported(message);
});

kikBot.onVideoMessage((message) => {
  sendMessageTypeNotSupported(message);
});

function init () {
  kikBot.updateBotConfiguration();
  app.use(kikBot.incoming());
}

function sendMessageTypeNotSupported(message){
  message.reply('Sorry, this format is not supported');
}

async function convertToKikMessages(result) {
  const filteredResponses = filterResponses.filterResponses(result, 'KIK');
  let kikMessages = [];
  let quickReplyFlag;
  for(let response of filteredResponses) {
    let kikMessage;
    switch(true) {
      case response.hasOwnProperty('text'): {
        kikMessage = convertTextReplyToKikMessage(response.text);
      }
        break;
      case response.hasOwnProperty('quickReplies'): {
        kikMessage = convertQuickReplyToKikMessage(response.quickReplies);
        quickReplyFlag = true;
      }
        break;
      case response.hasOwnProperty('image'): {
        kikMessage = convertImageReplyToKikMessage(response.image);
      }
        break;
      case response.hasOwnProperty('payload'): {
        kikMessage = convertPayloadToKikMessage(response.payload);
      }
        break;
      case response.hasOwnProperty('card'): {
        kikMessage = convertCardReplyToKikMessage(response.card);
      }
        break;
      default:
    }
    if (kikMessage) {
      kikMessages.push.apply(kikMessages, kikMessage);
    }
  }
  if(quickReplyFlag) {
    kikMessages = makeQuickReplyLast(kikMessages);
  }
  return kikMessages;
}

const convertTextReplyToKikMessage = (message) => ([{
  type: 'text',
  body: message.text[0]
}]);

const convertPayloadToKikMessage = (message) =>
  [protoToJson.structProtoToJson(message.fields.kik.structValue)];

function convertQuickReplyToKikMessage(message) {
  let quickReplies = message.quickReplies;
  let replies = [];
  for(let quickReply of quickReplies) {
    replies.push({type: 'text', body: quickReply});
  }
  let kikMessage = {type: 'text'};
  kikMessage.body = message.title
      ? message.title : 'Choose an item';
  kikMessage.keyboards = [{type: 'suggested', responses: replies}];
  return [kikMessage];
}

function convertImageReplyToKikMessage(message) {
  let imageUrl = loadPictureUrl(message);
  let kikMessage;
  if (imageUrl.endsWith('.gif')) {
    kikMessage = {type: 'video', videoUrl: imageUrl, loop: true, autoplay: true};
  } else {
    kikMessage = {type: 'picture', picUrl: imageUrl};
  }
  return [kikMessage];
}

const loadPictureUrl = (message) => message.imageUri;

function convertCardReplyToKikMessage(message) {
  let replies = [];
  let linkMessages = [];
  let kikMessages = [];

  if (message.buttons.length > 0) {
    for(let button of message.buttons) {
      let text = button.text;
      let postback = button.postback;

      if (text) {
        if (postback && postback.startsWith('http')) {
          linkMessages.push({type: 'link', title: text, url: postback});
        } else {
          replies.push({type: 'text', body: text});
        }
      }
    }
  }

  if (message.imageUri) {
    let pictureMessage = addImageToCardReply(message, replies);
    kikMessages.push(pictureMessage);
    let descriptionMessage = addDescriptionToCardReply(message, replies);
    if (descriptionMessage.body) {
      kikMessages.push(descriptionMessage);
    }
  } else {
    let descriptionMessage = addDescriptionToCardReply(message, replies);
    if (message.title) {
      descriptionMessage.body = message.title + '\n' + descriptionMessage.body;
    }
    kikMessages.push(descriptionMessage);
  }

  if (linkMessages.length > 0) {
    for (let i = 0; i < linkMessages.length; i++) {
      //Add quick replies to last link message
      if (i === linkMessages.length - 1 && replies.length > 0) {
        linkMessages[i].keyboards = [{
          type: 'suggested',
          responses: replies
        }];
      }
      kikMessages.push(linkMessages[i]);
    }
  }
  return kikMessages;
}

function addImageToCardReply(message, replies) {
  let pictureMessage = convertImageReplyToKikMessage(message)[0];
  if (replies.length > 0) {
    pictureMessage.keyboards = [{type: 'suggested', responses: replies}];
  }
  if (message.title) {
    pictureMessage.attribution = {name: message.title};
  }
  return pictureMessage;
}

function addDescriptionToCardReply(message, replies) {
  let descriptionMessage = {type: 'text', body: ''};
  if (replies.length > 0) {
    descriptionMessage.keyboards = [{type: 'suggested', responses: replies}];
  }
  if (message.subtitle) {
    descriptionMessage.body = message.subtitle;
  }
  return descriptionMessage;
}

const sendKikMessages = async (originalMessage, kikMessages) =>
  originalMessage.reply(kikMessages);

//Quick Reply does not show on kik app unless it's the last message sent
function makeQuickReplyLast(kikMessages) {
  let index = kikMessages.findIndex((kikMessage) =>
      kikMessage.hasOwnProperty('keyboards'));
  let temp = kikMessages[index];
  kikMessages[index] = kikMessages[kikMessages.length - 1];
  kikMessages[kikMessages.length -1] = temp;
  return kikMessages;
}

module.exports = {convertToKikMessages};