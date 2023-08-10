// https://developers.viber.com/docs/api/nodejs-bot-api
declare module 'viber-bot' {
  import {Application} from 'express';
  import {Logger} from 'winston';
  import {JsonObject} from 'type-fest';
  import EventEmitter from 'events';
  import TypedEmitter from 'typed-emitter';

  export const enum Events {
    MESSAGE_RECEIVED = 'message',
    MESSAGE_SENT = 'message_sent',
    SUBSCRIBED = 'subscribed',
    UNSUBSCRIBED = 'unsubscribed',
    CONVERSATION_STARTED = 'conversation_started',
    ERROR = 'error',
    FAILED = 'failed',
  }

  type ConversationStartedOnFinishCallback = (
    responseMessage: MessageType | null,
    optionalTrackingData?: JsonObject
  ) => void;

  type MessageHandlerCallback = (
    message: MessageType,
    response: Response
  ) => void;
  type TextMessageHandlerCallback = MessageHandlerCallback;
  type MessageSentCallback = (
    message: MessageType,
    userProfile: UserProfile
  ) => void;
  type SubscribeResponseHandlerCallback = (response: Response) => void;
  type UnsubscribeResponseHandlerCallback = (response: Response) => void;
  type ConversationStartedEventHandlerCallback = (
    response: Response,
    isSubscribed: boolean,
    context: string
  ) => void;
  type ConversationStartedHandlerCallback = (
    userProfile: UserProfile,
    isSubscribed: boolean,
    context: string,
    // TODO: seems to be optional? https://github.com/Viber/viber-bot-node/blob/e202b1b6d73f929269caf82c392173937e2d4412/lib/viber-bot.js#L249
    onFinsh?: ConversationStartedOnFinishCallback
  ) => void;
  type ErrorHandlerCallback = (err: Error) => void;

  type ViberEvents = {
    [Events.MESSAGE_RECEIVED]: MessageHandlerCallback;
    [Events.MESSAGE_SENT]: MessageSentCallback;
    [Events.SUBSCRIBED]: SubscribeResponseHandlerCallback;
    [Events.UNSUBSCRIBED]: UnsubscribeResponseHandlerCallback;
    [Events.CONVERSATION_STARTED]: ConversationStartedEventHandlerCallback;
    [Events.ERROR]: ErrorHandlerCallback;
  };

  class Response {
    userProfile: UserProfile;
    send(
      messages: MessageType | MessageType[],
      optionalTrackingData?: JsonObject
    ): Promise<number[]>;
  }

  type AccountInfo = {
    id: string;
    name: string;
    uri: string;
    icon: string;
    background: string;
    category: string;
    subcategroy: string;
    location: {
      lat: number;
      lon: number;
    };
    country: string;
    webhook: string;
    event_types: Events[];
    subscribers_count: number;
  };

  type IUserProfile = {
    id: string;
    name: string;
    avatar?: string | null;
    country?: string | null;
    language?: string | null;
    apiVersion?: number | null;
  };

  class UserProfile implements IUserProfile {
    id: string;
    name: string;
    avatar: string | null;
    country: string | null;
    language: string | null;
    apiVersion: number | null;

    constructor(
      id: string,
      name: string,
      avatar?: string,
      country?: string,
      language?: string,
      apiVersion?: string
    );

    static fromJson(profile: IUserProfile): UserProfile;
  }

  type UserDetails = {
    id: string;
    name: string;
    avatar: string;
    country: string;
    language: string;
    primary_device_os: string;
    api_version: number;
    viber_version: string;
    mcc: number;
    mnc: number;
    device_type: string;
  };

  export const enum OnlineStatus {
    ONLINE = 0,
    OFFLINE = 1,
    UNDISCLOSED = 2,
    INTERNAL_ERROR = 3,
    UNAVAILABLE = 4,
  }

  type UserOnlineStatus = {
    id: string;
    online_status: OnlineStatus;
    online_status_message: string;
    last_online?: number;
  };

  type Options = {
    logger?: Logger;
    authToken: string;
    name: string;
    avatar: string;
    registerToEvents?: Events[];
  };

  export class Bot extends (EventEmitter as new () => TypedEmitter<ViberEvents>) {
    _messageFactory: Message.MessageFactory;

    constructor(configuration: Options);

    getBotProfile(): Promise<UserProfile>;
    getUserDetails(userProfile: UserProfile): Promise<UserDetails>;
    getOnlineStatus(
      viberUserIds: string[] | string
    ): Promise<UserOnlineStatus[]>;
    setWebhook(url: string): Promise<{event_types: Events[]}>;
    sendMessage(
      userProfile: UserProfile,
      messages: MessageType[] | MessageType,
      optionalTrackingData?: JsonObject
    ): Promise<number[]>;
    sendMessage(
      userProfile: null,
      messages: MessageType[] | MessageType,
      optionalTrackingData: JsonObject | null,
      chatId: string
    ): Promise<number[]>;
    onTextMessage(regex: RegExp, handler: TextMessageHandlerCallback): void;
    onError(handler: ErrorHandlerCallback): void;
    onConversationStarted(handler: ConversationStartedHandlerCallback): void;
    onSubscribe(handler: SubscribeResponseHandlerCallback): void;
    onUnsubscribe(handler: UnsubscribeResponseHandlerCallback): void;
    middleware(): Application;
  }

