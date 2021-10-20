import styled, {keyframes} from 'styled-components';

export const Widget = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  box-shadow: rgb( 0 0 0 / 24%) 1px 4px 15px 0px;
  cursor: pointer;
  background-color: #42A5F5;
`;

interface MessengerProps {
  opened: boolean
}

export const Messenger = styled.div<MessengerProps>`
  position: fixed;
  bottom: 105px;
  right: 20px;
  width: 370px;
  height: 560px;
  background-color: #e5e5e5;
  opacity: ${props => props.opened ? "1" : "0"};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-shadow: 1px 4px 15px 0px rgb(0 0 0 / 0.24);
  transform: ${props => props.opened ? 'translate3d(0px, 0px, 0px) scale(1, 1);' : 'translateX(25%) translateY(35%) scale(0.5, 0.5)'};
  transition: transform 0.2s ease, opacity 0.2s ease-in${props => props.opened ? '': ', height 0s ease 0.2s'};
`;

export const TitleBar = styled.div`
  height: 50px;
  min-height: 50px;
  padding-left: 16px;
  display: flex;
  align-items: center;
  border-radius: 5px 5px 0 0;
  color: white;
  background-color: #42a5f5;
  box-shadow: 0px 3px 6px 0px #00000029;
  font-family: 'Roboto', sans-serif;
  font-size: 18px;
`;

export const TextWindow = styled.div`
  min-height: 0;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 250px;
`;

export const MessageListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;

export const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1;
  padding: 10px;
  overflow-x: hidden;
  overflow-y: scroll;

  > * {
    &:first-child {
      margin-top: auto !important;
    }
  }
`;

const Message = styled.div`
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  padding: 7px 16px;
  margin-top: 10px;
  align-self: flex-end;
  background-color: white;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
`;

const presentYourself = keyframes`
  100% {
    opacity: 1;
  }
`;

export const UserMessage = styled(Message)`
  background-color: #ddd;
  margin-left: 75px;
  align-self: flex-end;

  animation: ${presentYourself} 0.3s ease 0.1s forwards;
  opacity: 0;
`;

export const AgentMessage = styled(Message)`
  margin-right: 75px;
  align-self: flex-start;

  animation: ${presentYourself} 0.3s ease 0.1s forwards;
  opacity: 0;
`

export const InputField = styled.div`
  height: 50px;
  background-color: white;
  border-top: 1px solid #eeeeee;
  display: flex;
  font-family: 'Roboto', sans-serif;
  border-radius: 0 0 5px 5px;
`;

export const TextInput = styled.input`
  padding-left: 16px;
  font-size: 14px;
  width: 100%;
  border: none;
  outline: none;
`;

interface IconProps {
  visible: boolean
}

export const SendIcon = styled.svg<IconProps>`
  cursor: pointer;
  fill: #42A5F5;
  height: 24px;
  width: 24px;
  margin: 15px;
  transform: ${props => props.visible ? 'scale(1, 1);' : 'scale(0.01, 0.01);'}
  transition: 0.3s ease;

  &:hover {
    fill: green;
  }
`;

export const ChatSVG = styled.svg<IconProps>`
  height: 36px;
  left: 10px;
  opacity: ${props => props.visible ? '1' : '0'};
  position: absolute;
  top: 10px;
  transition: opacity 0.5s;
  width: 36px;
`;

export const CustomIcon = styled.img<IconProps>`
  height: 36px;
  left: 10px;
  opacity: ${props => props.visible ? '1' : '0'};
  position: absolute;
  top: 10px;
  transition: opacity 0.5s;
  width: 36px;
`;

export const CloseSVG = styled.svg<IconProps>`
  fill: white;
  left: 15px;
  opacity: ${props => props.visible ? '1' : '0'};
  transform: ${props => props.visible ? '' : 'rotate(-90deg);'};
  position: absolute;
  top: 15px;
  transition: transform 0.5s, opacity 0.5s;
`;
