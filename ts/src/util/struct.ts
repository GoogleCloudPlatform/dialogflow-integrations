import {google} from '@google-cloud/dialogflow-cx/build/protos/protos';
import {JsonObject, JsonValue} from 'type-fest';

export function structToJson(struct: google.protobuf.IStruct): JsonObject {
  const fieldEntries = Object.entries(struct.fields!);
  const jsonEntries = fieldEntries.map(([key, value]) => [
    key,
    structValueToJson(value),
  ]);
  return Object.fromEntries(jsonEntries);
}

function structValueToJson(value: google.protobuf.IValue): JsonValue {
  return (
    value.boolValue ??
    value.numberValue ??
    value.stringValue ??
    value.listValue?.values?.map(structValueToJson) ??
    (value.structValue ? structToJson(value.structValue) : null)
  );
}

export function jsonToStruct(json: JsonObject): google.protobuf.IStruct {
  const jsonEntries = Object.entries(json);
  const fieldEntries = jsonEntries.map(([key, value]) => [
    key,
    jsonValueToStruct(value),
  ]);
  return {fields: Object.fromEntries(fieldEntries)};
}

declare global {
  interface ArrayConstructor {
    isArray<T>(arg: ReadonlyArray<unknown> | unknown): arg is ReadonlyArray<T>;
  }
}

function jsonValueToStruct(value: JsonValue): google.protobuf.IValue {
  switch (typeof value) {
    case 'boolean': {
      return {boolValue: value};
    }
    case 'number': {
      return {numberValue: value};
    }
    case 'string': {
      return {stringValue: value};
    }
    case 'object': {
      if (Array.isArray(value)) {
        const values = value.map(jsonValueToStruct);
        return {listValue: {values}};
      } else if (value) {
        return {structValue: jsonToStruct(value)};
      } else {
        return {nullValue: 'NULL_VALUE'};
      }
    }
    default:
      throw new TypeError(
        `Invalid value provided for conversion from JSON to protobuf value: ${value} with type: ${typeof value}`
      );
  }
}