  type InternalBrowserConfiguration = {
    ActionButton?:
      | 'forward'
      | 'send'
      | 'open-externally'
      | 'send-to-bot'
      | 'none';
    ActionPredefinedURL?: string;
    TitleType?: 'domain' | 'default';
    CustomTitle?: string;
    Mode?:
      | 'fullscreen'
      | 'fullscreen-portrait'
      | 'fullscreen-landscape'
      | 'partial-size';
    FooterType?: 'default' | 'hidden';
    ActionReplyData?: string;
  };

  // https://developers.viber.com/docs/tools/keyboards/#buttons-parameters
  type Button = {
    Columns?: number;
    Rows?: number;
    BgColor?: string;
    Silent?: boolean;
    BgMediaType?: 'picture' | 'gif';
    BgMedia?: string;
    BgMediaScaleType?: 'crop' | 'fill' | 'fit';
    ImageScaleType?: 'crop' | 'fill' | 'fit';
    BgLoop?: boolean;
    ActionType?:
      | 'reply'
      | 'open-url'
      | 'location-picker'
      | 'share-phone'
      | 'none';
    ActionBody: string;
    Image?: string;
    Text?: string;
    TextVAlign?: 'top' | 'middle' | 'bottom';
    TextHAlign?: 'left' | 'center' | 'right';
    TextPaddings?: [number, number, number, number];
    TextOpacity?: number;
    OpenURLType?: 'internal' | 'external';
    OpenURLMediaType?: 'not-media' | 'video' | 'gif' | 'picture';
    TextBgGradientColor?: string;
    TextShouldFit?: boolean;
    TextSize?: 'small' | 'regular' | 'large';
    InternalBrowser?: InternalBrowserConfiguration;
    Map?: {
      Latitude?: string;
      Longitude?: string;
    };
    Frame?: {
      BorderWidth?: number;
      BorderColor?: string;
      CornerRadius?: number;
    };
    MediaPlayer?: {
      Title?: string;
      Subtitle?: string;
      ThumbnailURL?: string;
      Loop?: boolean;
    };
  };

  // https://developers.viber.com/docs/tools/keyboards/#favoritesMetadata
  type FavoritesMetadata = {
    type: 'gif' | 'link' | 'video';
    url: string;
    title?: string;
    thumbnail?: string;
    domain?: string;
    width?: number;
    height?: number;
    alternativeUrl?: string;
    alternativeText?: string;
  };

  // https://developers.viber.com/docs/tools/keyboards/#general-keyboard-parameters
  type KeyboardType = {
    Type: 'keyboard';
    Buttons: Button[];
    BgColor?: string;
    DefaultHeight?: boolean;
    CustomDefaultHeight?: number;
    HeightScale?: number;
    ButtonGroupColumns?: number;
    ButtonGroupRows?: number;
    InputFieldState?: 'regular' | 'minimized' | 'hidden';
    FavoritesMetadata?: FavoritesMetadata[];
  };

  type RichMediaButtons = {
    ButtonGroupColumns: number;
    ButtonGroupRows: number;
    BgColor: string;
    Buttons: Button[];
  };

  type MessageType =
    | Message.Text
    | Message.Url
    | Message.Contact
    | Message.File
    | Message.Location
    | Message.Picture
    | Message.Video
    | Message.Sticker
    | Message.RichMedia
    | Message.Keyboard;

  type ExtractJson<T> = T extends Message.Message<infer X> ? X : never;
  type MessageJsonType = ExtractJson<MessageType>;

  // TODO: should timestamp and token be typed?
  // https://developers.viber.com/docs/api/rest-bot-api/#message-types
  namespace Message {
    abstract class Message<T extends BaseMessageJson<string> | KeyboardJson> {
      timestamp: number;
      token: string;
      trackingData: JsonObject | null;
      keyboard: KeyboardType | null;
      minApiVersion: number | null;

      static getType<T extends BaseMessageJson<string>>(): T['type'] | null;
      static fromJson(
        json: InputMessageJson<JsonObject>
      ): Message<BaseMessageJson<string> | KeyboardJson>;
      toJson(): T;
    }

    type InputMessageJson<T> = T & {tracking_data?: JsonObject};

    type BaseMessageJson<T extends string> = {
      type: T;
    };

