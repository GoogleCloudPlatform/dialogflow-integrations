import './App.css';
import { useEffect, useState, useRef } from 'react';

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

interface Message {
  type: 'user' | 'agent';
  text: string;
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

const Message = ({message}: {message: Message}) => {
  return (
    <div className={`message ${message.type}-message ${message.type}-animation`}>
      {message.text}
    </div>
  )
}

function App({ domElement }: { domElement: Element }) {
  const {
    "chat-title": chatTitle,
    'agent-id': agentId,
    'language-code': languageCode,
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
      <div className="messenger" data-opened={open}>
        <div className="title-bar">
          {chatTitle}
        </div>
        <div className="text-window">
          <div className="message-list-wrapper">
            <div className="message-list">
              {messages.map((message, i) => (
                <Message key={i} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        <div className="input-field">
          <input id="text-input" type='text' className="input" value={value} onKeyDown={handleKeyDown} onChange={(event) => setValue(event.target.value)} placeholder="Ask something..." />
          <div onClick={() => addUserMessage()}>
            <svg id="sendIcon" data-visible={value.length > 0}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </div>
        </div>
      </div>
      <button onClick={() => setOpen(!open)} className="widget" />
    </div>
  );
}

export default App;
