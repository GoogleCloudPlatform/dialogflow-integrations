/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const assert = require('assert');
const convertToKikMessages = require('../server.js').convertToKikMessages;


describe('convertToKikMessages()', function () {
  const dialogflowTextResponse = [{
    text: {
      text: ["Test Text"]
    },
    platform: "KIK"
  }];
  const kikTextMessage = {type: 'text', body: 'Test Text'};

  it('should return text response', async function () {
    assert.deepStrictEqual(await convertToKikMessages(
        dialogflowTextResponse), [kikTextMessage])
  });

  const dialogflowImageResponse = [{
    image: {
      imageUri: 'https://testimage.jpeg'
    },
    platform: 'KIK'
  }];
  const kikImageMessage = {type: 'picture', picUrl: 'https://testimage.jpeg'};

  it('should return image response', async function () {
    assert.deepStrictEqual(await convertToKikMessages(
        dialogflowImageResponse), [kikImageMessage])
  });

  const dialogflowPayloadResponse = [{
    payload: {
      fields: {
        kik: {
          structValue: {
            fields: {
              body: { stringValue: 'Payload Body', kind: 'stringValue'},
              type: { stringValue: 'text', kind: 'stringValue'}
            },
            kind: 'structValue'
          }
        }
      }
    },
    platform: 'KIK'
  }];
  const kikPayloadMessage = {type: 'text', body: 'Payload Body'};

  it('should return payload response', async function () {
    assert.deepStrictEqual(await convertToKikMessages(
        dialogflowPayloadResponse), [kikPayloadMessage])
  });

  const dialogflowQuickReplyResponse = [{
    quickReplies: {
      title: "Quick Replies Title",
      quickReplies: ['Quick Reply 1', 'Quick Reply 2']
    },
    platform: 'KIK'
  }];
  const kikQuickReplyMessage = {
    type: 'text',
    body: 'Quick Replies Title',
    keyboards: [{
      type: 'suggested',
      responses: [
        {type: 'text', body: 'Quick Reply 1'},
        {type: 'text', body: 'Quick Reply 2'}
      ]
    }]
  };


  it('should return quick reply response', async function () {
    assert.deepStrictEqual(await convertToKikMessages(
        dialogflowQuickReplyResponse), [kikQuickReplyMessage])
  });

  const dialogflowCardResponse = [{
    card: {
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      imageUri: 'https://testcard.jpeg',
      buttons: [
        {text: 'Button 1'},
        {text: 'Button 2', postback: 'text postback'},
        {text: 'Button 3', postback: 'https://linkpostback.test'}
      ]
    },
    platform: 'KIK'
  }];
  const kikCardImageMessage = {
    type: 'picture',
    picUrl: 'https://testcard.jpeg',
    attribution: {name: 'Card Title'},
    keyboards: [{
      type: 'suggested',
      responses: [
        {type: 'text', body: 'Button 1'},
        {type: 'text', body: 'Button 2'}
      ]
    }]
  };
  const kikCardTextMessage = {
    type: 'text',
    body: 'Card Subtitle',
    keyboards: [{
      type: 'suggested',
      responses: [
        {type: 'text', body: 'Button 1'},
        {type: 'text', body: 'Button 2'}
      ]
    }]
  };
  const kikCardLinkMessage = {
    type: 'link',
    title: 'Button 3',
    url: 'https://linkpostback.test',
    keyboards: [{
      type: 'suggested',
      responses: [
        {type: 'text', body: 'Button 1'},
        {type: 'text', body: 'Button 2'}
      ]
    }]
  };
  const kikCardMessages = [
    kikCardImageMessage,
    kikCardTextMessage,
    kikCardLinkMessage
  ];

  it('should return card response', async function () {
    assert.deepStrictEqual(await convertToKikMessages(
        dialogflowCardResponse), kikCardMessages)
  });

  const kikMessages = [
    kikTextMessage,
    kikImageMessage,
    kikPayloadMessage,
    kikCardLinkMessage,
    kikCardImageMessage,
    kikCardTextMessage,
    kikQuickReplyMessage
  ];

  const dialogflowResponses = [];
  dialogflowResponses.push.apply(
      dialogflowResponses, dialogflowTextResponse);
  dialogflowResponses.push.apply(
      dialogflowResponses, dialogflowImageResponse);
  dialogflowResponses.push.apply(
      dialogflowResponses, dialogflowPayloadResponse);
  dialogflowResponses.push.apply(
      dialogflowResponses, dialogflowQuickReplyResponse);
  dialogflowResponses.push.apply(
      dialogflowResponses, dialogflowCardResponse);

  it('should return all kik responses', async function() {
    assert.deepStrictEqual(await convertToKikMessages(
        dialogflowResponses), kikMessages);
  });
});