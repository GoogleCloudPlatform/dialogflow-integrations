import {
  Button,
  Info,
  Chips,
  Description,
  List,
  Accordion,
} from '../rich-content';
import {isButton, isImage, isInfo, isChips, isDescription, isList, isAccordion, isButtonProps} from './typeguards';
import {ButtonProps, ListItemProps, Message, RichContent} from './types';
import {Image} from '../Styles';
import {handleResponse} from './responseHandlers';

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

export const renderRichContent = (
  param: RichContent,
  i: number,
  apiURI: string,
  addMessage: (message: Message) => void,
  updateAgentMessage: (r: any) => void,
  languageCode?: string,
) => {
  if (isAccordion(param)) return <Accordion key={i} accordion={param} />
  if (isImage(param)) return <Image key={i} alt={param.accessibilityText} src={param.rawUrl} />
  if (isInfo(param)) return <Info key={i} info={param} />
  if (isChips(param)) return <Chips key={i} chips={param} />
  if (isDescription(param)) return <Description key={i} description={param} />
  if (isList(param)) return (
    <List
      key={i}
      list={param}
      apiURI={apiURI}
      languageCode={languageCode}
      addMessage={addMessage}
      updateAgentMessage={updateAgentMessage}
    />
  )
  if (isButton(param)) return (
    <Button
      key={i}
      button={param}
      apiURI={apiURI}
      languageCode={languageCode}
      addMessage={addMessage}
      updateAgentMessage={updateAgentMessage}
    />
  )

}

export const addAgentMessage = async (props: ButtonProps | ListItemProps) => {
  const {apiURI, languageCode, addMessage, updateAgentMessage} = props

  const richContent = isButtonProps(props) ? props.button : props.item;

  addMessage({type: 'agent', text: '...', id: richContent.event?.name})

  const response = await handleResponse(apiURI, languageCode, richContent.event?.name, true)
  updateAgentMessage(response, true)
}
