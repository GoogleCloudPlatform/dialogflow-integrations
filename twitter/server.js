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
const crypto = require('crypto');
const twitterText = require('twitter-text');

app.use(express.json());

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

//Upon start a webhook is registered with twitter
//Upon closure the webhook is removed from twitter

const twitterAPIKey = "Place your consumer key here";
const twitterSecretAPIKey = "Place you secret consumer key here";
const twitterAccessToken = "Place your access token here";
const twitterSecretAccessToken = "Place your secret access token here";
const targetUrl = "Place your server's url here";
const projectId = "Place your dialogflow projectId here";
const environmentName = "Place your twitter environment name here";

const twitterOAuth = {
  consumer_key: twitterAPIKey,
  consumer_secret: twitterSecretAPIKey,
  token: twitterAccessToken,
  token_secret: twitterSecretAccessToken
};

const twitterId = twitterAccessToken.substring(0, twitterAccessToken.indexOf("-"));
const sessionClient = new dialogflowSessionClient(projectId);

const listener = app.listen(process.env.PORT, function() {
  console.log('Your Twitter integration server is listening on port '
      + listener.address().port);
  init();
});

process.on('SIGTERM', () => {
  listener.close(() => {
    deleteSubscription();
    deleteWebhooks();
    console.log('Closing http server.');
    process.exit(0);
  });
});

function sendMessage(text, recipientId) {
  request.post('https://api.twitter.com/1.1/direct_messages/events/new.json',{
    oauth: twitterOAuth,
    json:{
      event: {
        type: "message_create",
        message_create: {
          target: {
            recipient_id: recipientId
          },
          message_data: {
            text: text,
          }
        }
      }
    }
  }, function(err, resp, body) {
    if (err) {
      console.eror('Failed to send message: ' + err);
    }
  });
}

function sendStatus(text, tweetId) {
  //Tweets must be less than 280 characters. See documentation below.
  //https://developer.twitter.com/en/docs/developer-utilities/twitter-text.html
  const parsedTweet = twitterText.parseTweet(text);
  if (parsedTweet.valid) {
    request.post('https://api.twitter.com/1.1/statuses/update.json',{
      oauth: twitterOAuth,
      form:{
        status:text,
        in_reply_to_status_id: tweetId
      },
    }, function(err, resp, body) {
      if (err) {
        console.error(err);
      }
    });
  } else {
    console.error('Failed to send status because it is longer than 280 characters: ' +
        err);
  }
}

async function init() {
  deleteSubscription();
  await deleteWebhooks();
  await registerWebhook();
  registerSubscription();
}

function registerWebhook() {
  return new Promise((resolve, reject) => {
    request.post('https://api.twitter.com/1.1/account_activity/all/'+
        environmentName+'/webhooks.json',{
      oauth:twitterOAuth,
      form:{
        url:targetUrl
      }
    }, function(err, resp, body){
      if (err) {
        console.error('Failed to register webhook: ' + err);
        reject();
      } else {
        resolve();
      }
    });
  });
}

function registerSubscription() {
  request.post('https://api.twitter.com/1.1/account_activity/all/'+
      environmentName+'/subscriptions.json',{
    oauth:twitterOAuth,
  }, function(err, resp, body) {
    if (err) {
      console.error('Failed to register subscription: ' + err);
    }
  });

}

function deleteWebhooks(){
  return new Promise((resolve, reject)=> {
    request.get(
        'https://api.twitter.com/1.1/account_activity/all/webhooks.json', {
          oauth: twitterOAuth
        }, function (err, resp, body) {
          if (err) {
            console.error('Failed to delete webhooks: ' + err);
            reject();
          }
          const environments = JSON.parse(body).environments;
          if (Array.isArray(environments)) {
            const environment = environments.find((element) => {
              return element.environment_name === environmentName;
            });
            if (environment) {
              const filteredWebhooks = environment.webhooks.filter(
                  (value, index, arr) => {
                    return value.url === targetUrl;
                  });
              filteredWebhooks.forEach((webhook) => {
                request.delete(
                    "https://api.twitter.com/1.1/account_activity/all/" +
                    environmentName + "/webhooks/" + webhook.id + ".json", {
                      oauth: twitterOAuth
                    }, function (err, resp, body) {
                      if (err) {
                        console.error('Failed to delete webhooks: ' + err);
                      }
                    });
              });
            }
          }
          resolve();
        });
  });
}

function deleteSubscription() {
  request.delete("https://api.twitter.com/1.1/account_activity/all/"+
      environmentName+"/subscriptions.json",{
    oauth:twitterOAuth
  }, function(err, resp, body) {
    if (err) {
      console.error('Failed to delete subscriptions: ' + err);
    }
  });
}

app.post('/', async function(req, res) {
  if (Array.isArray(req.body.direct_message_events) &&
      req.body.direct_message_events.length>0) {
    const message = req.body.direct_message_events[0];
    const text = message.message_create.message_data.text;
    const senderId = message.message_create.sender_id;
    if (senderId!==twitterId) {
      const dialogflowResponse = (await sessionClient.detectIntent(
          text, senderId, message)).fulfillmentText;
      sendMessage(dialogflowResponse, senderId);
    }
  } else if (Array.isArray(req.body.tweet_create_events) &&
      req.body.tweet_create_events.length>0) {
    const message = req.body.tweet_create_events[0];
    const text = message.text;
    const senderId = message.user.id_str;
    if (senderId!==twitterId && message.in_reply_to_user_id_str) {
      let dialogflowResponse = (await sessionClient.detectIntent(
          text, senderId, message)).fulfillmentText;
      const screenName = message.user.screen_name;
      dialogflowResponse = '@'+screenName+' '+dialogflowResponse;
      sendStatus(dialogflowResponse, senderId);
    }
  }
});

//responds to challenge response check verification requests
app.get('/',function(req, res) {
  const crc = req.query.crc_token;
  const hmac = "sha256="+crypto.createHmac('sha256', twitterSecretAPIKey)
      .update(crc).digest('base64');
  res.json({
    "response_token": hmac
  });
});