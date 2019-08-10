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
const filterResponses= require('../filter_responses.js');
const assert = require('assert');

describe('filterResponses', () => {
  const unfilteredResponse = [{
    platform: 'VIBER',
      card: {
        title: 'Title',
        subtitle: 'subtitle',
        imageUri: 'https://www.pca.state.mn.us/sites/default/files/smallbiz-beyond-compliance.png' },
      message: 'card' },
  { platform: 'SKYPE',
    card: {
      title: 'Card',
      subtitle: 'this is the subtitle',
      imageUri: 'https://www.pca.state.mn.us/sites/default/files/smallbiz-beyond-compliance.png' },
    message: 'card' },
  { platform: 'PLATFORM_UNSPECIFIED',
      text: { text: ['text'] },
    message: 'text' } ];
  const filteredResponse = [{
    platform: 'SKYPE',
    card: {
      title: 'Card',
      subtitle: 'this is the subtitle',
      imageUri: 'https://www.pca.state.mn.us/sites/default/files/smallbiz-beyond-compliance.png' },
    message: 'card' } ];
  it('should filter responses', () => {
    assert.deepEqual(filterResponses.filterResponses(unfilteredResponse, 'SKYPE'), filteredResponse)
  });

});
