/**
 * Copyright 2026 Google LLC
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
const assert = require('assert');
const crypto = require('crypto');
const {
  createApp,
  deleteWebhookById,
  registerWebhook,
  retrieveMessage,
} = require('../server.js');

const SECRET = 'test-spark-webhook-secret-0123456789';
const ACCESS_TOKEN = 'test-spark-access-token';

function signBody(rawBody, secret = SECRET) {
  return crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
}

function createFakes(messageResponse = {
  id: 'FUNCTEST_OK_spark_3847',
  personEmail: 'alice@example.com',
  text: 'hello bot',
}) {
  const calls = {
    get: [],
    post: [],
    delete: [],
    detectIntent: [],
  };

  const requestClient = {
    get: (url, opts, cb) => {
      calls.get.push({url, opts});
      cb(null, {statusCode: 200, body: JSON.stringify(messageResponse)});
    },
    post: (url, opts, cb) => {
      calls.post.push({url, opts});
      if (cb) {
        cb(null, {statusCode: 200, body: '{}'});
      }
    },
    delete: (url, opts, cb) => {
      calls.delete.push({url, opts});
      if (cb) {
        cb(null, {statusCode: 204, body: ''});
      }
    },
  };

  const sessionClient = {
    detectIntent: async (text, sessionId, payload) => {
      calls.detectIntent.push({text, sessionId, payload});
      return {fulfillmentText: 'hello from dialogflow'};
    },
  };

  return {calls, requestClient, sessionClient};
}

describe('Spark ES webhook integration', function() {
  let server;
  let baseUrl;
  let savedEnvSecret;

  beforeEach(function() {
    savedEnvSecret = process.env.SPARK_WEBHOOK_SECRET;
    delete process.env.SPARK_WEBHOOK_SECRET;
  });

  afterEach(function(done) {
    if (savedEnvSecret === undefined) {
      delete process.env.SPARK_WEBHOOK_SECRET;
    } else {
      process.env.SPARK_WEBHOOK_SECRET = savedEnvSecret;
    }
    if (!server) {
      done();
      return;
    }
    server.close(() => {
      server = undefined;
      done();
    });
  });

  async function startApp(options = {}) {
    const app = createApp(options);
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = 'http://127.0.0.1:' + server.address().port;
  }

  function postWebhook(rawBody, headers = {}) {
    return fetch(baseUrl + '/', {
      method: 'POST',
      headers: {'content-type': 'application/json', ...headers},
      body: rawBody,
    });
  }

  it('processes a validly signed webhook and sends Dialogflow reply', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'FUNCTEST_OK_spark_3847'}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody),
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fakes.calls.get.length, 1);
    assert.strictEqual(
        fakes.calls.get[0].url,
        'https://api.ciscospark.com/v1/messages/FUNCTEST_OK_spark_3847');
    assert.deepStrictEqual(
        fakes.calls.get[0].opts,
        {auth: {bearer: ACCESS_TOKEN}});
    assert.strictEqual(fakes.calls.detectIntent.length, 1);
    assert.strictEqual(fakes.calls.detectIntent[0].text, 'hello bot');
    assert.strictEqual(
        fakes.calls.detectIntent[0].sessionId, 'alice@example.com');
    assert.strictEqual(fakes.calls.post.length, 1);
    assert.deepStrictEqual(fakes.calls.post[0].opts.json, {
      toPersonEmail: 'alice@example.com',
      text: 'hello from dialogflow',
    });
  });

  it('accepts uppercase hex X-Spark-Signature header values', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'Y2lzY29zcGFyazovL3VzL01FU1NBR0UvMTIzNA=='}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody).toUpperCase(),
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
        fakes.calls.get[0].url,
        'https://api.ciscospark.com/v1/messages/Y2lzY29zcGFyazovL3VzL01FU1NBR0UvMTIzNA%3D%3D');
  });

  it('ignores messages sent by webex.bot without calling Dialogflow', async function() {
    const fakes = createFakes({
      id: 'bot-msg-1',
      personEmail: 'my-assistant@webex.bot',
      text: 'echo',
    });
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'bot-msg-1'}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody),
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fakes.calls.get.length, 1);
    assert.strictEqual(fakes.calls.detectIntent.length, 0);
    assert.strictEqual(fakes.calls.post.length, 0);
  });

  it('rejects unauthenticated webhook requests before calling Webex or Dialogflow', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: '../webhooks?q=VHSPARKSSRF'}});
    const response = await postWebhook(rawBody);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
    assert.strictEqual(fakes.calls.detectIntent.length, 0);
    assert.strictEqual(fakes.calls.post.length, 0);
  });

  it('rejects requests signed with the wrong webhook secret', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'msg-123'}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody, 'wrong-secret'),
    });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('rejects requests when body is modified after signing', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const signedBody = JSON.stringify({data: {id: 'msg-legit'}});
    const tamperedBody = JSON.stringify({data: {id: '../webhooks'}});
    const response = await postWebhook(tamperedBody, {
      'X-Spark-Signature': signBody(signedBody),
    });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('rejects requests signed with the default public placeholder secret', async function() {
    const fakes = createFakes();
    await startApp({
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const placeholder = 'Place your spark webhook secret here';
    const rawBody = JSON.stringify({data: {id: 'msg-123'}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody, placeholder),
    });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('rejects requests when webhook secret is empty', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: '',
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'msg-123'}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody, ''),
    });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('rejects path-traversal data.id even with a valid signature', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const traversalBody = JSON.stringify({data: {id: '../webhooks'}});
    const response = await postWebhook(traversalBody, {
      'X-Spark-Signature': signBody(traversalBody),
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(fakes.calls.get.length, 0);
    assert.strictEqual(fakes.calls.detectIntent.length, 0);
  });

  it('rejects dot-segment data.id ("..") even with a valid signature', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const dotSegmentBody = JSON.stringify({data: {id: '..'}});
    const response = await postWebhook(dotSegmentBody, {
      'X-Spark-Signature': signBody(dotSegmentBody),
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('rejects non-UTF-8 JSON webhook bodies with 415', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'msg-123'}});
    const response = await fetch(baseUrl + '/', {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=iso-8859-1',
        'X-Spark-Signature': signBody(rawBody),
      },
      body: rawBody,
    });

    assert.strictEqual(response.status, 415);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('returns 400 without stack traces on malformed JSON', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = '{invalid json';
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody),
    });
    const text = await response.text();

    assert.strictEqual(response.status, 400);
    assert.ok(!text.includes('SyntaxError'));
    assert.strictEqual(fakes.calls.get.length, 0);
  });
});

describe('Spark ES Webex API helpers', function() {
  it('retrieveMessage rejects path traversal IDs without issuing HTTP requests', async function() {
    const fakes = createFakes();
    await assert.rejects(
        () => retrieveMessage('../webhooks', {
          requestClient: fakes.requestClient,
          accessToken: ACCESS_TOKEN,
        }),
        /Invalid Spark messageId/);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('deleteWebhookById rejects path traversal IDs without issuing HTTP requests', async function() {
    const fakes = createFakes();
    await assert.rejects(
        () => deleteWebhookById('../messages/123', {
          requestClient: fakes.requestClient,
          accessToken: ACCESS_TOKEN,
        }),
        /Invalid Spark webhookId/);
    assert.strictEqual(fakes.calls.delete.length, 0);
  });

  it('registerWebhook includes the configured secret in the Webex registration payload', function() {
    const fakes = createFakes();
    const registered = registerWebhook({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      targetUrl: 'https://bot.example.com/',
      requestClient: fakes.requestClient,
    });

    assert.strictEqual(registered, true);
    assert.strictEqual(fakes.calls.post.length, 1);
    assert.strictEqual(
        fakes.calls.post[0].url, 'https://api.ciscospark.com/v1/webhooks');
    assert.deepStrictEqual(fakes.calls.post[0].opts.json, {
      name: 'test',
      targetUrl: 'https://bot.example.com/',
      resource: 'messages',
      event: 'created',
      secret: SECRET,
    });
  });

  it('registerWebhook refuses to register when secret is placeholder or unset', function() {
    const fakes = createFakes();
    const registered = registerWebhook({
      webhookSecret: 'Place your spark webhook secret here',
      accessToken: ACCESS_TOKEN,
      targetUrl: 'https://bot.example.com/',
      requestClient: fakes.requestClient,
    });

    assert.strictEqual(registered, false);
    assert.strictEqual(fakes.calls.post.length, 0);
  });
});
