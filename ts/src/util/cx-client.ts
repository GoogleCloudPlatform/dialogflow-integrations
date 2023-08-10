import {SessionsClient} from '@google-cloud/dialogflow-cx';
import {google} from '@google-cloud/dialogflow-cx/build/protos/protos';
import {JsonObject} from 'type-fest';
import {jsonToStruct} from './struct';

export default class CXClientWrapper {
  client: SessionsClient;
  projectID: string;
  location: string;
  agentID: string;
  defaultLanguageCode: string;
  defaultSessionTTL: number | undefined;

  constructor(
    projectID: string,
    agentLocation: string,
    agentID: string,
    defaultLanguageCode: string,
    apiEndpoint?: string,
    defaultSessionTTL?: number
  ) {
    this.client = new SessionsClient({apiEndpoint});
    this.projectID = projectID;
    this.location = agentLocation;
    this.agentID = agentID;
    this.defaultLanguageCode = defaultLanguageCode;
    this.defaultSessionTTL = defaultSessionTTL;
  }

  getSessionPath(sessionID: string) {
    return this.client.projectLocationAgentSessionPath(
      this.projectID,
      this.location,
      this.agentID,
      sessionID
    );
  }

  async detectIntentSimple(
    text: string,
    sessionID: string,
    channel?: string,
    payload?: JsonObject,
    languageCode: string = this.defaultLanguageCode,
    sessionTTLSeconds: number | undefined = this.defaultSessionTTL
  ) {
    const sessionPath = this.getSessionPath(sessionID);
    const request: google.cloud.dialogflow.cx.v3.IDetectIntentRequest & {
      queryParams: object;
    } = {
      session: sessionPath,
      queryParams: {
        channel,
        payload,
      },
      queryInput: {
        text: {
          text,
        },
        languageCode,
      },
    };
    if (payload) {
      request.queryParams.payload = jsonToStruct(payload);
    }
    if (sessionTTLSeconds) {
      request.queryParams.sessionTtl = {seconds: sessionTTLSeconds};
    }
    const [response] = await this.client.detectIntent(request);
    return response.queryResult?.responseMessages;
  }

  async detectIntentSimpleEvent(
    eventName: string,
    sessionID: string,
    channel?: string,
    payload?: JsonObject,
    languageCode: string = this.defaultLanguageCode,
    sessionTTLSeconds: number | undefined = this.defaultSessionTTL
  ) {
    const sessionPath = this.getSessionPath(sessionID);
    const request: google.cloud.dialogflow.cx.v3.IDetectIntentRequest & {
      queryParams: object;
    } = {
      session: sessionPath,
      queryParams: {
        channel,
      },
      queryInput: {
        event: {
          event: eventName,
        },
        languageCode,
      },
    };
    if (payload) {
      request.queryParams.payload = jsonToStruct(payload);
    }
    if (sessionTTLSeconds) {
      request.queryParams.sessionTtl = {seconds: sessionTTLSeconds};
    }

    const [response] = await this.client.detectIntent(request);
    return response.queryResult?.responseMessages;
  }
}
