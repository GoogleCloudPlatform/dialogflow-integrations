import {
  Button,
  Info,
  Chips,
  Description,
  List,
  Accordion,
} from '../rich-content';
import {isButton, isImage, isInfo, isChips, isDescription, isList, isAccordion} from './typeguards';
import {RichContent} from './types';
import {Image} from '../Styles';

export const getAttributes = (domElement: Element): {[key: string]: string} => {
  let attributes: {[key: string]: string} = {}
  for (let i = 0; i < domElement.attributes.length; i++) {
    const attribute = domElement.attributes.item(i)
    if (attribute) {
      attributes[attribute.name] = attribute.value;
    }
  }
  return attributes;
}

export const renderRichContent = (param: RichContent) => {
  if (isButton(param)) return <Button button={param} />
  if (isImage(param)) return <Image alt={param.accessibilityText} src={param.rawUrl} />
  if (isInfo(param)) return <Info info={param} />
  if (isChips(param)) return <Chips chips={param} />
  if (isDescription(param)) return <Description description={param} />
  if (isList(param)) return <List list={param} />
  if (isAccordion(param)) return <Accordion accordion={param} />
}
