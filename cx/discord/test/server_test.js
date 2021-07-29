const convertToDiscordMessage = require('../server.js').convertToDiscordMessage;
const discordToDetectIntent = require('../server.js').discordToDetectIntent;
const assert = require('assert');

describe('discordToDetectIntent()', () => {
  const discordRequest = {content: 'Test Text'};

  const dialogflowRequest = {
    session: 'sessionPath',
    queryInput: {
      text: {
        text: 'Test Text',
      },
      languageCode: 'en',
    },
  };

  it('should convert Discord request to detectIntent request',
     async function() {
       assert.deepStrictEqual(
           discordToDetectIntent(discordRequest, 'sessionPath'),
           dialogflowRequest)
     });
});

describe('convertToDiscordMessage()', () => {
  const discordTextRequest = ['Test Response Text'];

  const dialogflowTextResponse = {
    queryResult: {responseMessages: [{text: {text: ['Test Response Text']}}]}
  };

  const discordImageRequest = [{files: ['http://example.com/image.jpg']}];

  const dialogflowImageResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            files: {
              'listValue': {
                'values': [{
                  'stringValue': 'http://example.com/image.jpg',
                  'kind': 'stringValue'
                }]
              },
              'kind': 'listValue'
            }
          }
        }
      }]
    }
  };

  const discordAudioRequest = [{files: ['http://example.com/audio.mp3']}];

  const dialogflowAudioResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            files: {
              'listValue': {
                'values': [{
                  'stringValue': 'http://example.com/audio.mp3',
                  'kind': 'stringValue'
                }]
              },
              'kind': 'listValue'
            }
          }
        }
      }]
    }
  };

  const discordButtonRequest = [{
    'content': 'Test Button',
    'components': [{
      'type': 1,
      'components': [
        {'type': 2, 'style': 1, 'label': 'Click me!', 'custom_id': 'Example'}
      ]
    }]
  }]

  const dialogflowButtonResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            'content': {'stringValue': 'Test Button', 'kind': 'stringValue'},
            'components': {
              'listValue': {
                'values': [{
                  'structValue': {
                    'fields': {
                      'type': {'numberValue': 1, 'kind': 'numberValue'},
                      'components': {
                        'listValue': {
                          'values': [{
                            'structValue': {
                              'fields': {
                                'label': {
                                  'stringValue': 'Click me!',
                                  'kind': 'stringValue'
                                },
                                'type':
                                    {'numberValue': 2, 'kind': 'numberValue'},
                                'style':
                                    {'numberValue': 1, 'kind': 'numberValue'},
                                'custom_id': {
                                  'stringValue': 'Example',
                                  'kind': 'stringValue'
                                }
                              }
                            },
                            'kind': 'structValue'
                          }]
                        },
                        'kind': 'listValue'
                      }
                    }
                  },
                  'kind': 'structValue'
                }]
              },
              'kind': 'listValue'
            }
          }
        }
      }]
    }
  }

  it('Should convert detectIntent text response to a Discord message request.',
     async function() {
       var request = await convertToDiscordMessage(dialogflowTextResponse);
       assert.deepStrictEqual(request, discordTextRequest);
     });

  it('Should convert detectIntent image response to a Discord message request.',
     async function() {
       var request = await convertToDiscordMessage(dialogflowImageResponse);
       assert.deepStrictEqual(request, discordImageRequest)
     });

  it('Should convert detectIntent audio response to a Discord message request.',
     async function() {
       var request = await convertToDiscordMessage(dialogflowAudioResponse);
       assert.deepStrictEqual(request, discordAudioRequest)
     });

  it('Should convert detectIntent button response to a Discord message request.',
     async function() {
       var request = await convertToDiscordMessage(dialogflowButtonResponse);
       assert.deepStrictEqual(request, discordButtonRequest)
     });
});
