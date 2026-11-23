const assert = require('assert');
const crypto = require('crypto');
const {
  createApp,
  deleteWebhookById,
  detectIntentToSparkMessage,
  registerWebhook,
  retrieveMessage,
  sparkToDetectIntent,
} = require('../server.js');

const SECRET = 'test-cx-spark-webhook-secret-0123456789';
const ACCESS_TOKEN = 'test-cx-spark-access-token';

function signBody(rawBody, secret = SECRET) {
  return crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
}

function createFakes(messageResponse = {
  id: 'FUNCTEST_OK_spark_3847',
  personId: 'person-123',
  personEmail: 'alice@example.com',
  text: 'Test Text',
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
    projectLocationAgentSessionPath: (project, location, agent, session) =>
      `projects/${project}/locations/${location}/agents/${agent}/sessions/${session}`,
    detectIntent: async (req) => {
      calls.detectIntent.push(req);
      return [{
        queryResult: {
          responseMessages: [{
            text: {text: ['Test Response Text']},
          }],
        },
      }];
    },
  };

  return {calls, requestClient, sessionClient};
}

describe('sparkToDetectIntent()', () => {
  const message = {
    text: 'Test Text',
  };

  const sessionPath = 'projects/project123/locations/global/agents/12-34-56/environments/global/sessions/123';

  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      text: {
        text: 'Test Text',
      },
      languageCode: 'en',
    },
  };

  it('should converts Spark message to a detectIntent request.', async function() {
    assert.deepStrictEqual(sparkToDetectIntent(
        message, sessionPath), dialogflowRequest);
  });
});

describe('detectIntentToSparkMessage()', () => {
  const sparkTextMessage = {
    toPersonEmail: 'test123@gmail.com',
    text: 'Test Response Text\n',
  };

  const dialogflowResponse = {
    queryResult: {
      text: 'Test Text',
      languageCode: 'en',
      responseMessages: [{
        text: {
          text: 'Test Response Text',
        },
      }],
    },
  };

  const message = {
    email: 'test123@gmail.com',
  };

  it('should converts detectIntent response to a Spark text message.', async function() {
    assert.deepStrictEqual(detectIntentToSparkMessage(
        dialogflowResponse, message), sparkTextMessage);
  });
});

describe('Spark CX webhook integration', function() {
  let server;
  let baseUrl;
  const savedEnv = {};
  const envKeys = [
    'SPARK_WEBHOOK_SECRET',
    'PROJECT_ID',
    'LOCATION_ID',
    'AGENT_ID',
  ];

  beforeEach(function() {
    for (const key of envKeys) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    process.env.PROJECT_ID = 'project123';
    process.env.LOCATION_ID = 'global';
    process.env.AGENT_ID = 'agent456';
  });

  afterEach(function(done) {
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
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

  it('processes a validly signed webhook and sends Dialogflow CX reply', async function() {
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
    assert.strictEqual(fakes.calls.detectIntent.length, 1);
    assert.strictEqual(
        fakes.calls.detectIntent[0].session,
        'projects/project123/locations/global/agents/agent456/sessions/person-123');
    assert.strictEqual(fakes.calls.post.length, 1);
    assert.deepStrictEqual(fakes.calls.post[0].opts.json, {
      toPersonEmail: 'alice@example.com',
      text: 'Test Response Text\n',
    });
  });

  it('ignores messages sent by webex.bot without calling Dialogflow CX', async function() {
    const fakes = createFakes({
      id: 'bot-msg-1',
      personId: 'bot-1',
      personEmail: 'cx-bot@webex.bot',
      text: 'self message',
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

  it('rejects unauthenticated webhook requests with 403', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: '../webhooks'}});
    const response = await postWebhook(rawBody);

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
    assert.strictEqual(fakes.calls.detectIntent.length, 0);
  });

  it('rejects requests when webhook secret is unset or placeholder', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: 'your-spark-webhook-secret',
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const rawBody = JSON.stringify({data: {id: 'msg-123'}});
    const response = await postWebhook(rawBody, {
      'X-Spark-Signature': signBody(rawBody, 'your-spark-webhook-secret'),
    });

    assert.strictEqual(response.status, 403);
    assert.strictEqual(fakes.calls.get.length, 0);
  });

  it('rejects path-traversal data.id ("../webhooks" and "..") even when signed', async function() {
    const fakes = createFakes();
    await startApp({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      requestClient: fakes.requestClient,
      sessionClient: fakes.sessionClient,
    });

    const traversalBody = JSON.stringify({data: {id: '../webhooks'}});
    const res1 = await postWebhook(traversalBody, {
      'X-Spark-Signature': signBody(traversalBody),
    });
    assert.strictEqual(res1.status, 400);

    const dotDotBody = JSON.stringify({data: {id: '..'}});
    const res2 = await postWebhook(dotDotBody, {
      'X-Spark-Signature': signBody(dotDotBody),
    });
    assert.strictEqual(res2.status, 400);
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
        'content-type': 'application/json; charset=utf-16le',
        'X-Spark-Signature': signBody(rawBody),
      },
      body: rawBody,
    });

    assert.strictEqual(response.status, 415);
    assert.strictEqual(fakes.calls.get.length, 0);
  });
});

describe('Spark CX Webex API helpers', function() {
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

  it('registerWebhook includes secret and refuses placeholder secrets', function() {
    const fakes = createFakes();
    assert.strictEqual(registerWebhook({
      webhookSecret: 'your-spark-webhook-secret',
      accessToken: ACCESS_TOKEN,
      targetUrl: 'https://bot.example.com/',
      requestClient: fakes.requestClient,
    }), false);
    assert.strictEqual(fakes.calls.post.length, 0);

    assert.strictEqual(registerWebhook({
      webhookSecret: SECRET,
      accessToken: ACCESS_TOKEN,
      targetUrl: 'https://bot.example.com/',
      requestClient: fakes.requestClient,
    }), true);
    assert.strictEqual(fakes.calls.post.length, 1);
    assert.strictEqual(fakes.calls.post[0].opts.json.secret, SECRET);
  });
});
