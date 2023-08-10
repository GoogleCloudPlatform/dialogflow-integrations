export type Webhook = {
  id: string;
  name: string;
  targetUrl: string;
  resource:
    | 'attachmentActions'
    | 'memberships'
    | 'messages'
    | 'rooms'
    | 'meetings'
    | 'recordings'
    | 'meetingParticipants'
    | 'meetingTranscripts';
  event:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'started'
    | 'ended'
    | 'joined'
    | 'left'
    | 'migrated';
  filter: string;
  secret: string;
  status: 'active' | 'inactive';
  created: string;
  ownedBy: string;
};

export type Attachment = {
  contentType?: string;
  content?: {
    type: 'AdaptiveCard';
    version: string;
    body?: {type: string; text: string; size: string}[];
    actions?: {type: string; url: string; title: string}[];
  };
};

export type CreateMessageRequest = {
  roomId?: string;
  parentId?: string;
  toPersonId?: string;
  toPersonEmail?: string;
  text?: string;
  markdown?: string;
  html?: string;
  files?: string[];
  attachments?: Attachment[];
};

export type MessageDetails = {
  id: string;
  parentId?: string;
  roomId: string;
  roomType: 'direct' | 'group';
  text?: string;
  markdown?: string;
  html?: string;
  files?: string[];
  personId: string;
  personEmail: string;
  mentionedPeople?: string[];
  mentionedGroups?: string[];
  attachments?: Attachment[];
  created?: string;
  updated?: string;
  isVoiceClip?: boolean;
};
