const crypto = require('crypto');
const express = require('express');
const request = require('request');

// Uncomment and insert your values here
// const sparkAccessToken = '1234567898-ABCdfghTtaD8dfghdfgh-45sdf65467M';
// const sparkWebhookSecret = 'your-spark-webhook-secret';
// const targetUrl = 'https://example.com';
// const projectId = 'my-project';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en';

// Refuse to register or verify webhooks while the secret is unset, empty, or
// still set to a public placeholder value.
const SPARK_SECRET_PLACEHOLDERS = new Set([
  'Place your spark webhook secret here',
  'your-spark-webhook-secret',
]);
const SPARK_SIGNATURE_PATTERN = /^[0-9a-fA-F]{40}$/;
const SPARK_ID_PATTERN = /^[A-Za-z0-9+=_.-]{1,512}$/;

function getConfiguredAccessToken() {
  if (process.env.SPARK_ACCESS_TOKEN !== undefined) {
    return process.env.SPARK_ACCESS_TOKEN;
  }
  return typeof sparkAccessToken !== 'undefined' ?
      sparkAccessToken :
      undefined;
}

function getConfiguredTargetUrl() {
  if (process.env.SPARK_TARGET_URL !== undefined) {
    return process.env.SPARK_TARGET_URL;
  }
  return typeof targetUrl !== 'undefined' ? targetUrl : undefined;
}

function getConfiguredProjectId() {
  if (process.env.PROJECT_ID !== undefined) {
    return process.env.PROJECT_ID;
  }
  return typeof projectId !== 'undefined' ? projectId : undefined;
}

function getConfiguredLocationId() {
  if (process.env.LOCATION_ID !== undefined) {
    return process.env.LOCATION_ID;
  }
  return typeof locationId !== 'undefined' ? locationId : undefined;
}

function getConfiguredAgentId() {
  if (process.env.AGENT_ID !== undefined) {
    return process.env.AGENT_ID;
  }
  return typeof agentId !== 'undefined' ? agentId : undefined;
}

function getConfiguredLanguageCode() {
  if (process.env.LANGUAGE_CODE !== undefined) {
    return process.env.LANGUAGE_CODE;
  }
  return typeof languageCode !== 'undefined' ? languageCode : 'en';
}

function resolveWebhookSecret(secretOverride) {
  let candidate = secretOverride;
  if (candidate === undefined) {
    if (process.env.SPARK_WEBHOOK_SECRET !== undefined) {
      candidate = process.env.SPARK_WEBHOOK_SECRET;
    } else if (typeof sparkWebhookSecret !== 'undefined') {
      candidate = sparkWebhookSecret;
    }
  }
  if (typeof candidate !== 'string' ||
      candidate.trim().length === 0 ||
      SPARK_SECRET_PLACEHOLDERS.has(candidate)) {
    return null;
  }
  return candidate;
}

function hasSparkSecret(secretOverride) {
  return resolveWebhookSecret(secretOverride) !== null;
}

function computeSparkSignature(rawBody, secret) {
  return crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
}

function isValidSparkSignature(req, secretOverride) {
  const secret = resolveWebhookSecret(secretOverride);
  const signature = req.get('X-Spark-Signature');
  if (!secret ||
      typeof signature !== 'string' ||
      !SPARK_SIGNATURE_PATTERN.test(signature) ||
      !Buffer.isBuffer(req.rawBody)) {
    return false;
  }
  const expected = Buffer.from(
      computeSparkSignature(req.rawBody, secret), 'utf8');
  const actual = Buffer.from(signature.toLowerCase(), 'utf8');
  return actual.length === expected.length &&
      crypto.timingSafeEqual(actual, expected);
}

/**
 * Validates that a Webex resource ID is a single safe path segment and cannot
 * traverse paths (e.g. '..' or '../webhooks') or inject query/fragment parts.
 */
function isValidSparkId(id) {
  return typeof id === 'string' &&
      SPARK_ID_PATTERN.test(id) &&
      id !== '.' &&
      id !== '..' &&
      !id.includes('..');
}

/**
 * Express middleware that rejects every webhook request that was not signed by
 * Webex with the configured webhook secret.
 */
function createRequireSparkSignature(secretOverride) {
  return function requireSparkSignature(req, res, next) {
    if (!isValidSparkSignature(req, secretOverride)) {
      res.status(403).type('text/plain')
          .send('Spark request validation failed.');
      return;
    }
    next();
  };
}

const requireSparkSignature = createRequireSparkSignature();

// Converts Spark message to a detectIntent request.
function sparkToDetectIntent(message, sessionPath) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message.text,
      },
      languageCode: getConfiguredLanguageCode(),
    },
  };

  return request;
}

