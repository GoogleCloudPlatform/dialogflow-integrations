import {load} from 'ts-dotenv';
import {
  App,
  SayArguments,
  LogLevel,
  SayFn,
  AppMentionEvent,
  GenericMessageEvent,
} from '@slack/bolt';
import {structToJson} from '../util/struct';
import createClientFromEnv from '../util/client-from-env';
import {strict as assert} from 'assert';
import {Jsonify} from 'type-fest';

const env = load({
  PORT: Number,
  SLACK_SIGNING_SECRET: String,
  SLACK_BOT_TOKEN: String,
  SLACK_LOG_LEVEL: [
    LogLevel.ERROR, // "error"
    LogLevel.WARN, // "warn"
    LogLevel.INFO, // "info"
    LogLevel.DEBUG, // "debug"
  ],
});

const app = new App({
  signingSecret: env.SLACK_SIGNING_SECRET,
  token: env.SLACK_BOT_TOKEN,
  logLevel: LogLevel.DEBUG,
});

const {client, type} = createClientFromEnv();
assert.equal(
  type,
  'CX',
  'The open-source Slack integration only supports Dialogflow CX agents'
);

(async () => {
  const server = await app.start(env.PORT);
  console.log('Slack integration listening', server.address());

  process.on('SIGTERM', () => {
    console.log('Shutting down Slack integration');
    server.close(() => {
      console.log('Slack app server closed');
    });
  });
})();

const handleEvent = async (
  message: GenericMessageEvent | AppMentionEvent,
  say: SayFn
) => {
  if (!message.text) {
    return;
  }

  const isIM = 'channel_type' in message && message.channel_type === 'im';
  const thread_ts = message.thread_ts ?? message.ts;
  const sessionID = isIM ? message.channel : `${message.channel}-${thread_ts}`;
  // remove mentions from the message text (ex: "<@bot> hi" => " hi")
  const text = message.text.replace(/<@\w+>/g, '');
  const messageJson: Jsonify<typeof message> = message;
  const responses = await client.detectIntentSimple(
    text,
    sessionID,
    'SLACK',
    // include payload for webhooks
    messageJson
  );

  const messages =
    responses?.flatMap(
      (message): SayArguments | SayArguments[] =>
        message.text?.text?.flatMap(text => ({text})) ??
        (message.payload ? (structToJson(message.payload) as SayArguments) : [])
    ) ?? [];

  for (const msg of messages) {
    // if we aren't in an im send a reply in a thread
    if (!isIM) {
      msg.thread_ts = message.ts;
    }
    await say(msg);
  }
};

app.message(async ({message, say}) => {
  if (!message.subtype) {
    handleEvent(message, say);
  }
});

app.event('app_mention', async ({event, say}) => {
  handleEvent(event, say);
});
