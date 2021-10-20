import {UserMessage, AgentMessage} from "../Styles";
import {Message} from "../utilities/types";

export const Text = ({message}: {message: Message}) => {
  const TypedMessage = message.type === 'user' ? UserMessage : AgentMessage;

  return (
    <TypedMessage>
      {message.text}
    </TypedMessage>
  )
}
