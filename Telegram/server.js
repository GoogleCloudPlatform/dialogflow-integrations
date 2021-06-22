/**
 * TODO(developer): 
 * Add your service key to the current folder.
 * Uncomment and fill in these variables.
 */
// const projectId = 'my-project';
// const location = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en'
// const TELEGRAM_TOKEN='1234567898:ABCdfghTtaD8dfghdfgh45sdf65467M';
// const SERVER_URL='https://example.com';
const getUuid = require('uuid-by-string');
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
 *   const location = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient();

/**
 * Calls the Dialogflow CX API with the specific user query input and returns a string
 * from the API with a response for the users query depending on the matched intent.
 * The console.log() and console.info lines are included purely for debugging purposes
 * and and don't impact the end users experience.
 */
async function detectIntentText(query,chatId) {
  let agentResponse = '';

  const sessionId = getUuid(chatId, 3);
  const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
  );
  console.info(sessionPath);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
      },
      languageCode,
    },
  };
  const [response] = await client.detectIntent(request);
  console.log(`User Query: ${query}`);
  for (const message of response.queryResult.responseMessages) {
    if (message.text) {
      console.log(`${message.text.text}`);
      agentResponse += `${message.text.text}\n`;
    }
    
  }
  if (response.queryResult.match.intent) {
    console.log(
        `Matched Intent: ${response.queryResult.match.intent.displayName}`
    );
  }
  console.log(
      `Current Page: ${response.queryResult.currentPage.displayName}`
  );
  
  return agentResponse;
}

const setup = async () => {
    const res = await axios.get(`${API_URL}/setWebhook?url=${WEBHOOK}`);
    console.log(res.data);
};

app.post(URI, async (req, res) => {
    console.log(req.body)
    const chatId = req.body.message.chat.id;
    const text = await detectIntentText(req.body.message.text,chatId);
    await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: text
    });
    return res.send();
});

const listener = app.listen(process.env.PORT, async () => {
    console.log('Your Dialogflow integration server is listening on port '
    + listener.address().port);

    await setup();
});
