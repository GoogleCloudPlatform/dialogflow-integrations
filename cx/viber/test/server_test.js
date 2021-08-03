const assert = require('assert');
const convertToViberMessage = require('../server.js').convertToViberMessage;
const viberToDetectIntent = require('../server.js').viberToDetectIntent;
const viberToDetectIntentEvent = require('../server.js').viberToDetectIntentEvent;

describe('convertToViberMessage', () => {
  const dialogflowResponseText = {
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

  it('should convert dialogflowResponse with text to viber message', async () => {
    assert.deepEqual(await convertToViberMessage(dialogflowResponseText),
        textViberMessage);
  });

  const dialogflowResponsePicture = {
    queryResult: {
      languageCode: 'en',
      responseMessages: [{
        payload: {
          fields: {
            media: {
              stringValue: 'http://www.images.com/img.jpg',
              kind: 'stringValue',
            },
            text: {
              stringValue: 'Photo description',
              kind: 'stringValue',
            },
            type: {
              stringValue: 'Picture',
              kind: 'stringValue',
            },
          },
        },
      }],
    },
  };

  const PictureViberMessage = [{
    url: 'http://www.images.com/img.jpg',
    text: 'Photo description',
    thumbnail: null,
    timestamp: undefined,
    token: undefined,
    trackingData: {},
    keyboard: null,
    requiredArguments: ['url'],
    minApiVersion: undefined,
  }];

  it('should convert dialogflowResponse with picture to viber message', async () => {
    assert.deepEqual(await convertToViberMessage(dialogflowResponsePicture),
        PictureViberMessage);
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
