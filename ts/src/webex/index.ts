import express, {RequestHandler} from 'express';
import {load} from 'ts-dotenv';
import bodyParser from 'body-parser';
import axios from 'axios';
import {CreateMessageRequest, MessageDetails, Webhook} from './api-types';
import {createHmac, randomBytes} from 'crypto';
import {JsonObject} from 'type-fest';
import createClientFromEnv from '../util/client-from-env';
import {structToJson} from '../util/struct';

const DF_WEBHOOK_NAME = 'dialogflow-webhook';

const env = load({
  PORT: Number,
  WEBEX_ACCESS_TOKEN: String,
  WEBHOOK_URL: String,
});

const generateSecret = () => randomBytes(32).toString('hex');

const {client, type} = createClientFromEnv();

const webexAPI = axios.create({
  baseURL: 'https://webexapis.com',
  headers: {
    Authorization: `Bearer ${env.WEBEX_ACCESS_TOKEN}`,
  },
});

const webhookAuth =
  (secret: string): RequestHandler =>
  (req, res, next) => {
    const givenSignature = req.headers['x-spark-signature'];
    const calculatedSignature = createHmac('sha1', secret)
      .update(req.body)
      .digest('hex');

    if (givenSignature !== calculatedSignature) {
      res.type('text/plain').status(403).send('Invalid Webex signature').end();
    } else {
      next();
    }
  };

const fetchWebhooks = async (): Promise<Webhook[]> =>
  (await webexAPI.get<{items: Webhook[]}>('v1/webhooks')).data.items;

const updateWebhook = async (webhook: Webhook): Promise<Webhook> => {
  console.log(`updating existing webhook: ${webhook.id}`);
  const secret = webhook.secret ?? generateSecret();
  const {data} = await webexAPI.put<Webhook>(`v1/webhooks/${webhook.id}`, {
    name: DF_WEBHOOK_NAME,
    targetUrl: env.WEBHOOK_URL,
    status: 'active',
    secret,
  });
  // secret returned by api is incorrect for this endpoint
  return {...data, secret};
};

const createWebhook = async (): Promise<Webhook> => {
  console.log('creating new webhook');
  const {data} = await webexAPI.post<Webhook>('v1/webhooks', {
    name: DF_WEBHOOK_NAME,
    targetUrl: env.WEBHOOK_URL,
    resource: 'messages',
    event: 'created',
    secret: generateSecret(),
  });
  return data;
};

const sendMessage = async (message: CreateMessageRequest) => {
  await webexAPI.post('v1/messages', message);
};

const getWebexResponses = async (
  text: string,
  sessionID: string,
  payload: JsonObject
): Promise<CreateMessageRequest[]> => {
  switch (type) {
    case 'CX': {
      const dfResponses = await client.detectIntentSimple(
        text,
        sessionID,
        'WEBEX',
        // include payload for webhooks
        payload
      );
      return (
        dfResponses?.flatMap(
          (message): CreateMessageRequest | CreateMessageRequest[] =>
            // use text responses or convert payload for rich response as fallback
            message.text?.text?.flatMap(text => ({text})) ??
            (message.payload
              ? (structToJson(message.payload) as CreateMessageRequest)
              : [])
        ) ?? []
      );
    }
    case 'ES': {
      const dfResponses = await client.detectIntentSimple(
        text,
        sessionID,
        undefined,
        // include payload for webhooks
        payload
      );
      return (
        dfResponses?.flatMap(
          (message): CreateMessageRequest | CreateMessageRequest[] =>
            // use text responses or convert payload for rich response as fallback
            message.text?.text?.flatMap(text => ({text})) ??
            (message.payload?.fields?.webex
              ? (structToJson(message.payload).webex as CreateMessageRequest)
              : [])
        ) ?? []
      );
    }
  }
};

(async () => {
  const webhooks = await fetchWebhooks();
  const existingWebhook = webhooks.find(({name}) => name === DF_WEBHOOK_NAME);
  const webhook = existingWebhook
    ? await updateWebhook(existingWebhook)
    : await createWebhook();

  const app = express();

  // authenticate incoming request
  app.use(bodyParser.text({type: 'application/json'}));
  app.use(webhookAuth(webhook.secret));

  // incoming message webhook
  app.post('/', async (req, res, next) => {
    try {
      const {data} = JSON.parse(req.body);
      // don't reply to ourself
      if (data.personEmail.includes('webex.bot')) {
        res.status(200).end();
        return;
      }
      const {data: messageData} = await webexAPI.get<MessageDetails>(
        `/v1/messages/${data.id}`
      );
      const text = messageData.text ?? messageData.markdown ?? messageData.html;
      if (!text) {
        res.status(500).end();
        return;
      }
      const parentID = messageData.parentId ?? messageData.id;
      const sessionID =
        messageData.roomType === 'direct' ? messageData.roomId : parentID;
      const responses = await getWebexResponses(text, sessionID, messageData);
      for (const response of responses) {
        response.roomId = messageData.roomId;
        // reply in thread if outside of direct message
        if (messageData.roomType !== 'direct') {
          response.parentId = parentID;
        }
        await sendMessage(response);
      }
      res.status(200).end();
    } catch (e) {
      next(e);
    }
  });

  const server = app.listen(env.PORT);

  process.on('SIGTERM', () => {
    console.log('Shutting down Webex integration');
    server.close(() => {
      console.log('Webex integration server closed');
    });
  });
})();
