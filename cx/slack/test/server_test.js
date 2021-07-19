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

    const slackImageRequest = [{
        channel: channel_id,
        blocks: [{
            type: "image",
            image_url: "http://example.com/image",
            alt_text: "Example image."
        }]
    }];

    const dialogflowImageResponse = {
        queryResult: {
            responseMessages: [{    
                payload: {
                    fields: {    
                        "blocks":{"listValue":{"values":[{"structValue":{"fields":{
                            "type":{"stringValue":"image","kind":"stringValue"},
                            "image_url":{"stringValue":"http://example.com/image",
                            "kind":"stringValue"},
                            "alt_text":{"stringValue":"Example image.","kind":"stringValue"}}},
                        "kind":"structValue"}]},"kind":"listValue"}
                    }
                }
            }]
        }
    };    

    const slackButtonRequest = [{
        channel: channel_id,
        text: "Would you like to play a game?",
        attachments: [
            {
                text: "Choose a game to play",
                fallback: "You are unable to choose a game",
                callback_id: "wopr_game",
                color: "#3AA3E3",
                attachment_type: "default",
                actions: [
                    {
                        name: "game",
                        text: "Chess",
                        type: "button",
                        value: "chess"
                    }
                ]
            }
        ]
    }]

    const dialogflowButtonResponse = {
        queryResult: {
            responseMessages: [{    
                payload: {
                    fields: {    
                        "text":{"stringValue":"Would you like to play a game?","kind":"stringValue"},
                        "attachments":{"listValue":{"values":[{"structValue":{"fields":{
                            "callback_id":{"stringValue":"wopr_game","kind":"stringValue"},
                            "color":{"stringValue":"#3AA3E3","kind":"stringValue"},
                            "actions":{"listValue":{"values":[{"structValue":{"fields":{
                                "text":{"stringValue":"Chess","kind":"stringValue"},
                                "name":{"stringValue":"game","kind":"stringValue"},
                                "value":{"stringValue":"chess","kind":"stringValue"},
                                "type":{"stringValue":"button","kind":"stringValue"}}},
                            "kind":"structValue"}]},"kind":"listValue"},
                            "fallback":{"stringValue":"You are unable to choose a game","kind":"stringValue"},
                            "attachment_type":{"stringValue":"default","kind":"stringValue"},
                            "text":{"stringValue":"Choose a game to play","kind":"stringValue"}}},
                        "kind":"structValue"}]},"kind":"listValue"}
                    }
                }
            }]
        }
    }

    it('Should convert detectIntent text response to a Slack message request.', async function () {
        var request =  await convertToSlackMessage(dialogflowTextResponse, channel_id);
        assert.deepStrictEqual(request, slackTextRequest); 
    });

    it('Should convert detectIntent Image response to a Slack message request.', async function () {
        var request = await convertToSlackMessage(dialogflowImageResponse, channel_id);
        assert.deepStrictEqual(request, slackImageRequest)    
    });

    it('Should convert detectIntent button response to a Slack message request.', async function () {
        var request =  await convertToSlackMessage(dialogflowButtonResponse, channel_id);
        assert.deepStrictEqual(request, slackButtonRequest)  
    });
});
