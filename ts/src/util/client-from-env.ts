import {strict as assert} from 'assert';
import {load} from 'ts-dotenv';
import CXClientWrapper from './cx-client';
import ESClientWrapper from './es-client';
import parseDuration from 'parse-duration';

type DFClient =
  | {client: CXClientWrapper; type: 'CX'}
  | {client: ESClientWrapper; type: 'ES'};

export default function createClientFromEnv(): DFClient {
  const env = load({
    GCP_PROJECT: String,
    DF_ENDPOINT: {type: String, optional: true},
    AGENT_TYPE: ['CX' as const, 'ES' as const],
    AGENT_LOCATION: String,
    AGENT_ID: {type: String, optional: true},
    SESSION_TTL: {type: String, optional: true},
    LANGUAGE_CODE: String,
  });

  switch (env.AGENT_TYPE) {
    case 'CX': {
      assert.ok(
        env.AGENT_ID,
        'Dialogflow CX Agent requires AGENT_ID to be specified'
      );

      const ttlSeconds = env.SESSION_TTL
        ? parseDuration(env.SESSION_TTL, 'sec')
        : undefined;

      const client = new CXClientWrapper(
        env.GCP_PROJECT,
        env.AGENT_LOCATION,
        env.AGENT_ID,
        env.LANGUAGE_CODE,
        env.DF_ENDPOINT,
        ttlSeconds
      );
      return {client, type: env.AGENT_TYPE};
    }
    case 'ES': {
      const client = new ESClientWrapper(
        env.GCP_PROJECT,
        env.AGENT_LOCATION,
        env.LANGUAGE_CODE,
        env.DF_ENDPOINT
      );
      return {client, type: env.AGENT_TYPE};
    }
  }
}
