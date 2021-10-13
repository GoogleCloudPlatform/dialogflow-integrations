import { useEffect, useState, useRef } from 'react';
import { Text } from './rich-content/Text';
import {
  Widget,
  Messenger,
  TitleBar,
  TextWindow,
  MessageListWrapper,
  MessageList,
  InputField,
  TextInput,
  SendIcon,
  ChatSVG,
  CloseSVG
} from './Styles';
import {Message} from './utilities/types';

const getAttributes = (domElement: Element): { [key: string]: string } => {
  let attributes: { [key: string]: string } = {}
  for (let i = 0; i < domElement.attributes.length; i++) {
    const attribute = domElement.attributes.item(i)
    if (attribute) {
      attributes[attribute.name] = attribute.value;
    }
  }
  return attributes;
}

const getRandomString = () => {
  return (Math.random() + 1).toString(36).substring(7);
}

const getRandomSentence = (length: number) => {
  return [...Array(length)].map(i => getRandomString()).join(' ');
}

function getRandomNumber(min: number, max: number) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const ChatIcon = ({visible}: {visible: boolean}) => {
  return (
    <ChatSVG visible={visible} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="3" y="3" width="30" height="30">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M24.0001 19.5C24.8251 19.5 25.5001 18.825 25.5001 18V4.5C25.5001 3.675 24.8251 3 24.0001 3H4.50006C3.67506 3 3.00006 3.675 3.00006 4.5V25.5L9.00006 19.5H24.0001ZM22.5001 5.99999V16.5H9.00013H6.00013V5.99999H22.5001ZM28.5 9.00001H31.5C32.325 9.00001 33 9.67501 33 10.5V33L27 27H10.5C9.675 27 9 26.325 9 25.5V22.5H28.5V9.00001Z" fill="white"/>
      </mask>
      <g mask="url(#mask0)">
        <rect width="36" height="36" fill="white"/>
      </g>
    </ChatSVG>
  )
}

const CloseIcon = ({visible}: {visible: boolean}) => {
  return (
    <CloseSVG visible={visible} id="closeSvg" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59
          12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
      <path d="M0 0h24v24H0z" fill="none"></path>
    </CloseSVG>
  )
}

function App({ domElement }: { domElement: Element }) {
  const {
    "chat-title": chatTitle,
    'agent-id': agentId,
    'language-code': languageCode,
    'api-uri': apiURI,
    'chat-icon': chatIcon,
    location
  } = getAttributes(domElement);

  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const updateAgentMessage = (value: string) => {
    const messagesCopy = [...messages];

    let lastAgentIndex = messagesCopy.length - 1;
    while (messagesCopy[lastAgentIndex].type !== 'agent') lastAgentIndex--;

    if (messagesCopy[lastAgentIndex].type === 'agent') {
      messagesCopy[lastAgentIndex].text = value;
      setMessages(messagesCopy);
      scrollToBottom();
    }
  }

  const addUserMessage = () => {
    const messagesCopy = [...messages].concat({type: 'user', text: value});
    setMessages(messagesCopy);
    setValue('');
  }

  const addAgentMessage = (value: string) => {
    const messagesCopy = [...messages].concat({type: 'agent', text: value});
    setMessages(messagesCopy);
    setValue('');
  }

  useEffect(() => {
    scrollToBottom()

    if (messages.length > 0) {
      if (messages[messages.length - 1].type === 'agent') {
        setTimeout(() => {
          updateAgentMessage(getRandomSentence(getRandomNumber(2, 15)));
        }, 2000);
      } else {
        addAgentMessage('...')
      }
  }
  }, [messages.length]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addUserMessage();
    }
  }

  return (
    <div className="App">
      <Messenger opened={open}>
        <TitleBar>
          {chatTitle}
        </TitleBar>
        <TextWindow>
          <MessageListWrapper>
            <MessageList>
              {messages.map((message, i) => (
                <Text key={i} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </MessageList>
          </MessageListWrapper>
        </TextWindow>
        <InputField>
          <TextInput id="text-input" type='text' value={value} onKeyDown={handleKeyDown} onChange={(event) => setValue(event.target.value)} placeholder="Ask something..." />
          <div onClick={() => addUserMessage()}>
            <SendIcon visible={value.length > 0}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </SendIcon>
          </div>
        </InputField>
      </Messenger>
      <Widget onClick={() => setOpen(!open)}>
          <ChatIcon visible={!open} />
          <CloseIcon visible={open} />
      </Widget>
    </div>
  );
}

export default App;
