import {
  Accordion,
  Button,
  Chips,
  Image,
  Description,
  Divider,
  Info,
  List,
  PayloadList,
  RichContent,
  RichContentPayload,
  ListItemProps,
  ButtonProps
} from "./types";

export const isButton = (param: RichContentPayload): param is Button => {
  return param.type === 'button';
}

export const isImage = (param: RichContentPayload): param is Image => {
  return param.type === 'image';
}

export const isInfo = (param: RichContentPayload): param is Info => {
  return param.type === 'info';
}

export const isChips = (param: RichContentPayload): param is Chips => {
  return param.type === 'chips';
}

export const isDescription = (param: RichContentPayload): param is Description => {
  return param.type === 'description';
}

export const isList = (param: RichContentPayload): param is List => {
  return param.type === 'list';
}

export const isDivider = (param: RichContentPayload): param is Divider => {
  return param.type === 'divider';
}

export const isPayloadList = (param: RichContentPayload): param is PayloadList => {
  return param.type === 'list' && 'subtitle' in param;
}

export const isAccordion = (param: RichContentPayload): param is Accordion => {
  return param.type === 'accordion';
}

export const isRichContent = (param: RichContentPayload): param is RichContent => {
  return !isPayloadList(param);
}

export const isButtonProps = (param: ButtonProps | ListItemProps): param is ButtonProps => {
  return 'button' in param;
}
