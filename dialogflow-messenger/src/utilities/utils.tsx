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

export const renderRichContent = (param: RichContent, i: number) => {
  if (isButton(param)) return <Button key={i} button={param} />
  if (isImage(param)) return <Image key={i} alt={param.accessibilityText} src={param.rawUrl} />
  if (isInfo(param)) return <Info key={i} info={param} />
  if (isChips(param)) return <Chips key={i} chips={param} />
  if (isDescription(param)) return <Description key={i} description={param} />
  if (isList(param)) return <List key={i} list={param} />
  if (isAccordion(param)) return <Accordion key={i} accordion={param} />
}