// Converts detectIntent response to a Spark text message.
function detectIntentToSparkMessage(response, message) {
  let agentResponse = '';

  for (const msg of response.queryResult.responseMessages) {
    if (msg.text) {
      agentResponse += `${msg.text.text}\n`;
    }
  }

  if (agentResponse.length > 0) {
    const request = {
      toPersonEmail: message.email,
      text: agentResponse,
    };
    return request;
  }
}

function createDialogflowCxClient() {
  const {SessionsClient} = require('@google-cloud/dialogflow-cx');
  const activeLocationId = getConfiguredLocationId();
  if (!activeLocationId) {
    throw new Error(
        'locationId is not configured. Uncomment and fill in the variables ' +
        'at the top of cx/spark/server.js.');
  }
  /**
   * Example for regional endpoint:
   *   const locationId = 'us-central1'
   *   const client = new SessionsClient({
   *     apiEndpoint: 'us-central1-dialogflow.googleapis.com',
   *   })
   */
  return new SessionsClient({
    apiEndpoint: activeLocationId + '-dialogflow.googleapis.com',
  });
}

let defaultCxClient;

function getDefaultDialogflowCxClient() {
  if (!defaultCxClient) {
    defaultCxClient = createDialogflowCxClient();
  }
  return defaultCxClient;
}

/**
 * This function calls Dialogflow CX API to retrieve the response
 * https://cloud.google.com/dialogflow/cx/docs/quick/api
 */
async function detectIntentText(message, cxClient) {
  const activeClient = cxClient || getDefaultDialogflowCxClient();
  const sessionId = message.payload.personId;
  const sessionPath = activeClient.projectLocationAgentSessionPath(
      getConfiguredProjectId(),
      getConfiguredLocationId(),
      getConfiguredAgentId(),
      sessionId,
  );
  console.info(sessionPath);

  const detectRequest = sparkToDetectIntent(message, sessionPath);
  const [response] = await activeClient.detectIntent(detectRequest);

  return response;
}

