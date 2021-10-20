
export interface Message {
  type: 'user' | 'agent';
  text: string;
  id?: string;
}

export interface APIResponse {
  queryResult: {
    text: string
    languageCode: string
    responseMessages: {
      text: {
        text: string[]
        redactedText: string[]
      },
      source: string
    }[]
  }
}
