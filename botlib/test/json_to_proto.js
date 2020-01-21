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

const jsonToProto = require('../json_to_proto.js');
const assert = require('assert');

describe('JsonToProto', () => {
  const json = {
    'num': 0,
    'bool': true,
    'str': 's',
    'null': null,
    'array': [1, '2', true, {}],
    'obj': {'num': 1, 'str': ''}
  };
  const structProto = {
    'fields': {
      'num': {'kind': 'numberValue', 'numberValue': 0},
      'bool': {'kind': 'boolValue', 'boolValue': true},
      'str': {'kind': 'stringValue', 'stringValue': 's'},
      'null': {'kind': 'nullValue', 'nullValue': 'NULL_VALUE'},
      'array': {'kind': 'listValue', 'listValue': {'values': [
            {'kind': 'numberValue', 'numberValue': 1},
            {'kind': 'stringValue', 'stringValue': '2'},
            {'kind': 'boolValue', 'boolValue': true},
            {'kind': 'structValue', 'structValue': {'fields': {}}}
          ]}},
      'obj': {
        'kind': 'structValue',
        'structValue': {'fields': {
            'num': {'kind': 'numberValue', 'numberValue': 1},
            'str': {'kind': 'stringValue', 'stringValue': ''}
          }}}
    }
  };

  it('should convert JSON to goog.protobuf.Struct', () => {
    assert.deepEqual(jsonToProto.jsonToStructProto(json), structProto);
  });

});
