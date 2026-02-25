
const express = require('express');
const request = require('request');
const app = express();

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For authenticating dialogflow_session_client.js, create a Service Account and
// download its key file. Set the environmental variable
// GOOGLE_APPLICATION_CREDENTIALS to the key file's location.
//See https://dialogflow.com/docs/reference/v2-auth-setup and
// https://cloud.google.com/dialogflow/docs/setup for details.

// const projectId = 'my-project';
// const locationId = 'global';
// const agentId = 'my-agent';
// const languageCode = 'en'

const phoneNumber = "Place your twilio phone number here";
const accountSid = 'Place your accountSid here';
const authToken = 'Place your authToken here';

const twillioClient = require('twilio')(accountSid, authToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// Imports the Google Cloud Some API library
const {SessionsClient} = require('@google-cloud/dialogflow-cx');

const client = new SessionsClient(
    {apiEndpoint: locationId + '-dialogflow.googleapis.com'});

const listener = app.listen(process.env.PORT, function() {
  console.log('Your Twilio integration server is listening on port '
      + listener.address().port);
});

// /**
//  * Converts Twilllo request to a detectIntent request.
//  */
function twillioToDetectIntent(twillioRequest, sessionPath) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: twillioRequest.Body,
      },
      languageCode,
    },
  };
  return request;
}


app.post('/', async function(req, res) {
  const reqbody = req.body;
  const sessionId = reqbody.From;
  const sessionPath = client.projectLocationAgentSessionPath(
           projectId, locationId, agentId, sessionId);

  const request = twillioToDetectIntent(reqbody, sessionPath);
  const [response] = await client.detectIntent(request);
  const twiml = new  MessagingResponse();
  const res_message = twiml.message()

  for (let df_response of response.queryResult.responseMessages) {
    let reply;

    switch (true) {
      case df_response.hasOwnProperty('text'): {
        reply = df_response.text.text.join();
        res.send(res_message.body(reply).toString());
      } break;

      default:{
        reply = "Currently, we are not supporting any media types"
        res.send(res_message.body(reply).toString());
      }
    }
  }
});

process.on('SIGTERM', () => {
  listener.close(() => {
    console.log('Closing http server.');
    process.exit(0);
  });
});
