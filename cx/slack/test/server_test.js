const convertToSlackMessage = require('../server.js').convertToSlackMessage;
const slackToDetectIntent = require('../server.js').slackToDetectIntent;
const assert = require('assert');

describe('slackToDetectIntent()', () => {
    const slackRequest = {
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
            slackRequest, 'sessionPath'), dialogflowRequest)
    });
});

describe('convertToSlackMessage()', () => {
    channel_id = 54321

    const slackTextRequest = [{
        channel: channel_id,
        text: 'Test Response Text'
    }];

    const dialogflowTextResponse = {
        queryResult: {
            responseMessages: [{
                text: {
                    text: ['Test Response Text']
                }
            }]
        }
    };

    const slackPayloadRequest = [{
        channel: channel_id,
        blocks: [{
            type: "image",
            image_url: "http://example.com/image",
            alt_text: "Example image."
        }]
    }];

    const dialogflowPayloadResponse = {
        queryResult: {
            responseMessages: [{    
                payload: {
                    fields: {    
                        type: { stringValue: 'image', kind: 'stringValue' },
                        image_url: {
                            stringValue: 'http://example.com/image',
                            kind: 'stringValue'
                        },
                        alt_text: { stringValue: 'Example image.', kind: 'stringValue' }
                    }
                }
            }]
        }
    };    

    it('should convert detectIntent response to a Slack text message request.', async function () {
        var request =  await convertToSlackMessage(dialogflowTextResponse, channel_id);
        assert.deepStrictEqual(request, slackTextRequest); 
    });

    it('should convert detectIntent payload response to a Slack message request.', async function () {
        var request = await convertToSlackMessage(dialogflowPayloadResponse, channel_id);
        assert.deepStrictEqual(request, slackPayloadRequest)    
    });
});
