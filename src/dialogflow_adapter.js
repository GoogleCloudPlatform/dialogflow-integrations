const { SessionsClient } = require('@google-cloud/dialogflow-cx');

class DialogflowAdapter {
  constructor(configuration) {
    const apiEndpoint = `${configuration.agentLocation}-dialogflow.googleapis.com`;

    this.client = new SessionsClient({ apiEndpoint });
    this.location = configuration.agentLocation;
    this.projectId = configuration.project;
    this.agentId = configuration.agentId;
    this.language = configuration.language;
  }

  createSessionPath(sessionId) {
    return this.client.projectLocationAgentSessionPath(this.projectId,
      this.location, this.agentId, sessionId);
  }

  detectIntent(sessionId, text) {
    const sessionPath = this.createSessionPath(sessionId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text,
        },
        languageCode: this.language,
      },
    };
    return this.client.detectIntent(request);
  }
}

module.exports = DialogflowAdapter;
