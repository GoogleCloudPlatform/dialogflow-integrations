const detectIntentToTelegramText = require('../server.js').detectIntentToTelegramText;
const telegramToDetectIntent = require('../server.js').telegramToDetectIntent;
const assert = require('assert');


describe('detectIntentToTelegramText() and telegramToDetectIntent()', () => {
    chatId = 12435;

    const telegramRequest = {
        message: {
            chat: {
                id: chatId
            },
            text: 'Test Text'
        }
    };
    
    const telegramRequestMessage = {
        chat_id: chatId,
        text: 'Test Response Text\n'
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

    it('should convert telegram request to detectIntent request', async function () {
        assert.deepStrictEqual(telegramToDetectIntent(
            telegramRequest,'sessionPath'), dialogflowRequest)
    });
        
    it('should convert detectIntent response to a Telegram text message request.', async function () {
        assert.deepStrictEqual(detectIntentToTelegramText(
            dialogflowResponse,chatId), telegramRequestMessage)
    });
});
