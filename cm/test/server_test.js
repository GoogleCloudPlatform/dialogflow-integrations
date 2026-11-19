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
const {spawnSync} = require('child_process');
const path = require('path');
const {createApp, parseAllowedSenders} = require('../server.js');

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

const inboundMessage = () => ({
  from: {number: '+15550000001', name: ''},
  to: {number: '3669'},
  message: {text: 'hello', media: {mediaUri: '', contentType: '', title: ''}},
  channel: 'SMS',
});

/** Records every call that would reach Dialogflow or CM.com. */
function createFakes() {
  const calls = {detectIntent: [], sent: []};
  const sessionClient = {
    detectIntent: async (text, sessionId, payload) => {
      calls.detectIntent.push({text, sessionId, payload});
      return {
        fulfillmentText: 'reply',
        fulfillmentMessages: [{text: {text: ['reply']}}],
      };
    },
  };
  const messagingApi = {
    createMessage: () => {
      const message = {};
      const builder = {
        setMessage: (to, from, text) => {
          Object.assign(message, {to, from, text});
          return builder;
        },
        setAllowedChannels: (channels) => {
          message.channels = channels;
          return builder;
        },
        setConversation: (conversation) => {
          message.conversation = conversation;
          return builder;
        },
        send: async () => {
          calls.sent.push(message);
          return {body: {details: 'ok'}};
        },
      };
      return builder;
    },
  };
  return {calls, sessionClient, messagingApi};
}

describe('CM.com webhook', function () {
  let server;
  let baseUrl;
  let calls;

  async function start(options = {}) {
    const fakes = createFakes();
    calls = fakes.calls;
    const app = createApp({
      sessionClient: fakes.sessionClient,
      messagingApi: fakes.messagingApi,
      webhookSecret: SECRET,
      ...options,
    });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = 'http://127.0.0.1:' + server.address().port;
  }

  function post(urlPath, body, headers = {}) {
    return fetch(baseUrl + urlPath, {
      method: 'POST',
      headers: {'content-type': 'application/json', ...headers},
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  afterEach(function (done) {
    if (!server) {
      return done();
    }
    server.close(done);
    server = undefined;
  });

  it('answers a message sent to the secret URL', async function () {
    await start();
    const response = await post('/webhook/' + SECRET, inboundMessage());
    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.detectIntent.length, 1);
    assert.strictEqual(calls.detectIntent[0].text, 'hello');
    assert.strictEqual(calls.detectIntent[0].sessionId, '+15550000001');
    assert.deepStrictEqual(calls.sent, [{
      to: ['+15550000001'],
      from: '3669',
      text: 'reply',
      channels: ['SMS'],
      conversation: [{text: 'reply'}],
    }]);
  });

  it('does not echo the CM.com API response to the caller', async function () {
    await start();
    const response = await post('/webhook/' + SECRET, inboundMessage());
    assert.strictEqual(await response.text(), 'OK');
  });

  it('no longer serves the unauthenticated root path', async function () {
    await start();
    const response = await post('/', inboundMessage());
    assert.strictEqual(response.status, 404);
    assert.strictEqual(calls.detectIntent.length, 0);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('rejects a wrong secret', async function () {
    await start();
    const response = await post('/webhook/' + 'x'.repeat(SECRET.length),
        inboundMessage());
    assert.strictEqual(response.status, 401);
    assert.strictEqual(calls.detectIntent.length, 0);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('rejects a secret of a different length', async function () {
    await start();
    const response = await post('/webhook/short', inboundMessage());
    assert.strictEqual(response.status, 401);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('rejects a missing secret', async function () {
    await start();
    const response = await post('/webhook/', inboundMessage());
    assert.strictEqual(response.status, 404);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('does not accept the secret in a header', async function () {
    await start();
    const response = await post('/', inboundMessage(),
        {authorization: 'Bearer ' + SECRET});
    assert.strictEqual(response.status, 404);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('rejects before parsing the request body', async function () {
    await start();
    const response = await post('/webhook/wrong', '{not json');
    assert.strictEqual(response.status, 401);
  });

  it('acknowledges and drops payloads without numbers', async function () {
    await start();
    for (const body of [{}, {message: {text: 'hi'}},
        {from: {number: '+15550000001'}, message: {text: 'hi'}},
        {from: {number: 1}, to: {number: '3669'}, message: {text: 'hi'}},
        {from: {number: '+15550000001'}, to: {number: '3669'}}]) {
      const response = await post('/webhook/' + SECRET, body);
      assert.strictEqual(response.status, 200);
    }
    assert.strictEqual(calls.detectIntent.length, 0);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('handles a message without a media object', async function () {
    await start();
    const body = inboundMessage();
    body.message = {text: ''};
    const response = await post('/webhook/' + SECRET, body);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.detectIntent[0].text, 'unsupported content');
  });

  it('forwards media messages as text', async function () {
    await start();
    const body = inboundMessage();
    body.message = {
      text: '',
      media: {mediaUri: 'https://example.com/a.png', title: 'A picture'},
    };
    await post('/webhook/' + SECRET, body);
    assert.strictEqual(calls.detectIntent[0].text,
        'A picture\n media:https://example.com/a.png');
  });

  it('drops messages for numbers outside the allow list', async function () {
    await start({allowedSenders: ['0031600000000']});
    const response = await post('/webhook/' + SECRET, inboundMessage());
    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.detectIntent.length, 0);
    assert.strictEqual(calls.sent.length, 0);
  });

  it('answers messages for numbers on the allow list', async function () {
    await start({allowedSenders: ['0031600000000', '3669']});
    const response = await post('/webhook/' + SECRET, inboundMessage());
    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.sent.length, 1);
  });

  it('returns 500 when Dialogflow fails', async function () {
    await start({
      sessionClient: {
        detectIntent: async () => {
          throw new Error('boom');
        },
      },
    });
    const response = await post('/webhook/' + SECRET, inboundMessage());
    assert.strictEqual(response.status, 500);
    assert.strictEqual(calls.sent.length, 0);
  });
});

describe('createApp()', function () {
  const fakes = createFakes();

  for (const [name, webhookSecret] of [
    ['a missing secret', undefined],
    ['an empty secret', ''],
    ['a short secret', 'short'],
    ['a secret that needs URL encoding', 'a/b?c#d'.repeat(8)],
  ]) {
    it('throws for ' + name, function () {
      assert.throws(() => createApp({
        sessionClient: fakes.sessionClient,
        messagingApi: fakes.messagingApi,
        webhookSecret,
      }), /CM_WEBHOOK_SECRET/);
    });
  }
});

describe('parseAllowedSenders()', function () {
  it('returns an empty list when unset', function () {
    assert.deepStrictEqual(parseAllowedSenders(undefined), []);
    assert.deepStrictEqual(parseAllowedSenders(''), []);
  });

  it('splits and trims', function () {
    assert.deepStrictEqual(
        parseAllowedSenders(' 3669, 0031600000000 ,,'),
        ['3669', '0031600000000']);
  });
});

describe('server.js started directly', function () {
  it('exits when CM_WEBHOOK_SECRET is not set', function () {
    const env = {...process.env, PORT: '0'};
    delete env.CM_WEBHOOK_SECRET;
    const result = spawnSync(process.execPath,
        [path.join(__dirname, '..', 'server.js')],
        {env, encoding: 'utf8', timeout: 10000});
    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /CM_WEBHOOK_SECRET must be set/);
  });
});
