import express from 'express';
import {load} from 'ts-dotenv';
import {Bot, Events, MessageType} from 'viber-bot';
import {createLogger, transports} from 'winston';
import createClientFromEnv from '../util/client-from-env';
import {convertCXResponses, convertESResponses} from './message-util';
import {JsonObject} from 'type-fest';

const env = load({
  PORT: Number,
  WEBHOOK_URL: String,
  VIBER_TOKEN: String,
  VIBER_LOG_LEVEL: [
    'error' as const,
    'warn' as const,
    'info' as const,
    'http' as const,
    'verbose' as const,
    'debug' as const,
    'silly' as const,
  ],
  BOT_NAME: String,
  BOT_AVATAR: String,
});

const {client, type} = createClientFromEnv();

const app = express();

const logger = createLogger({
  level: env.VIBER_LOG_LEVEL,
  transports: [new transports.Console()],
});

const bot = new Bot({
  authToken: env.VIBER_TOKEN,
  name: env.BOT_NAME,
  avatar: env.BOT_NAME,
  logger,
  registerToEvents: [Events.CONVERSATION_STARTED, Events.MESSAGE_RECEIVED],
});

app.use('/', bot.middleware());

const server = app.listen(env.PORT, () => {
  console.log('Viber integration server is listening on', server.address());
  bot.setWebhook(env.WEBHOOK_URL);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Viber integration');
  server.close(() => {
    console.log('Viber integration server closed');
  });
});

const getViberResponses = async (
  text: string,
  sessionID: string,
  payload: JsonObject
): Promise<MessageType[]> => {
  switch (type) {
    case 'CX': {
      const dfResponses = await client.detectIntentSimple(
        text,
        sessionID,
        'VIBER',
        payload
      );
      return dfResponses
        ? convertCXResponses(dfResponses, bot._messageFactory)
        : [];
    }
    case 'ES': {
      const dfResponses = await client.detectIntentSimple(
        text,
        sessionID,
        'VIBER'
      );
      return dfResponses
        ? convertESResponses(dfResponses, bot._messageFactory)
        : [];
    }
  }
};

const getViberResponsesEvent = async (
  event: string,
  sessionID: string,
  payload: JsonObject
): Promise<MessageType[]> => {
  switch (type) {
    case 'CX': {
      const dfResponses = await client.detectIntentSimpleEvent(
        event,
        sessionID,
        undefined,
        payload
      );
      return dfResponses
        ? convertCXResponses(dfResponses, bot._messageFactory)
        : [];
    }
    case 'ES': {
      const dfResponses = await client.detectIntentSimpleEvent(
        event,
        sessionID,
        undefined,
        payload
      );
      return dfResponses
        ? convertESResponses(dfResponses, bot._messageFactory)
        : [];
    }
  }
};

bot.on(Events.MESSAGE_RECEIVED, async (message, response) => {
  if ('text' in message && message.text) {
    const sessionID = response.userProfile.id;
    const responses = await getViberResponses(
      message.text,
      sessionID,
      // include payload for webhooks
      message.toJson()
    );
    await response.send(responses);
  }
});

bot.on(Events.CONVERSATION_STARTED, async response => {
  const sessionID = response.userProfile.id;
  const responses = await getViberResponsesEvent(
    'VIBER_WELCOME',
    sessionID,
    // include payload for webhooks
    {...response.userProfile}
  );
  await response.send(responses);
});
