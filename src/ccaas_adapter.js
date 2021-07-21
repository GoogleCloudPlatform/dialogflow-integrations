const axios = require('axios');

class CcaasAdapter {
  constructor(configuration) {
    this.axios = axios.create({
      baseURL: configuration.infobipBaseUrl,
      timeout: 3000,
      headers: {
        Authorization: `App ${configuration.infobipApiKey}`,
        'x-agent-id': configuration.infobipBotId,
      },
    });
  }

  routeToHumanAgent(incommingMessage) {
    return this.axios
      .post(`/ccaas/1/conversations/${incommingMessage.conversationId}/route?piIntegrator=89&piPlatform=lzkj`);
  }

  sendTextMessage(incommingMessage, text) {
    const body = {
      from: incommingMessage.to,
      to: incommingMessage.from,
      channel: incommingMessage.channel,
      contentType: 'TEXT',
      content: {
        text,
      },
    };

    return this.axios
      .post(`/ccaas/1/conversations/${incommingMessage.conversationId}/messages?piIntegrator=89&piPlatform=lzkj`, body);
  }
}

module.exports = CcaasAdapter;
