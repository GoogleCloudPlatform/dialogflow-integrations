interface Event {
  name: string;
  languageCode: string;
  parameters: {[key: string]: string}
}

export interface Button {
  icon?: {
    type: string;
    color: string;
  };
  event?: Event;
  link: string;
  text: string;
  type: 'button';
}

export interface Image {
  rawUrl: string;
  accessibilityText: string;
  type: 'image';
}

export interface Info {
  subtitle: string;
  title: string;
  actionLink: string;
  image?: {
    src: {
      rawUrl: string;
    }
  };
  type: 'info';
}

export interface Chips {
  options: {
    text: string;
    link: string;
    image?: {
      src: {
        rawUrl: string;
      }
    };
  }[];
  type: 'chips';
}

export interface Description {
  title: string;
  text: string[];
  type: 'description';
}

export interface ListItem {
  subtitle: string;
  event?: Event;
  title: string;
}

export interface List {
  items: Array<'DIVIDER' | ListItem>;
  type: 'list'
}

export interface Accordion {
  subtitle: string;
  image?: {
    src: {
      rawUrl: string;
    }
  };
  title: string;
  text: string;
  type: 'accordion';
}

export interface Divider {
  type: 'divider';
}

export interface PayloadList extends ListItem {
  type: 'list';
}

export type RichContent =
  | Button
  | Image
  | Info
  | Chips
  | Description
  | List
  | Accordion;

export type RichContentPayload =
  | Button
  | Image
  | Info
  | Chips
  | Description
  | List
  | PayloadList
  | Divider
  | Accordion;

export interface Message {
  type: 'user' | 'agent';
  text?: string;
  payload?: RichContentPayload[];
  id?: string;
}

export interface APIResponse {
  queryResult: {
    text: string
    languageCode: string
    responseMessages: {
      text?: {
        text: string[]
        redactedText: string[]
      },
      payload?: {
        richContent: RichContent[][]
      }
      source: string
    }[]
  }
}
