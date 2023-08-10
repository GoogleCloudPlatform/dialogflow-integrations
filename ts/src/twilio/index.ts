import {load} from 'ts-dotenv';
import createClientFromEnv from '../util/client-from-env';
import express from 'express';
import bodyParser from 'body-parser';
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse';
import {structToJson} from '../util/struct';
import twilio from 'twilio';
import {JsonObject} from 'type-fest';

const env = load({
  PORT: Number,
  // Used by twilio library internally, asserting their existence here
  TWILIO_ACCOUNT_SID: String,
  TWILIO_AUTH_TOKEN: String,
});

const {client, type} = createClientFromEnv();

const app = express();

app.use(bodyParser.urlencoded({extended: false}));

// If we are deployed on Cloud Run, we can trust the proxy
// needed for signature validation ref: https://github.com/twilio/twilio-node/issues/321#issuecomment-368405597
if (process.env.GCP_PROJECT) {
  app.enable('trust proxy');
}

// Authenticate twilio signature
app.use(twilio.webhook());

type TwilioMessage = {body: string; media?: string};

const getTwilioResponses = async (
  text: string,
  sessionID: string,
  body: JsonObject
): Promise<TwilioMessage[]> => {
  switch (type) {
    case 'CX': {
      const dfResponses = await client.detectIntentSimple(
        text,
        sessionID,
        'TWILIO',
        // include payload for webhooks
        body
      );
      return (
        dfResponses?.flatMap(
          (message): TwilioMessage | TwilioMessage[] =>
            // use text responses or convert payload for rich response as fallback
            message.text?.text?.flatMap(text => ({body: text})) ??
            (message.payload
              ? (structToJson(message.payload) as TwilioMessage)
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
        body
      );
      return (
        dfResponses?.flatMap(
          (message): TwilioMessage | TwilioMessage[] =>
            // use text responses or convert payload for rich response as fallback
            message.text?.text?.flatMap(text => ({body: text})) ??
            (message.payload?.fields?.twilio
              ? (structToJson(message.payload).twilio as TwilioMessage)
              : [])
        ) ?? []
      );
    }
  }
};

app.post('/', async (req, res) => {
  const {body} = req;
  const text = body.Body;
  const sessionID = body.From;
  const twilioResponses = await getTwilioResponses(text, sessionID, body);

  const twiml = new MessagingResponse();
  twilioResponses.forEach(({body, media}) => {
    const message = twiml.message(body);
    if (media) {
      message.media(media);
    }
  });

  console.log(twiml);

  res.status(200).type('text/xml').send(twiml.toString());
});

const server = app.listen(env.PORT);

process.on('SIGTERM', () => {
  console.log('Shutting down Twilio integration');
  server.close(() => {
    console.log('Twilio integration server closed');
  });
});
