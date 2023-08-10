import {SessionsClient} from '@google-cloud/dialogflow';
import {google} from '@google-cloud/dialogflow/build/protos/protos';
import {JsonObject} from 'type-fest';
import {jsonToStruct} from './struct';

export default class ESClientWrapper {
  client: SessionsClient;
  projectID: string;
  location: string;
  defaultLanguageCode: string;

  constructor(
    projectID: string,
    agentLocation: string,
    defaultLanguageCode: string,
    apiEndpoint?: string
  ) {
    this.client = new SessionsClient({apiEndpoint});
    this.projectID = projectID;
    this.location = agentLocation;
    this.defaultLanguageCode = defaultLanguageCode;
  }

  getSessionPath(sessionID: string) {
    return this.client.projectLocationAgentSessionPath(
      this.projectID,
      this.location,
      sessionID
    );
  }

  async detectIntentSimple(
    text: string,
    sessionID: string,
    platform?: keyof typeof google.cloud.dialogflow.v2.Intent.Message.Platform,
    payload?: JsonObject,
    languageCode: string = this.defaultLanguageCode
  ) {
    const sessionPath = this.getSessionPath(sessionID);
    const request: google.cloud.dialogflow.v2.IDetectIntentRequest & {
      queryParams: object;
    } = {
      session: sessionPath,
      queryParams: {},
      queryInput: {
        text: {
          text,
          languageCode,
        },
      },
    };
    if (payload) {
      request.queryParams.payload = jsonToStruct(payload);
    }

    const [response] = await this.client.detectIntent(request);
    const responses = response.queryResult?.fulfillmentMessages;
    if (platform && responses) {
      return this.filterReponses(responses, platform);
    } else {
      return responses;
    }
  }

  async detectIntentSimpleEvent(
    eventName: string,
    sessionID: string,
    platform?: keyof typeof google.cloud.dialogflow.v2.Intent.Message.Platform,
    payload?: JsonObject,
    languageCode: string = this.defaultLanguageCode
  ) {
    const sessionPath = this.getSessionPath(sessionID);
    const request: google.cloud.dialogflow.v2.IDetectIntentRequest & {
      queryParams: object;
    } = {
      session: sessionPath,
      queryParams: {},
      queryInput: {
        event: {
          name: eventName,
          languageCode,
        },
      },
    };
    if (payload) {
      request.queryParams.payload = jsonToStruct(payload);
    }

    const [response] = await this.client.detectIntent(request);
    const responses = response.queryResult?.fulfillmentMessages;
    if (platform && responses) {
      return this.filterReponses(responses, platform);
    } else {
      return responses;
    }
  }

  filterReponses(
    responses: google.cloud.dialogflow.v2.Intent.IMessage[],
    platform: keyof typeof google.cloud.dialogflow.v2.Intent.Message.Platform
  ) {
    const platformResponses = responses.filter(this.matchPlatform(platform));
    if (platformResponses.length > 0) {
      return platformResponses;
    } else {
      const unspecifiedResponses = responses.filter(
        this.matchPlatform('PLATFORM_UNSPECIFIED')
      );
      return unspecifiedResponses;
    }
  }

  matchPlatform(
    platform: keyof typeof google.cloud.dialogflow.v2.Intent.Message.Platform
  ) {
    return (response: google.cloud.dialogflow.v2.Intent.IMessage) =>
      response.platform === platform ||
      response.platform ===
        google.cloud.dialogflow.v2.Intent.Message.Platform[platform];
  }
}
