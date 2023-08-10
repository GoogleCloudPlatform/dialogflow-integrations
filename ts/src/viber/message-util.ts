import {google} from '@google-cloud/dialogflow/build/protos/protos';
import {google as googleCX} from '@google-cloud/dialogflow-cx/build/protos/protos';
import {
  Button,
  KeyboardType,
  Message,
  MessageJsonType,
  MessageType,
} from 'viber-bot';
import {structToJson} from '../util/struct';
import {load} from 'ts-dotenv';

const env = load({
  BUTTON_COLOR: String,
});

export const convertCXResponses = (
  responses: googleCX.cloud.dialogflow.cx.v3.IResponseMessage[],
  messageFactory: Message.MessageFactory
): MessageType[] =>
  responses.flatMap(
    (response): MessageType | MessageType[] =>
      // use text responses or convert payload for rich response as fallback
      response.text?.text?.map((text: string) => new Message.Text(text)) ??
      (response.payload
        ? messageFactory.createMessageFromJson({
            message: structToJson(response.payload) as MessageJsonType,
          })
        : [])
  );

const createMessageFromCard = (
  card: google.cloud.dialogflow.v2.Intent.Message.ICard
): MessageType => {
  let messageText = '';
  if (card.title) {
    messageText += card.title;
  }
  if (card.subtitle) {
    messageText += `\n${card.subtitle}`;
  }

  const buttons: Button[] = [];
  card.buttons?.forEach(cardButton => {
    if (!cardButton.text) {
      return;
    }
    const postback = cardButton.text || cardButton.postback;
    if (!postback) {
      return;
    }
    buttons.push({
      Text: cardButton.text,
      BgColor: env.BUTTON_COLOR,
      ActionBody: postback,
      ActionType: postback?.startsWith('http') ? 'open-url' : undefined,
    });
  });

  const keyboard: KeyboardType = {
    Type: 'keyboard',
    Buttons: buttons,
    DefaultHeight: true,
  };

  if (card.imageUri) {
    return new Message.Picture(card.imageUri, messageText, null, keyboard);
  } else {
    return new Message.Text(messageText, keyboard);
  }
};

const createMessageFromQuickReplies = (
  quickReplies: google.cloud.dialogflow.v2.Intent.Message.IQuickReplies
): MessageType => {
  const msgText = quickReplies.title || 'Choose an item';

  const keyboard: KeyboardType = {
    Type: 'keyboard',
    DefaultHeight: true,
    Buttons:
      quickReplies.quickReplies?.map(
        (quickReply): Button => ({
          ActionType: 'reply',
          ActionBody: quickReply,
          BgColor: env.BUTTON_COLOR,
          Text: quickReply,
          TextSize: 'regular',
        })
      ) ?? [],
  };

  return new Message.Text(msgText, keyboard);
};

export const convertESResponses = (
  responses: google.cloud.dialogflow.v2.Intent.IMessage[],
  messageFactory: Message.MessageFactory
): MessageType[] =>
  responses.flatMap((response): MessageType | MessageType[] => {
    if (response.text) {
      return (
        response.text?.text?.map((text: string) => new Message.Text(text)) ?? []
      );
    } else if (response.card) {
      return createMessageFromCard(response.card);
    } else if (response.quickReplies) {
      return createMessageFromQuickReplies(response.quickReplies);
    } else if (response.image) {
      return new Message.Picture(
        response.image.imageUri!,
        response.image.accessibilityText
      );
    } else if (response.payload?.fields?.viber) {
      return messageFactory.createMessageFromJson({
        message: structToJson(response.payload).viber as MessageJsonType,
      });
    } else {
      return [];
    }
  });