    type TextJson = BaseMessageJson<'text'> & {
      text: Text['text'];
    };

    export class Text extends Message<TextJson> {
      text: string;
      constructor(
        text: string,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): TextJson['type'];
      static fromJson(json: TextJson): Text;
    }

    type UrlJson = BaseMessageJson<'url'> & {
      media: Url['url'];
    };

    export class Url extends Message<UrlJson> {
      url: string;

      constructor(
        url: string,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): UrlJson['type'];
      static fromJson(json: InputMessageJson<UrlJson>): Url;
    }

    type ContactJson = BaseMessageJson<'contact'> & {
      contact: {
        name: Contact['contactName'];
        phone_number: Contact['contactPhoneNumber'];
        avatar: Contact['contactAvatar'];
      };
    };

    export class Contact extends Message<ContactJson> {
      contactName: string;
      contactPhoneNumber: string;
      contactAvatar: string | null;

      constructor(
        contactName: string,
        contactPhoneNumber: string,
        optinalAvatar?: string,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): ContactJson['type'];
      static fromJson(json: InputMessageJson<ContactJson>): Contact;
    }

    type FileJson = BaseMessageJson<'file'> & {
      media: File['url'];
      size: File['sizeInBytes'];
      file_name: File['filename'];
    };

    export class File extends Message<FileJson> {
      url: string;
      sizeInBytes: number;
      filename: string;

      constructor(
        url: string,
        sizeInBytes: number,
        filename: string,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): FileJson['type'];
      static fromJson(json: InputMessageJson<FileJson>): File;
    }

    type LocationJson = BaseMessageJson<'location'> & {
      location: {
        lat: Location['latitude'];
        lon: Location['longitude'];
      };
    };

    export class Location extends Message<LocationJson> {
      latitude: number;
      longitude: number;

      constructor(
        latitude: number,
        longitude: number,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): LocationJson['type'];
      static fromJson(json: InputMessageJson<LocationJson>): Location;
    }

    type PictureJson = BaseMessageJson<'picture'> & {
      text: Picture['text'];
      media: Picture['url'];
      thumbnail: Picture['thumbnail'];
    };

    export class Picture extends Message<PictureJson> {
      url: string;
      text: string | null;
      thumbnail: string | null;

      constructor(
        url: string,
        optionalText?: string | null,
        optionalThumbnail?: string | null,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): PictureJson['type'];
      static fromJson(json: InputMessageJson<PictureJson>): Picture;
    }

    type VideoJson = BaseMessageJson<'video'> & {
      media: Video['url'];
      text: Video['text'];
      thumbnail: Video['thumbnail'];
      size: Video['size'];
      duration: Video['duration'];
    };

    export class Video extends Message<VideoJson> {
      url: string;
      size: number;
      text: string | null;
      thumbnail: string | null;
      duration: number | null;

      constructor(
        url: string,
        size: number,
        optionalText?: string | null,
        optionalThumbnail?: string | null,
        optionalDuration?: number | null,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): VideoJson['type'];
      static fromJson(json: InputMessageJson<VideoJson>): Video;
    }

    type StickerJson = BaseMessageJson<'sticker'> & {
      sticker_id: Sticker['stickerId'];
    };

    export class Sticker extends Message<StickerJson> {
      stickerId: string;

      constructor(
        stickerId: string,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): StickerJson['type'];
      static fromJson(json: InputMessageJson<StickerJson>): Sticker;
    }

    type RichMediaJson = BaseMessageJson<'rich_media'> & {
      rich_media: RichMedia['richMedia'];
      alt_text: RichMedia['altText'];
      min_api_version: number;
    };

    export class RichMedia extends Message<RichMediaJson> {
      richMedia: RichMediaButtons;
      altText: string | null;

      constructor(
        richMedia: RichMediaButtons,
        optionalKeyboard?: KeyboardType | null,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        optionalAltText?: string | null,
        minApiVersion?: number
      );

      static getType(): RichMediaJson['type'];
      static fromJson(json: InputMessageJson<RichMediaJson>): RichMedia;
    }

    type KeyboardJson = {keyboard: KeyboardType};

    // TODO: unusual message, isn't doc'd
    export class Keyboard extends Message<KeyboardJson> {
      keyboard: KeyboardType;

      constructor(
        keyboard: KeyboardType,
        optionalTrackingData?: JsonObject | null,
        timestamp?: number | null,
        token?: string | null,
        minApiVersion?: number
      );

      static getType(): null;
      static fromJson(json: InputMessageJson<KeyboardJson>): Keyboard;
    }

    type MessageFactory = {
      createMessageFromJson<T extends MessageType>(json: {
        message: InputMessageJson<ExtractJson<T>> & {
          timestamp?: number;
          message_token?: string;
        };
        timestamp?: number;
        message_token?: string;
      }): T;
    };
  }
}
