
/*
* TODO (developer): 
* Create file ".env" in this directory with the following contents:
*
* TWILIO_ACCOUNT_SID = ''
* TWILIO_AUTH_TOKEN = ''
* PROJECT_ID = ''
* LOCATION = ''
* AGENT_ID = ''
* LANGUAGE_CODE = '' 
*/

const express = require('express');
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
const twilio = require('twilio');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const path = require('path')
const bodyParser = require('body-parser');
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const sessionClient = new SessionsClient(
    {apiEndpoint: process.env.LOCATION + "-dialogflow.googleapis.com"}
);

const app = express();

// Cloud Run (and tunnels such as ngrok) terminate TLS in front of this server.
// Trust X-Forwarded-Proto so that req.protocol is the scheme Twilio called,
// which is part of the URL that Twilio signs.
app.set('trust proxy', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const listener = app.listen(process.env.PORT, () => {
    console.log('Your Dialogflow integration server is listening on port ' +
    listener.address().port);
});

/*
*  Converts a Twilio POST request to a JSON payload for the Dialogflow's DetectIntent endpoint
*  @param {JSON} twilioReq
*  @return {JSON} 
*/
const twilioToDetectIntent = (twilioReq) => {
    const sessionId = twilioReq.body.To;
    const sessionPath = sessionClient.projectLocationAgentSessionPath (
        process.env.PROJECT_ID,
        process.env.LOCATION,
        process.env.AGENT_ID,
        sessionId
    );

    const message = twilioReq.body.Body;
    const languageCode = process.env.LANGUAGE_CODE;
    const request = {
        session: sessionPath,
        queryInput:
            {
                text: {
                    text: message
                },
                languageCode
            }
        };
    
    return request;
};

/*
*  Converts DetctIntent response to a JSON payload for Twilio
*  @param {JSON} dialogflowResponse
*  @return {JSON} 
*/
const detectIntentToTwilio = (dialogflowResponse) => {
    let reply = "";
    
    for (let responseMessage of dialogflowResponse.queryResult.responseMessages) {
        if (responseMessage.hasOwnProperty('text')) {
            reply += responseMessage.text.text;
        }
    }

    const twiml = new  MessagingResponse();
    twiml.message(reply);
    return twiml;
};

/*
*  Returns a message from a Dialogflow agent in response to a Twilio message
*  @param {JSON} req
*  @return {string}
*/
const getResponseMessage = async (req) => {
    const dialogflowRequest = twilioToDetectIntent(req);
    const [dialogflowResponse] = await sessionClient.detectIntent(dialogflowRequest);
    const twiml = detectIntentToTwilio(dialogflowResponse);
    return twiml.toString();
};

/*
*  Express middleware that rejects every request that was not signed by Twilio
*  with this account's auth token. This endpoint is publicly reachable, so
*  without this check anyone could send messages on behalf of any phone number.
*  https://www.twilio.com/docs/usage/security#validating-requests
*/
const requireTwilioSignature = (req, res, next) => {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    let valid = false;
    try {
        // The URL that Twilio signed. TWILIO_WEBHOOK_URL is optional: it is the
        // exact webhook URL configured in the Twilio console. Without it, the
        // URL at which this request was received is used.
        const url = process.env.TWILIO_WEBHOOK_URL ||
            req.protocol + '://' + req.get('host') + req.originalUrl;
        // Messaging webhooks are signed over their POST parameters. A URL with
        // bodySHA256 selects the validator's JSON body mode, which does not
        // cover req.body, so such a URL is never accepted here.
        valid = Boolean(authToken) &&
            Boolean(req.header('X-Twilio-Signature')) &&
            !url.includes('bodySHA256') &&
            twilio.validateExpressRequest(req, authToken, {url});
    } catch (err) {
        // The validator throws on some malformed requests. Treat those as invalid.
        valid = false;
    }
    if (!valid) {
        res.status(403).type('text/plain')
            .send('Twilio request validation failed.');
        return;
    }
    next();
};

app.post('/', requireTwilioSignature, async (req, res) => {
    const message = await getResponseMessage(req);
    console.log("MESSAGE: " + message);
    res.send(message);
});

process.on('SIGTERM', () => {
    listener.close(async ()=> {
      console.log('Closing server.');
      process.exit(0);
    });
  });

module.exports = {
    app,
    sessionClient,
    twilioToDetectIntent,
    detectIntentToTwilio,
    requireTwilioSignature
};