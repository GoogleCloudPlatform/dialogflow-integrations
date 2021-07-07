const detectIntentToSlackMessage = require('../server.js').detectIntentToSlackMessage;
const slackToDetectIntent = require('../server.js').slackToDetectIntent;
const assert = require('assert');

describe('slackToDetectIntent()', () => {
    chatId = 12435;

    const slackRequest = {
        type: 'message',
        user: chatId,
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

    it('should convert Slack request to detectIntent request', async function () {
        assert.deepStrictEqual(slackToDetectIntent(
            slackRequest,'sessionPath'), dialogflowRequest)
    });
});

describe('detectIntentToSlackMessage()', () => {
    chatId = 12435;

    const slackRequestMessage = {
        channel: chatId,
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

    it('should convert detectIntent response to a Slack text message request.', async function () {
        assert.deepStrictEqual(detectIntentToSlackMessage(
            dialogflowResponse,chatId), slackRequestMessage)
    });
});