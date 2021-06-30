const detectIntentToTelegramMessage = require('../server.js').detectIntentToTelegramMessage;
const telegramToDetectIntent = require('../server.js').telegramToDetectIntent;
const assert = require('assert');


describe('telegramToDetectIntent()', () => {
    chatId = 12435;

    const telegramRequest = {
        message: {
            chat: {
                id: chatId
            },
            text: 'Test Text'
        }
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

    it('should convert telegram request to detectIntent request', async function () {
        assert.deepStrictEqual(telegramToDetectIntent(
            telegramRequest,'sessionPath'), dialogflowRequest)
    });
});

describe('detectIntentToTelegramMessage()', () => {
    chatId = 12435;

    const telegramRequestMessage = {
        chat_id: chatId,
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

    it('should convert detectIntent response to a Telegram text message request.', async function () {
        assert.deepStrictEqual(detectIntentToTelegramMessage(
            dialogflowResponse,chatId), telegramRequestMessage)
    });
});
