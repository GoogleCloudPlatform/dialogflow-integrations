function prepareDevelopmentEnvironment() {
  if (process.env.NODE_ENV === 'development') {
    process.env = {
      DIALOGFLOW_PROJECT: 'givenDialogflowProject',
      DIALOGFLOW_AGENT_ID: 'givenDialogflowAgent',
      DIALOGFLOW_AGENT_LOCATION: 'givenDialogflowAgentLocation',
      INFOBIP_BASE_URL: 'https://example.com',
      INFOBIP_API_KEY: 'givenApiKey',
      BOT_LANGUAGE: 'givenLanguage',
      INFOBIP_BOT_ID: 'givenInfobipBotId',
    };
  }
}

prepareDevelopmentEnvironment();

const agentLocation = process.env.DIALOGFLOW_AGENT_LOCATION;
const project = process.env.DIALOGFLOW_PROJECT;
const agentId = process.env.DIALOGFLOW_AGENT_ID;
const language = process.env.BOT_LANGUAGE;
const infobipApiKey = process.env.INFOBIP_API_KEY;
const infobipBotId = process.env.INFOBIP_BOT_ID;
const infobipBaseUrl = process.env.INFOBIP_BASE_URL;

module.exports = {
  agentLocation, project, agentId, language, infobipApiKey, infobipBotId, infobipBaseUrl,
};
