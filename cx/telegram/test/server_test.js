const convertToTelegramMessage =
    require('../server.js').convertToTelegramMessage;
const telegramToDetectIntent = require('../server.js').telegramToDetectIntent;
const assert = require('assert');

describe('telegramToDetectIntent()', () => {
  chatId = 12435;

  const telegramRequest = {message: {chat: {id: chatId}, text: 'Test Text'}};

  const dialogflowRequest = {
    session: 'sessionPath',
    queryInput: {
      text: {
        text: 'Test Text',
      },
      languageCode: 'en',
    },
  };

  it('should convert telegram request to detectIntent request',
    async function() {
      assert.deepStrictEqual(
          telegramToDetectIntent(telegramRequest, 'sessionPath'),
          dialogflowRequest)
    });
});

describe('convertToTelegramMessage()', () => {
  chatId = 12435;

  const telegramTextRequest = [{chat_id: chatId, text: 'Test Response Text\n'}];

  const dialogflowTextResponse = {
    queryResult: {
      text: 'Test Text',
      languageCode: 'en',
      responseMessages: [{text: {text: ['Test Response Text\n']}}]
    }
  };

  const telegramButtonRequest = [{
    chat_id: chatId,
    text: 'Test',
    reply_markup:
        {inline_keyboard: [[{text: 'Example', url: 'http://example.com'}]]}
  }]

  const dialogflowButtonResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            'text': {'stringValue': 'Test', 'kind': 'stringValue'},
            'reply_markup': {
              'structValue': {
                'fields': {
                  'inline_keyboard': {
                    'listValue': {
                      'values': [{
                        'listValue': {
                          'values': [{
                            'structValue': {
                              'fields': {
                                'text': {
                                  'stringValue': 'Example',
                                  'kind': 'stringValue'
                                },
                                'url': {
                                  'stringValue': 'http://example.com',
                                  'kind': 'stringValue'
                                }
                              }
                            },
                            'kind': 'structValue'
                          }]
                        },
                        'kind': 'listValue'
                      }]
                    },
                    'kind': 'listValue'
                  }
                }
              },
              'kind': 'structValue'
            }
          }
        }
      }]
    }
  };

  const telegramImageRequest =
      [{chat_id: chatId, photo: 'http://example.com/image.jpg'}]

  const dialogflowImageResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            'photo': {
              'stringValue': 'http://example.com/image.jpg',
              'kind': 'stringValue'
            }
          }
        }
      }]
    }
  };

  const telegramVoiceRequest =
      [{chat_id: chatId, voice: 'http://example.com/voice.mp3'}]

  const dialogflowVoiceResponse = {
    queryResult: {
      responseMessages: [{
        payload: {
          fields: {
            'voice': {
              'stringValue': 'http://example.com/voice.mp3',
              'kind': 'stringValue'
            }
          }
        }
      }]
    }
  };

  it('should convert detectIntent text response to a Telegram message request.',
    async function() {
      const request =
          await convertToTelegramMessage(dialogflowTextResponse, chatId);
      assert.deepStrictEqual(request, telegramTextRequest)
    });

  it('should convert detectIntent button response to a Telegram message request.',
    async function() {
      const request =
          await convertToTelegramMessage(dialogflowButtonResponse, chatId);
      assert.deepStrictEqual(request, telegramButtonRequest)
    });

  it('should convert detectIntent image response to a Telegram message request.',
    async function() {
      const request =
          await convertToTelegramMessage(dialogflowImageResponse, chatId);
      assert.deepStrictEqual(request, telegramImageRequest)
    });

  it('should convert detectIntent voice response to a Telegram message request.',
    async function() {
      const request =
          await convertToTelegramMessage(dialogflowVoiceResponse, chatId);
      assert.deepStrictEqual(request, telegramVoiceRequest)
    });
});
