const infobipSender = 'InfobipSender';
const infobipDestination = 'EndUsersNumber';

function sampleDetectIntentRequest(project, agentLocation, agentId, conversationId, text,
  language) {
  return {
    session: `projects/${project}/locations/${agentLocation}/agents/${agentId}/sessions/${conversationId}`,
    queryInput: {
      text: {
        text,
      },
      languageCode: language,
    },
  };
}

function sampleDialogflowResponse() {
  return [{
    responseId: 'ae1f08ab-71c8-4a0a-8e4f-632492c47d79',
    queryResult: {
      responseMessages: [{ text: { text: ['Hello! How can I help you?'], allowPlaybackInterruption: false }, message: 'text' }, { payload: { fields: { msgType: { stringValue: 'BUTTON', kind: 'stringValue' } } }, message: 'payload' }, { text: { text: ['What kind of coffee would you like?'], allowPlaybackInterruption: false }, message: 'text' }],
      webhookPayloads: [],
      webhookStatuses: [],
      languageCode: 'en',
      parameters: null,
      currentPage: {
        transitionRoutes: [], eventHandlers: [], transitionRouteGroups: [], name: 'projects/gcp-project/locations/us-central1/agents/ed103585-3ba2-4a6b-a1c9-4b751773fa41/flows/00000000-0000-0000-0000-000000000000/pages/80c293ab-de98-47bf-bebf-8dfb4a1378d3', displayName: 'Coffee', form: null, entryFulfillment: null,
      },
      intent: {
        trainingPhrases: [], parameters: [], labels: {}, name: 'projects/gcp-project/locations/us-central1/agents/agentId/intents/00000000-0000-0000-0000-000000000000', displayName: 'Default Welcome Intent', priority: 0, isFallback: false, description: '',
      },
      intentDetectionConfidence: 1,
      diagnosticInfo: {
        fields: {
          'Execution Sequence': {
            listValue: {
              values: [{
                structValue: {
                  fields: {
                    'Step 1': {
                      structValue: {
                        fields: {
                          InitialState: {
                            structValue: {
                              fields: {
                                MatchedIntent: {
                                  structValue: {
                                    fields: {
                                      DisplayName: { stringValue: 'Default Welcome Intent', kind: 'stringValue' }, Active: { boolValue: true, kind: 'boolValue' }, Score: { numberValue: 1, kind: 'numberValue' }, Id: { stringValue: '00000000-0000-0000-0000-000000000000', kind: 'stringValue' }, Type: { stringValue: 'NLU', kind: 'stringValue' },
                                    },
                                  },
                                  kind: 'structValue',
                                },
                                FlowState: { structValue: { fields: { Version: { numberValue: 0, kind: 'numberValue' }, Name: { stringValue: 'Default Start Flow', kind: 'stringValue' }, PageState: { structValue: { fields: { Name: { stringValue: 'Coffee', kind: 'stringValue' }, Status: { stringValue: 'TRANSITION_ROUTING', kind: 'stringValue' }, FormFilled: { boolValue: true, kind: 'boolValue' } } }, kind: 'structValue' } } }, kind: 'structValue' },
                              },
                            },
                            kind: 'structValue',
                          },
                          Type: { stringValue: 'INITIAL_STATE', kind: 'stringValue' },
                        },
                      },
                      kind: 'structValue',
                    },
                  },
                },
                kind: 'structValue',
              }, {
                structValue: {
                  fields: {
                    'Step 2': {
                      structValue: {
                        fields: {
                          StateMachine: {
                            structValue: {
                              fields: {
                                FlowState: { structValue: { fields: { Name: { stringValue: 'Default Start Flow', kind: 'stringValue' }, Version: { numberValue: 0, kind: 'numberValue' }, PageState: { structValue: { fields: { FormFilled: { boolValue: true, kind: 'boolValue' }, Status: { stringValue: 'TRANSITION_ROUTING', kind: 'stringValue' }, Name: { stringValue: 'Coffee', kind: 'stringValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }, TriggeredCondition: { stringValue: 'true', kind: 'stringValue' }, TargetPage: { stringValue: '80c293ab-de98-47bf-bebf-8dfb4a1378d3', kind: 'stringValue' }, TriggeredIntent: { stringValue: 'Default Welcome Intent', kind: 'stringValue' },
                              },
                            },
                            kind: 'structValue',
                          },
                          Type: { stringValue: 'STATE_MACHINE', kind: 'stringValue' },
                        },
                      },
                      kind: 'structValue',
                    },
                  },
                },
                kind: 'structValue',
              }, { structValue: { fields: { 'Step 3': { structValue: { fields: { Type: { stringValue: 'FUNCTION_EXECUTION', kind: 'stringValue' }, FunctionExecution: { structValue: { fields: { Responses: { listValue: { values: [{ structValue: { fields: { source: { stringValue: 'VIRTUAL_AGENT', kind: 'stringValue' }, text: { structValue: { fields: { text: { listValue: { values: [{ stringValue: 'Hello! How can I help you?', kind: 'stringValue' }] }, kind: 'listValue' }, redactedText: { listValue: { values: [{ stringValue: 'Hello! How can I help you?', kind: 'stringValue' }] }, kind: 'listValue' } } }, kind: 'structValue' }, responseType: { stringValue: 'HANDLER_PROMPT', kind: 'stringValue' } } }, kind: 'structValue' }, { structValue: { fields: { responseType: { stringValue: 'HANDLER_PROMPT', kind: 'stringValue' }, payload: { structValue: { fields: { msgType: { stringValue: 'BUTTON', kind: 'stringValue' } } }, kind: 'structValue' }, source: { stringValue: 'VIRTUAL_AGENT', kind: 'stringValue' } } }, kind: 'structValue' }] }, kind: 'listValue' } } }, kind: 'structValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }, { structValue: { fields: { 'Step 4': { structValue: { fields: { StateMachine: { structValue: { fields: { FlowState: { structValue: { fields: { PageState: { structValue: { fields: { Name: { stringValue: 'Coffee', kind: 'stringValue' }, Status: { stringValue: 'ENTERING_PAGE', kind: 'stringValue' } } }, kind: 'structValue' }, Version: { numberValue: 0, kind: 'numberValue' }, Name: { stringValue: 'Default Start Flow', kind: 'stringValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }, Type: { stringValue: 'STATE_MACHINE', kind: 'stringValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }, { structValue: { fields: { 'Step 5': { structValue: { fields: { Type: { stringValue: 'FUNCTION_EXECUTION', kind: 'stringValue' }, FunctionExecution: { structValue: { fields: { Responses: { listValue: { values: [{ structValue: { fields: { source: { stringValue: 'VIRTUAL_AGENT', kind: 'stringValue' }, text: { structValue: { fields: { text: { listValue: { values: [{ stringValue: 'Hello! How can I help you?', kind: 'stringValue' }] }, kind: 'listValue' }, redactedText: { listValue: { values: [{ stringValue: 'Hello! How can I help you?', kind: 'stringValue' }] }, kind: 'listValue' } } }, kind: 'structValue' }, responseType: { stringValue: 'HANDLER_PROMPT', kind: 'stringValue' } } }, kind: 'structValue' }, { structValue: { fields: { payload: { structValue: { fields: { msgType: { stringValue: 'BUTTON', kind: 'stringValue' } } }, kind: 'structValue' }, responseType: { stringValue: 'HANDLER_PROMPT', kind: 'stringValue' }, source: { stringValue: 'VIRTUAL_AGENT', kind: 'stringValue' } } }, kind: 'structValue' }, { structValue: { fields: { source: { stringValue: 'VIRTUAL_AGENT', kind: 'stringValue' }, responseType: { stringValue: 'ENTRY_PROMPT', kind: 'stringValue' }, text: { structValue: { fields: { text: { listValue: { values: [{ stringValue: 'What kind of coffee would you like?', kind: 'stringValue' }] }, kind: 'listValue' }, redactedText: { listValue: { values: [{ stringValue: 'What kind of coffe would you like?', kind: 'stringValue' }] }, kind: 'listValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }] }, kind: 'listValue' } } }, kind: 'structValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }, { structValue: { fields: { 'Step 6': { structValue: { fields: { StateMachine: { structValue: { fields: { FlowState: { structValue: { fields: { Version: { numberValue: 0, kind: 'numberValue' }, PageState: { structValue: { fields: { FormFilled: { boolValue: true, kind: 'boolValue' }, Status: { stringValue: 'TRANSITION_ROUTING', kind: 'stringValue' }, Name: { stringValue: 'Coffee', kind: 'stringValue' } } }, kind: 'structValue' }, Name: { stringValue: 'Default Start Flow', kind: 'stringValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }, Type: { stringValue: 'STATE_MACHINE', kind: 'stringValue' } } }, kind: 'structValue' } } }, kind: 'structValue' }],
            },
            kind: 'listValue',
          },
          'Alternative Matched Intents': {
            listValue: {
              values: [{
                structValue: {
                  fields: {
                    Active: { boolValue: true, kind: 'boolValue' }, DisplayName: { stringValue: 'Default Welcome Intent', kind: 'stringValue' }, Type: { stringValue: 'NLU', kind: 'stringValue' }, Score: { numberValue: 1, kind: 'numberValue' }, Id: { stringValue: '00000000-0000-0000-0000-000000000000', kind: 'stringValue' },
                  },
                },
                kind: 'structValue',
              }],
            },
            kind: 'listValue',
          },
          'Triggered Transition Names': { listValue: { values: [{ stringValue: '848aa872-975b-4db9-9f33-69d96a8faa8f', kind: 'stringValue' }] }, kind: 'listValue' },
          'Transition Targets Chain': { listValue: { values: [{ structValue: { fields: { TargetPage: { stringValue: '80c293ab-de98-47bf-bebf-8dfb4a1378d3', kind: 'stringValue' } } }, kind: 'structValue' }] }, kind: 'listValue' },
          'Session Id': { stringValue: 'CONVERSATION_2', kind: 'stringValue' },
        },
      },
      match: {
        intent: {
          trainingPhrases: [], parameters: [], labels: {}, name: 'projects/gcp-project/locations/us-central1/agents/ed103585-3ba2-4a6b-a1c9-4b751773fa41/intents/00000000-0000-0000-0000-000000000000', displayName: 'Default Welcome Intent', priority: 0, isFallback: false, description: '',
        },
        parameters: null,
        resolvedInput: 'Hi',
        matchType: 'INTENT',
        confidence: 1,
        event: '',
      },
      sentimentAnalysisResult: null,
      text: 'Hi',
      query: 'text',
    },
    outputAudio: { type: 'Buffer', data: [] },
    outputAudioConfig: null,
  }, null, null];
}

function sampleCcaasInboundMessage(givenContentType = 'TEXT', givenMessageText = 'Hello', givenConversationId = 'abcd',
  givenChannel = 'VIBER') {
  return {
    id: 'B3C502BC20CB3EA6031F863991E1D3A3',
    channel: givenChannel,
    from: infobipDestination,
    to: infobipSender,
    direction: 'INBOUND',
    conversationId: givenConversationId,
    createdAt: '2021-05-18T15:15:25.737+00:00',
    updatedAt: '2021-05-18T15:15:25.737+00:00',
    content: {
      text: givenMessageText,
      showUrlPreview: null,
    },
    singleSendMessage: {
      from: {
        phoneNumber: infobipDestination,
        type: 'PHONE_NUMBER',
      },
      to: {
        phoneNumber: infobipSender,
        type: 'PHONE_NUMBER',
      },
      content: {
        text: givenMessageText,
        trackingData: null,
        type: givenContentType,
      },
      channel: givenChannel,
      direction: 'INBOUND',
    },
    contentType: givenContentType,
  };
}

function sampleCcaasOutboundMessage(givenContentType = 'TEXT', givenMessageText = 'Hello! How can I help you?\nWhat kind of coffee would you like?', givenChannel = 'VIBER') {
  return {
    from: infobipSender,
    to: infobipDestination,
    channel: givenChannel,
    contentType: givenContentType,
    content: {
      text: givenMessageText,
    },
  };
}

module.exports = {
  sampleDetectIntentRequest,
  sampleDialogflowResponse,
  sampleCcaasInboundMessage,
  sampleCcaasOutboundMessage,
};