function createApp(options = {}) {
  const app = express();
  const activeSecret = options.webhookSecret;
  const retrieveMessageFn = options.retrieveMessage ||
      ((id) => retrieveMessage(id, {
        requestClient: options.requestClient,
        accessToken: options.accessToken,
      }));
  const sendMessageFn = options.sendMessage ||
      ((msg) => sendMessage(msg, {
        requestClient: options.requestClient,
        accessToken: options.accessToken,
      }));
  const activeCxClient = options.sessionClient;
  const detectIntentFn = options.detectIntentText ||
      (async (msg) => detectIntentText(msg, activeCxClient));

  // Keep the raw request bytes so that the X-Spark-Signature header, which
  // Webex computes over the exact UTF-8 JSON body it sent, can be verified.
  app.use(express.json({
    verify: (req, res, buf, encoding) => {
      if (encoding !== 'utf-8') {
        const err = new Error('unsupported charset');
        err.status = 415;
        throw err;
      }
      req.rawBody = buf;
    },
  }));

  const signatureMiddleware = activeSecret !== undefined ?
      createRequireSparkSignature(activeSecret) :
      requireSparkSignature;

  app.post('/', signatureMiddleware, async function(req, res) {
    const messageId = req.body && req.body.data && req.body.data.id;
    if (!isValidSparkId(messageId)) {
      res.sendStatus(400);
      return;
    }
    try {
      const message = await retrieveMessageFn(messageId);
      if (message == null) {
        res.sendStatus(200);
        return;
      }
      const dialogflowResponse = await detectIntentFn(message);
      const sparkMessage =
          detectIntentToSparkMessage(dialogflowResponse, message);
      if (sparkMessage) {
        sendMessageFn(sparkMessage);
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Failed to handle Spark webhook :' + err);
      res.sendStatus(500);
    }
  });

  // Respond to errors (e.g. malformed or rejected request bodies) with just
  // the status code, so stack traces and file paths are never sent to callers.
  app.use(function(err, req, res, next) {
    res.sendStatus(err.status || err.statusCode || 500);
  });

  return app;
}

async function init(options = {}) {
  const activeTargetUrl = options.targetUrl !== undefined ?
      options.targetUrl :
      getConfiguredTargetUrl();
  await deleteWebhooksByUrl(activeTargetUrl, options);
  registerWebhook(options);
}

function sendMessage(message, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  httpClient.post('https://api.ciscospark.com/v1/messages', {
    auth: {
      bearer: accessToken,
    },
    json: message,
  }, (err, resp, body) => {
    if (err) {
      console.error('Failed to send message :' + err);
    }
  });
}

function registerWebhook(options = {}) {
  const secret = resolveWebhookSecret(options.webhookSecret);
  if (!secret) {
    console.error(
        'Spark webhook secret is not configured; refusing to register ' +
        'an unauthenticated webhook.');
    return false;
  }
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  const activeTargetUrl = options.targetUrl !== undefined ?
      options.targetUrl :
      getConfiguredTargetUrl();
  httpClient.post('https://api.ciscospark.com/v1/webhooks', {
    auth: {
      bearer: accessToken,
    },
    json: {
      'name': 'test',
      'targetUrl': activeTargetUrl,
      'resource': 'messages',
      'event': 'created',
      'secret': secret,
    },
  }, (err, resp, body) => {
    if (err) {
      console.error('Failed to create Webhook :' + err);
    }
  });
  return true;
}

async function deleteWebhooksByUrl(webhookTargetUrl, options = {}) {
  const webhooks = await listWebhooks(webhookTargetUrl, options);
  for (const webhook of webhooks) {
    if (webhook && webhook.id) {
      await deleteWebhookById(webhook.id, options);
    }
  }
}

function deleteWebhookById(webhookId, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  return new Promise((resolve, reject) => {
    if (!isValidSparkId(webhookId)) {
      reject(new Error('Invalid Spark webhookId'));
      return;
    }
    httpClient.delete(
        'https://api.ciscospark.com/v1/webhooks/' +
            encodeURIComponent(webhookId), {
          auth: {
            bearer: accessToken,
          },
        }, (err, resp, body) => {
          if (err) {
            console.error('Failed to delete webhook :' + err);
            reject(err);
            return;
          }
          resolve();
        });
  });
}

function listWebhooks(webhookTargetUrl, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  return new Promise((resolve, reject) => {
    httpClient.get('https://api.ciscospark.com/v1/webhooks?max=100', {
      auth: {
        bearer: accessToken,
      },
    }, (err, resp, body) => {
      if (err) {
        console.error('Failed to check webhooks :' + err);
        reject(err);
        return;
      }
      if (!resp ||
          (typeof resp.statusCode === 'number' &&
              (resp.statusCode < 200 || resp.statusCode >= 300))) {
        reject(new Error('Failed to check webhooks: status ' +
            (resp && resp.statusCode)));
        return;
      }
      let webhooks;
      try {
        const raw = resp.body !== undefined ? resp.body : body;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        webhooks = parsed && parsed.items;
      } catch (parseErr) {
        reject(parseErr);
        return;
      }
      if (Array.isArray(webhooks)) {
        resolve(webhooks.filter((value) => {
          return value && value.targetUrl === webhookTargetUrl;
        }));
        return;
      }
      resolve([]);
    });
  });
}

function retrieveMessage(messageId, options = {}) {
  const httpClient = options.requestClient || request;
  const accessToken = options.accessToken !== undefined ?
      options.accessToken :
      getConfiguredAccessToken();
  return new Promise((resolve, reject) => {
    if (!isValidSparkId(messageId)) {
      reject(new Error('Invalid Spark messageId'));
      return;
    }
    httpClient.get(
        'https://api.ciscospark.com/v1/messages/' +
            encodeURIComponent(messageId), {
          auth: {
            bearer: accessToken,
          },
        }, (err, resp, body) => {
          if (err) {
            console.error('Failed to retrieve message :' + err);
            reject(err);
            return;
          }
          if (!resp ||
              (typeof resp.statusCode === 'number' &&
                  (resp.statusCode < 200 || resp.statusCode >= 300))) {
            reject(new Error('Failed to retrieve message: status ' +
                (resp && resp.statusCode)));
            return;
          }
          let payload;
          try {
            const raw = resp.body !== undefined ? resp.body : body;
            payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch (parseErr) {
            console.error('Failed to parse message :' + parseErr);
            reject(parseErr);
            return;
          }
          if (!payload || typeof payload.personEmail !== 'string') {
            resolve(null);
            return;
          }
          // checks to make sure the message is not from itself
          if (!payload.personEmail.includes('webex.bot')) {
            resolve({
              text: payload.text,
              email: payload.personEmail,
              payload: payload,
            });
          } else {
            resolve(null);
          }
        });
  });
}

const app = createApp();

// Upon start a webhook is registered with spark
// Upon closure the webhook is removed from spark
if (require.main === module) {
  getDefaultDialogflowCxClient();
  const listener = app.listen(process.env.PORT, async function() {
    try {
      await init();
    } catch (err) {
      console.error('Failed to initialize Spark webhook :' + err);
    }
    console.log('Your Spark integration server is listening on port ' +
        listener.address().port);
  });

  process.on('SIGTERM', () => {
    listener.close(async () => {
      console.log('Closing http server.');
      try {
        await deleteWebhooksByUrl(getConfiguredTargetUrl());
      } catch (err) {
        console.error('Failed to clean up Spark webhooks :' + err);
      }
      process.exit(0);
    });
  });
}

module.exports = {
  app,
  computeSparkSignature,
  createApp,
  createRequireSparkSignature,
  deleteWebhookById,
  detectIntentToSparkMessage,
  hasSparkSecret,
  isValidSparkId,
  isValidSparkSignature,
  registerWebhook,
  requireSparkSignature,
  retrieveMessage,
  sparkToDetectIntent,
};
