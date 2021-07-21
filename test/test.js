const { SessionsClient } = require('@google-cloud/dialogflow-cx');

const nock = require('nock');
const axios = require('axios');
const chai = require('chai');
const sinon = require('sinon');
const testhelper = require('./testhelper');
const configuration = require('../src/configuration_provider');
const { listener } = require('../src/server');
axios.defaults.adapter = require('axios/lib/adapters/http');

const { expect } = chai;

describe('Infobip Conversations ', () => {
  context('incomming text message', () => {
    it('should be passed to Dialogflow and response should trigger outbound message being sent to Conversations', () => {
      const givenSampleMessage = testhelper.sampleCcaasInboundMessage();

      const detectIntentRequest = testhelper.sampleDetectIntentRequest(configuration.project,
        configuration.agentLocation, configuration.agentId, givenSampleMessage.conversationId,
        givenSampleMessage.content.text, configuration.language);

      const detectIntentStub = sinon.stub(SessionsClient.prototype, 'detectIntent');
      detectIntentStub.withArgs(detectIntentRequest)
        .returns(Promise.resolve(testhelper.sampleDialogflowResponse()));

      nock.disableNetConnect();
      nock.enableNetConnect(`localhost:${listener.address().port}`);
      const scope = nock(configuration.infobipBaseUrl)
        .post(`/ccaas/1/conversations/${givenSampleMessage.conversationId}/messages?piIntegrator=89&piPlatform=lzkj`, testhelper.sampleCcaasOutboundMessage())
        .reply(200, {});

      return axios.post(`http://localhost:${listener.address().port}`, givenSampleMessage)
        .then((response) => {
          expect(response.status).to.be.equal(200);
          expect(scope.isDone()).to.be.equal(true);
          expect(detectIntentStub.called).to.be.equal(true);
          scope.done();
          sinon.reset();
        });
    });
  });

  context('incomming non-text message', () => {
    it('should route conversation to human agent', () => {
      const givenSampleMessage = testhelper.sampleCcaasInboundMessage('UNSUPPORTED');

      nock.disableNetConnect();
      nock.enableNetConnect(`localhost:${listener.address().port}`);
      const scope = nock(configuration.infobipBaseUrl)
        .post(`/ccaas/1/conversations/${givenSampleMessage.conversationId}/route?piIntegrator=89&piPlatform=lzkj`)
        .reply(200, {});

      return axios.post(`http://localhost:${listener.address().port}`, givenSampleMessage)
        .then((response) => {
          expect(response.status).to.be.equal(200);
          expect(scope.isDone()).to.be.equal(true);
          scope.done();
          sinon.reset();
        });
    });
  });
});
