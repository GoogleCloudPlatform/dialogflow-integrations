/**
 * TODO(developer): 
 * Add your service key to the current folder.
 * Uncomment and fill in these variables.
 */
// const projectId = 'my-project';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en'
// const TELEGRAM_TOKEN='1234567898:ABCdfghTtaD8dfghdfgh45sdf65467M';
// const SERVER_URL='https://example.com';

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const WEBHOOK = SERVER_URL + URI;

const app = express();
app.use(bodyParser.json());


// Imports the Google Cloud Some API library
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
/**
 * Example for regional endpoint:
 *   const locationId = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient({apiEndpoint: locationId + '-dialogflow.googleapis.com'});

/**
 * Converts Telgram request to a detectIntent request.
 */
function telegramToDetectIntent(telegramRequest){
  const sessionId = telegramRequest.message.chat.id;
  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    locationId,
    agentId,
    sessionId
  );
  console.info(sessionPath);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: telegramRequest.message.text,
      },
      languageCode,
    },
  };

  return request;
}

/**
 * Converts detectIntent response to a Telegram text message request. 
 */
function detectIntentToTelegramText(response,chatId){
  agentResponse = '';
    
  for (const message of response.queryResult.responseMessages) {
    if (message.text) {
      agentResponse += `${message.text.text}\n`;
    };
  };
    
  const request = {
    chat_id: chatId,
    text: agentResponse
  };

  return request;
};

/**
 * Takes as input a request from Telegram and converts the request to
 * detectIntent request which is used to call the detectIntent() function
 * and finally output the response given by detectIntent().
 */
async function detectIntentResponse(telegramRequest) {
  request = telegramToDetectIntent(telegramRequest);
  const [response] = await client.detectIntent(request);

  return response;
};

const setup = async () => {
    const res = await axios.post(`${API_URL}/setWebhook`, {url: WEBHOOK});
    console.log(res.data);
};

app.post(URI, async (req, res) => {
  const response = await detectIntentResponse(req.body);
  const request = detectIntentToTelegramText(response,req.body.message.chat.id);
    
  await axios.post(`${API_URL}/sendMessage`, request);
  
  return res.send();
});

const listener = app.listen(process.env.PORT, async () => {
    console.log('Your Dialogflow integration server is listening on port '
    + listener.address().port);

    await setup();
});
