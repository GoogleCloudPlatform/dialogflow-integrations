import {JsonObject} from 'type-fest';
import {jsonToStruct, structToJson} from '../../src/util/struct';
import {google} from '@google-cloud/dialogflow-cx/build/protos/protos';

type TestCase = {
  testName: string;
  json: JsonObject;
  struct: google.protobuf.IStruct;
};
const testCases: TestCase[] = [
  {
    testName: 'empty struct/object',
    json: {},
    struct: {fields: {}},
  },
  {
    testName: 'null field',
    json: {test: null},
    struct: {fields: {test: {nullValue: 'NULL_VALUE'}}},
  },
  {
    testName: 'bool field',
    json: {test: false},
    struct: {fields: {test: {boolValue: false}}},
  },
  {
    testName: 'number field',
    json: {test: 123},
    struct: {fields: {test: {numberValue: 123}}},
  },
  {
    testName: 'string field',
    json: {test: 'test'},
    struct: {fields: {test: {stringValue: 'test'}}},
  },
  {
    testName: 'list field',
    json: {test: ['']},
    struct: {fields: {test: {listValue: {values: [{stringValue: ''}]}}}},
  },
  {
    testName: 'struct field',
    json: {test: {test: 'test'}},
    struct: {
      fields: {test: {structValue: {fields: {test: {stringValue: 'test'}}}}},
    },
  },
];

describe('JSON to struct conversion', () => {
  testCases.forEach(({testName, json, struct}) => {
    test(testName, () => {
      expect(jsonToStruct(json)).toStrictEqual(struct);
    });
  });
});

describe('struct to JSON conversion', () => {
  testCases.forEach(({testName, json, struct}) => {
    test(testName, () => {
      expect(structToJson(struct)).toStrictEqual(json);
    });
  });
});
