/**
 * To-Do:
 * Create a Service Account and download its key file. 
 * Set the environmental variable GOOGLE_APPLICATION_CREDENTIALS 
 * to the key file's location.
 * See https://dialogflow.com/docs/reference/v2-auth-setup and 
 * https://cloud.google.com/dialogflow/docs/setup for details.
 */

const express = require('express');
const request = require('request');
const app = express();

app.use(express.json());

///Uncomment and insert your values here
//const sparkAccessToken ="1234567898-ABCdfghTtaD8dfghdfgh-45sdf65467M";
//const targetUrl = 'https://example.com';
//const projectId = 'my-project';
//const locationId = 'global';
//const agentId = 'my-agent';
//const languageCode = 'en'

// Imports the Google Cloud Some API library
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
/**
 * Example for regional endpoint:
 *   const locationId = 'us-central1'
 *   const client = new SessionsClient({apiEndpoint: 'us-central1-dialogflow.googleapis.com'})
 */
const client = new SessionsClient({apiEndpoint: locationId + '-dialogflow.googleapis.com'});

//Upon start a webhook is registered with spark
//Upon closure the webhook is removed from spark

const listener = app.listen(process.env.PORT, async function() {
  await init();
  console.log('Your Spark integration server is listening on port '
      + listener.address().port);
});

app.post('/', async function(req, res) {
  const message = await retrieveMessage(req.body.data.id);
  const dialogflowResponse = await detectIntentText(message.text, req.body.data.personId);
  sendMessage(dialogflowResponse, message.email);
});

process.on('SIGTERM', () => {
  listener.close(async ()=>{
    console.log('Closing http server.');
    await deleteWebhooks();
    process.exit(0);
  });
});

async function init(){
  await deleteWebhooks();
  registerWebhook();
}

/**
 * This function calls Dialogflow CX API to retrieve the response
 * https://cloud.google.com/dialogflow/cx/docs/quick/api
 */

async function detectIntentText(query,personId) {
    let agentResponse ='';

  const sessionId = personId;
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
        text: query,
      },
      languageCode,
    },
  };
  const [response] = await client.detectIntent(request);
  console.log(`User Query: ${query}`);
  for (const message of response.queryResult.responseMessages) {
    if (message.text) {
      console.log(`Agent Response: ${message.text.text}`);
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

function sendMessage(text, personEmail) {
  request.post('https://api.ciscospark.com/v1/messages', {
    auth: {
      bearer: sparkAccessToken
    },
    json: {
      "toPersonEmail": personEmail,
      "text": text
    }
  }, (err, resp, body) => {
    if (err) {
      console.error('Failed to send message :' + err);
    }
  });
}

function registerWebhook() {
  request.post('https://api.ciscospark.com/v1/webhooks', {
    auth: {
      bearer: sparkAccessToken
    },
    json: {
      "name": "test",
      "targetUrl": targetUrl,
      "resource": "messages",
      "event": "created"
    }
  }, (err, resp, body) => {
    if (err) {
      console.error('Failed to create Webhook :' + err);
    }
  });
}

function deleteWebhooks() {
  return new Promise((resolve, reject) =>{
    request.get('https://api.ciscospark.com/v1/webhooks?max=100', {
      auth: {
        bearer: sparkAccessToken
      }
    }, (err, resp, body) => {
      if (err) {
        console.error('Failed to check webhooks :' + err);
        reject();
      }
      var webhooks = JSON.parse(resp.body).items;
      if (Array.isArray(webhooks)) {
        webhooks = webhooks.filter((value, index, arr)=> {
          return value.targetUrl===targetUrl;
        });
        webhooks.forEach((webhook) => {
          request.delete(
              'https://api.ciscospark.com/v1/webhooks/' +
              webhook.id, {
                auth: {
                  bearer: sparkAccessToken
                }
              }, (err, resp, body) => {
                if (err) {
                  console.error('Failed to delete webhook :' + err);
                }
              });
        });
      }
      resolve();
    });
  });
}

function retrieveMessage(messageId) {
  return new Promise((resolve, reject) =>{
    request.get('https://api.ciscospark.com/v1/messages/' + messageId, {
      auth: {
        bearer: sparkAccessToken
      }
    }, (err, resp, body) => {
      if (err) {
        console.error('Failed to retrieve message :' + err);
        reject();
      }
      //checks to make sure the message is not from itself
      if (!((JSON.parse(resp.body).personEmail).includes('webex.bot'))) {
        const personEmail = JSON.parse(resp.body).personEmail;
        const messageText= JSON.parse(resp.body).text;
        const payload = JSON.parse(resp.body);
        resolve({text: messageText, email: personEmail, payload:payload});
      } else {
        resolve(null);
      }
    });
  });
}
