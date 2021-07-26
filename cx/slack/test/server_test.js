const convertToSlackMessage = require('../server.js').convertToSlackMessage;
const slackToDetectIntent = require('../server.js').slackToDetectIntent;
const assert = require('assert');

describe('slackToDetectIntent()', () => {
  const slackRequest = {text: 'Test Text'};

  const dialogflowRequest = {
    session: 'sessionPath',
    queryInput: {
      text: {
        text: 'Test Text',
      },
      languageCode: 'en',
    },
  };

  it('should convert Slack request to detectIntent request', async function() {
    assert.deepStrictEqual(
        slackToDetectIntent(slackRequest, 'sessionPath'), dialogflowRequest)
  });
});

describe('convertToSlackMessage()', () => {
  channel_id = 54321

  const slackTextRequest = [{channel: channel_id, text: 'Test Response Text'}];

  const dialogflowTextResponse = {
    queryResult: {responseMessages: [{text: {text: ['Test Response Text']}}]}
  };

  const slackImageRequest = [{
    channel: channel_id,
    blocks: [{
      type: 'image',
      image_url: 'http://example.com/image',
      alt_text: 'Example image.'
    }]
  }];

  const dialogflowImageResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            'blocks': {
              'listValue': {
                'values': [{
                  'structValue': {
                    'fields': {
                      'type': {'stringValue': 'image', 'kind': 'stringValue'},
                      'image_url': {
                        'stringValue': 'http://example.com/image',
                        'kind': 'stringValue'
                      },
                      'alt_text': {
                        'stringValue': 'Example image.',
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
        }
      }]
    }
  };

  const slackButtonRequest = [{
    channel: channel_id,
    blocks: [
      {
        type: 'section',
        text: {type: 'mrkdwn', text: 'This is a section block with a button.'}
      },
      {
        type: 'actions',
        block_id: 'actionblock',
        elements: [{
          type: 'button',
          text: {type: 'plain_text', text: 'Link Button'},
          url: 'https://example.com/'
        }]
      }
    ]
  }]

  const dialogflowButtonResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            'blocks': {
              'listValue': {
                'values': [
                  {
                    'structValue': {
                      'fields': {
                        'type':
                            {'stringValue': 'section', 'kind': 'stringValue'},
                        'text': {
                          'structValue': {
                            'fields': {
                              'text': {
                                'stringValue':
                                    'This is a section block with a button.',
                                'kind': 'stringValue'
                              },
                              'type': {
                                'stringValue': 'mrkdwn',
                                'kind': 'stringValue'
                              }
                            }
                          },
                          'kind': 'structValue'
                        }
                      }
                    },
                    'kind': 'structValue'
                  },
                  {
                    'structValue': {
                      'fields': {
                        'block_id': {
                          'stringValue': 'actionblock',
                          'kind': 'stringValue'
                        },
                        'type':
                            {'stringValue': 'actions', 'kind': 'stringValue'},
                        'elements': {
                          'listValue': {
                            'values': [{
                              'structValue': {
                                'fields': {
                                  'url': {
                                    'stringValue': 'https://example.com/',
                                    'kind': 'stringValue'
                                  },
                                  'text': {
                                    'structValue': {
                                      'fields': {
                                        'type': {
                                          'stringValue': 'plain_text',
                                          'kind': 'stringValue'
                                        },
                                        'text': {
                                          'stringValue': 'Link Button',
                                          'kind': 'stringValue'
                                        }
                                      }
                                    },
                                    'kind': 'structValue'
                                  },
                                  'type': {
                                    'stringValue': 'button',
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
                  }
                ]
              },
              'kind': 'listValue'
            }
          }
        }
      }]
    }
  }

  it('Should convert detectIntent text response to a Slack message request.',
    async function() {
      var request =
          await convertToSlackMessage(dialogflowTextResponse, channel_id);
      assert.deepStrictEqual(request, slackTextRequest);
    });

  it('Should convert detectIntent image response to a Slack message request.',
    async function() {
      var request =
          await convertToSlackMessage(dialogflowImageResponse, channel_id);
      assert.deepStrictEqual(request, slackImageRequest)
    });

  it('Should convert detectIntent button response to a Slack message request.',
    async function() {
      var request =
          await convertToSlackMessage(dialogflowButtonResponse, channel_id);
      assert.deepStrictEqual(request, slackButtonRequest)
    });
});
