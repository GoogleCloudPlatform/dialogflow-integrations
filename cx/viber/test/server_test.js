const assert = require('assert');
const convertToViberMessage = require('../server.js').convertToViberMessage;
const viberToDetectIntent = require('../server.js').viberToDetectIntent;
const viberToDetectIntentEvent = require('../server.js').viberToDetectIntentEvent;

describe('convertToViberMessage', () => {
  const dialogflowResponse = {
    queryResult: {
      text: 'Test Text',
      languageCode: 'en',
      responseMessages: [{
        text: {
          text: ['Test Response Text'],
        },
      }],
    },
  };
  
  const textViberMessage = [{
    text: 'Test Response Text',
    timestamp: undefined,
    token: undefined,
    trackingData: {},
    keyboard: null,
    requiredArguments: ['text'],
    minApiVersion: undefined,
  }];

  it('should convert dialogflowResponse to viber message', async () => {
    assert.deepEqual(await convertToViberMessage(dialogflowResponse),
        textViberMessage);
  });
});

describe('viberToDetectIntent', () => {
  const sessionPath = 'projects/project123/locations/global/agents/12-34-56/environments/global/sessions/123';

  const message = {
    text: 'Test Text',
  };

  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      text: {
        text: 'Test Text',
      },
      languageCode: 'en',
    },
  };

  it('should convert Spark message to a detectIntent request', async () => {
    assert.deepEqual(await viberToDetectIntent(message, sessionPath),
        dialogflowRequest);
  });
});

describe('viberToDetectIntentEvent', () => {
  const sessionPath = 'projects/project123/locations/global/agents/12-34-56/environments/global/sessions/123';

  const event = 'VIBER_WELCOME';

  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      event: {
        event: event,
      },
      languageCode: 'en',
    },
  };

  it('should convert Viber welcome event to a detectIntent request', async () => {
    assert.deepEqual(await viberToDetectIntentEvent(event, sessionPath),
        dialogflowRequest);
  });
});
