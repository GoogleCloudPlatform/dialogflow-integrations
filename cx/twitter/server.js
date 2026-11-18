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

// Keep the raw request bytes so that the X-Twitter-Webhooks-Signature header,
// which Twitter computes over the exact body it sent, can be verified. Only
// UTF-8 is accepted (what Twitter sends): with any other charset the parsed
// body would differ from the signed bytes.
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (encoding !== 'utf-8') {
      const err = new Error('unsupported charset');
      err.status = 415;
      throw err;
    }
    req.rawBody = buf;
  }
}));

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
          console.error('Failed to send message: ' + err);
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

// Twitter CRC tokens are short opaque strings. Only signing values from this
// alphabet keeps GET / from acting as a signing oracle: the CRC response and
// X-Twitter-Webhooks-Signature share the same key and format, and every
// webhook body accepted by express.json() starts with '{' or '['.
const CRC_TOKEN_PATTERN = /^[A-Za-z0-9+/=_-]{1,256}$/;

// Refuse to sign or verify anything until a real consumer secret is set. The
// placeholder below is public, and an empty or missing key must not be used.
const TWITTER_SECRET_PLACEHOLDER = 'Place you secret consumer key here';

function hasTwitterSecret() {
  return typeof twitterSecretAPIKey === 'string' &&
      twitterSecretAPIKey.length > 0 &&
      twitterSecretAPIKey !== TWITTER_SECRET_PLACEHOLDER;
}

function computeTwitterSignature(data) {
  return 'sha256=' +
      crypto.createHmac('sha256', twitterSecretAPIKey)
          .update(data)
          .digest('base64');
}

function isValidTwitterSignature(req) {
  const signature = req.get('x-twitter-webhooks-signature');
  if (!hasTwitterSecret() || typeof signature !== 'string' || !req.rawBody) {
    return false;
  }
  const expected = Buffer.from(computeTwitterSignature(req.rawBody));
  const actual = Buffer.from(signature);
  return actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected);
}

/**
 * Express middleware that rejects every webhook request that was not signed by
 * Twitter with this app's consumer secret. This endpoint is publicly
 * reachable, so without this check anyone could send forged events.
 * It is not async, so any unexpected error is passed to the error handler
 * instead of becoming an unhandled promise rejection.
 */
function requireTwitterSignature(req, res, next) {
  if (!isValidTwitterSignature(req)) {
    res.status(403).type('text/plain')
        .send('Twitter request validation failed.');
    return;
  }
  next();
}

app.post('/', requireTwitterSignature, async function(req, res) {
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
    }
  }
  res.sendStatus(200);
});

// responds to challenge response check verification requests
app.get('/', function(req, res) {
  if (!hasTwitterSecret()) {
    res.status(500).json({error: 'twitter consumer secret not configured'});
    return;
  }
  const crc = req.query.crc_token;
  if (typeof crc !== 'string' || !CRC_TOKEN_PATTERN.test(crc)) {
    res.status(400).json({error: 'invalid crc_token'});
    return;
  }
  res.json({'response_token': computeTwitterSignature(crc)});
});

// Respond to errors (e.g. malformed or rejected request bodies) with just the
// status code, so stack traces and file paths are never sent to callers.
app.use(function(err, req, res, next) {
  res.sendStatus(err.status || err.statusCode || 500);
});
