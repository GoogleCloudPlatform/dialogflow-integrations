const detectIntentToSparkMessage = require('../server.js').detectIntentToSparkMessage;
const sparkToDetectIntent = require('../server.js').sparkToDetectIntent;
const assert = require('assert');

describe('sparkToDetectIntent()', () => {
    const query = {
        text: 'Test Text'
    };

    const dialogflowRequest = {
        session: 'sessionPath',
        queryInput: {
            text: {
                text: 'Test Text',
            },
            languageCode: 'en',
        },
    };

    it('should converts Spark message to a detectIntent request.', async function () {
        assert.deepStrictEqual(sparkToDetectIntent(
            query.text,'sessionPath'), dialogflowRequest)
    });
});

describe('detectIntentToSparkMessage()', () => {
    const sparkTextMessage = {
        text: 'Test Response Text\n'
    };

    const dialogflowResponse = {
        queryResult: {
            text: 'Test Text',
            languageCode: 'en',
            responseMessages: [{
                text: {
                    text: 'Test Response Text'
                }
            }]
        }
    };

    it('should converts detectIntent response to a Spark text message.', async function () {
        assert.deepStrictEqual(detectIntentToSparkMessage(
            dialogflowResponse), sparkTextMessage.text)
    });
});
