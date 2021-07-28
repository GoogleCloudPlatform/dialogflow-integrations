const detectIntentToSparkMessage = require('../server.js').detectIntentToSparkMessage;
const sparkToDetectIntent = require('../server.js').sparkToDetectIntent;
const assert = require('assert');

describe('sparkToDetectIntent()', () => {
  const message = {
    text: 'Test Text',
  };

  const sessionPath = 'projects/project123/locations/global/agents/12-34-56/environments/global/sessions/123';

  const dialogflowRequest = {
    session: sessionPath,
    queryInput: {
      text: {
        text: 'Test Text',
      },
      languageCode: 'en',
    },
  };

  it('should converts Spark message to a detectIntent request.', async function() {
    assert.deepStrictEqual(sparkToDetectIntent(
        message, sessionPath), dialogflowRequest);
  });
});

describe('detectIntentToSparkMessage()', () => {
  const sparkTextMessage = {
    toPersonEmail: 'test123@gmail.com',
    text: 'Test Response Text\n',
  };

  const dialogflowResponse = {
    queryResult: {
      text: 'Test Text',
      languageCode: 'en',
      responseMessages: [{
        text: {
          text: 'Test Response Text',
        },
      }],
    },
  };

  const message = {
    email: 'test123@gmail.com',
  };

  it('should converts detectIntent response to a Spark text message.', async function() {
    assert.deepStrictEqual(detectIntentToSparkMessage(
        dialogflowResponse, message), sparkTextMessage);
  });
});
