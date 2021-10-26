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
`;

export const RichContentCard = styled.div`
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0px 2px 2px 0px rgb(0 0 0 / 24%);
  margin-top: 10px;
`;

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

export const Link = styled.a`
  align-items: center;
  background: white;
  border-radius: 8px;
  color: black;
  cursor: pointer;
  display: flex;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  padding: 12px 12px;
  text-decoration: none;
`

export const IconContainer = styled.div`
  height: 24px;
  width: 24px;
  margin-right: 12px;
`;

export const ButtonText = styled.div`

`;

export const Image = styled.img`
  background: url("dist/images/progress_spinner_grey.gif") 50% no-repeat;
  borderRadius: 8px;
  borderStyle: none;
  width: 100%;
`;

export const InfoContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  display: flex;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  padding: 16px;
`;

export const InfoImage = styled.img`
  background-repeat: no-repeat;
  background-size: contain;
  margin-right: 24px;
  max-height: 24px;
  max-width: 24px;
`;

export const InfoTextContainer = styled.div`
  display: block;
`;

export const DescriptionContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
  padding: 16px;
`;

export const DescriptionTitle = styled.div`
  color: black;
  font-size: 14px;
  font-weight: bold;

`;

export const DescriptionLine = styled.div`
  color: rgba(0,0,0,0.87);
  font-size: 14px;
  padding-top: 8px;
  word-break: break-word;
`;

export const Title = styled.div`
  color: black;
  font-weight: bold;
`;

export const SubTitle = styled.div`
  color: #757577;
  padding-top: 8px;
`;

export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid #e0e0e0;
  margin: 0;
`

export const ListItemContainer = styled.div`
  background: linear-gradient( to left, rgba(216,209,213) 0%, rgba(177,166,177) 47%, rgba(216,209,213) 100% ) left bottom white no-repeat;
  background-size: 100% 1px;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  padding: 16px;
`;

export const AccordionContainer = styled.div`
  background: white;
  border-radius: 8px;
  color: black;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  padding: 12px 12px;
  text-decoration: none;
`;

export const TopRow = styled.button`
  display: flex;
  justify-content: space-between;
  background-color: white;
  border: none;
  cursor: pointer;
`;

export const Content = styled.div`
  display: flex;
`

export const ImageContent = styled.div`
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
`;

export const AccordionImage = styled.img`
  border-radius: 3px;
  margin-right: 10px;
  max-width: 47px;
`;

export const TextContent = styled.div`
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-evenly;
`;

export const AccordionTitle = styled(Title)`
  word-break: break-word;
  word-wrap: break-word;
  text-align: left;
`
export const AccordionSubTitle = styled(SubTitle)`
  word-break: break-word;
  word-wrap: break-word;
`

interface AccordionProps {
  open: Boolean
}

export const AccordionIcon = styled.span<AccordionProps>`
  font-size: 32px;
  padding: 7px 0;
  color: #757575;
  transform: rotate(${props => props.open ? "-" : ""}90deg);
  transition: transform 0.15s ease-${props => props.open ? "out" : "in"};
`;

export const TextRow = styled.div<AccordionProps>`
  max-height: ${props => props.open ? "inherit" : "0"};
  margin-top: ${props => props.open ? "10px" : "0"};
  margin-left: 4px;
  overflow: hidden;
  transition: max-height 0.25s ease-${props => props.open ? "out" : "in"};
`;

export const ChipContainer = styled.div`
  padding: 10px;
`

export const Chip = styled.a`
  align-items: center;
  background-color: white;
  border-radius: 20px;
  border: 1px solid;
  border-color: #e0e0e0;
  box-shadow: 0px 2px 2px 0px rgb(0 0 0 / 24%);
  color: black;
  cursor: pointer;
  display: inline-flex;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  height: 35px;
  margin: 0 10px 10px 0;
  padding: 0 16px;
  text-decoration: none;
  vertical-align: bottom;
`;

export const ChipImage = styled.img`
  margin-right: 8px;
  max-height: 17.5px;
  max-width: 17.5px;
`;

export const Redirect = styled.svg`
  display: inline-block;
  height: 15px;
  margin-left: 8px;
  width: 15px;
`;
