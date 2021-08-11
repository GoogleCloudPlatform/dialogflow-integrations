/**
 * TODO(developer):
 * Add your service key to the current folder.
 * Uncomment and fill in these variables.
 */
// const projectId = 'my-project';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en'

// const twitterAPIKey = "Place your consumer key here";
// const twitterSecretAPIKey = "Place you secret consumer key here";
// const twitterAccessToken = "Place your access token here";
// const twitterSecretAccessToken = "Place your secret access token here";
// const environmentName = "Place your twitter environment name here";

// const targetUrl = "Place your server's url here";

const express = require('express');
const request = require('request');
const app = express();
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
const crypto = require('crypto');
const twitterText = require('twitter-text');

app.use(express.json());

const twitterOAuth = {
  consumer_key: twitterAPIKey,
  consumer_secret: twitterSecretAPIKey,
  token: twitterAccessToken,
  token_secret: twitterSecretAccessToken
};

const twitterId =
    twitterAccessToken.substring(0, twitterAccessToken.indexOf('-'));
const client = new SessionsClient(
    {apiEndpoint: locationId + '-dialogflow.googleapis.com'});

const listener = app.listen(process.env.PORT, function() {
  console.log(
      'Your Twitter integration server is listening on port ' +
      listener.address().port);
  init();
});

process.on('SIGTERM', () => {
  listener.close(async () => {
    deleteSubscription();
    await deleteWebhooksByUrl(targetUrl);
    console.log('Closing http server.');
    process.exit(0);
  });
});

// Converts Twitter request to a detectIntent request.
function twitterToDetectIntent(message, sessionPath) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
      },
      languageCode,
    }
  };

  return request;
}

/**
 * Takes as input a request from twitter and converts the request to
 * detectIntent request which is used to call the detectIntent() function
 * and finally output the response given by detectIntent().
 */
async function detectIntentResponse(message, userId) {
  const sessionId = userId;
  const sessionPath = client.projectLocationAgentSessionPath(
      projectId, locationId, agentId, sessionId);
  console.info(sessionPath);

  var request = twitterToDetectIntent(message, sessionPath);
  var [response] = await client.detectIntent(request);
  console.log(JSON.stringify(response))
  return response;
};

function sendMessage(text, recipientId) {
  request.post(
      'https://api.twitter.com/1.1/direct_messages/events/new.json', {
        oauth: twitterOAuth,
        json: {
          event: {
            type: 'message_create',
            message_create: {
              target: {recipient_id: recipientId},
              message_data: {
                text: text,
              }
            }
          }
        }
      },
      function(err, resp, body) {
        if (err) {
          console.eror('Failed to send message: ' + err);
        }
      });
}

function sendStatus(text, tweetId) {
  // Tweets must be less than 280 characters. See documentation below.
  // https://developer.twitter.com/en/docs/developer-utilities/twitter-text.html
  const parsedTweet = twitterText.parseTweet(text);
  if (parsedTweet.valid) {
    request.post(
        'https://api.twitter.com/1.1/statuses/update.json', {
          oauth: twitterOAuth,
          form: {status: text, in_reply_to_status_id: tweetId},
        },
        function(err, resp, body) {
          if (err) {
            console.error(err);
          }
        });
  } else {
    console.error(
        'Failed to send status because it is longer than 280 characters: ' +
        err);
  }
}

async function init() {
  deleteSubscription();
  await deleteWebhooksByUrl(targetUrl);
  await registerWebhook();
  registerSubscription();
}

function registerWebhook() {
  return new Promise((resolve, reject) => {
    request.post(
        'https://api.twitter.com/1.1/account_activity/all/' + environmentName +
            '/webhooks.json',
        {oauth: twitterOAuth, form: {url: targetUrl}},
        function(err, resp, body) {
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
  request.post(
      'https://api.twitter.com/1.1/account_activity/all/' + environmentName +
          '/subscriptions.json',
      {
        oauth: twitterOAuth,
      },
      function(err, resp, body) {
        if (err) {
          console.error('Failed to register subscription: ' + err);
        }
      });
}

function listWebhooks(url) {
  return new Promise((resolve, reject) => {
    request.get(
        'https://api.twitter.com/1.1/account_activity/all/webhooks.json',
        {oauth: twitterOAuth}, function(err, resp, body) {
          if (err) {
            console.error('Failed to check webhooks: ' + err);
            reject(err);
          }
          const environments = JSON.parse(body).environments;
          if (Array.isArray(environments)) {
            const environment = environments.find((element) => {
              return element.environment_name === environmentName;
            });
            if (environment) {
              const webhooks =
                  environment.webhooks.filter((value, index, arr) => {
                    return value.url === url;
                  });
              resolve(webhooks);
            }
            resolve([]);
          }
        });
  });
}

function deleteWebhookById(webhookId) {
  return new Promise((resolve, reject) =>{
    request.delete(
        'https://api.twitter.com/1.1/account_activity/all/' + environmentName +
            '/webhooks/' + webhookId + '.json',
        {oauth: twitterOAuth}, function(err, resp, body) {
          if (err) {
            console.error('Failed to delete webhook: ' + err);
            reject(err);
          }
          resolve();
        });
  });
}

async function deleteWebhooksByUrl(targetUrl) {
  const webhooks = await listWebhooks(targetUrl);
  for (webhook of webhooks) {
    if (webhook.id) {
      await deleteWebhookById(webhook.id);
    }
  }
}

function deleteSubscription() {
  request.delete(
      'https://api.twitter.com/1.1/account_activity/all/' + environmentName +
          '/subscriptions.json',
      {oauth: twitterOAuth}, function(err, resp, body) {
        if (err) {
          console.error('Failed to delete subscriptions: ' + err);
        }
      });
}

app.post('/', async function(req, res) {
  if (Array.isArray(req.body.direct_message_events) &&
      req.body.direct_message_events.length > 0) {
    const message = req.body.direct_message_events[0];
    const text = message.message_create.message_data.text;
    const senderId = message.message_create.sender_id;
    if (senderId !== twitterId) {
      var responses = await detectIntentResponse(text, senderId);

      for (let response of responses.queryResult.responseMessages) {
        if (response.hasOwnProperty('text')) {
          sendMessage(response.text.text.join(), senderId);
        };
      };
      res.sendStatus(200);
    }
  } else if (
      Array.isArray(req.body.tweet_create_events) &&
      req.body.tweet_create_events.length > 0) {
    const message = req.body.tweet_create_events[0];
    const text = message.text;
    const senderId = message.user.id_str;
    if (senderId !== twitterId && message.in_reply_to_user_id_str) {
      var responses = await detectIntentResponse(
          text.replace('@' + message.in_reply_to_screen_name, ''), senderId);
      const screenName = message.user.screen_name;

      for (let response of responses.queryResult.responseMessages) {
        if (response.hasOwnProperty('text')) {
          sendStatus(
              '@' + screenName + ' ' + response.text.text.join(), senderId);
        };
      };
      res.sendStatus(200);
    }
  }
});

// responds to challenge response check verification requests
app.get('/', function(req, res) {
  const crc = req.query.crc_token;
  const hmac = 'sha256=' +
      crypto.createHmac('sha256', twitterSecretAPIKey)
          .update(crc)
          .digest('base64');
  res.json({'response_token': hmac});
});
