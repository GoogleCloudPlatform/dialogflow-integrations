const DialogflowAdapter = require('./dialogflow_adapter');
const CcaasAdapter = require('./ccaas_adapter');
const configuration = require('./configuration_provider');

const dialogflowAdapter = new DialogflowAdapter(configuration);
const ccaasAdapter = new CcaasAdapter(configuration);

const handleGetRequest = (req, res) => {
  res.send('It works');
};

function detectIntentText(ccaasMessage) {
  return dialogflowAdapter.detectIntent(ccaasMessage.conversationId, ccaasMessage.content.text)
    .then((response) => {
      const returnText = response
        .filter((it) => it && it.queryResult && it.queryResult.responseMessages)
        .flatMap((it) => it.queryResult.responseMessages)
        .filter((message) => message.text)
        .map((message) => message.text.text)
        .join('\n');
      return ccaasAdapter.sendTextMessage(ccaasMessage, returnText);
    });
}

function processTextMessage(ccaasMessage) {
  return detectIntentText(ccaasMessage);
}

const handleEndUserMessageFromCcaasPostRequest = (req, res) => {
  const ccaasMessage = req.body;
  switch (ccaasMessage.contentType) {
    case 'TEXT':
      return processTextMessage(ccaasMessage, res);
    default:
      return ccaasAdapter.routeToHumanAgent(ccaasMessage);
  }
};

module.exports = { handleGetRequest, handleEndUserMessageFromCcaasPostRequest };
