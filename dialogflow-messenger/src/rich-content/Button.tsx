import {ButtonText, IconContainer, Link} from "../Styles";
import {addAgentMessage} from '../utilities/utils';
import {ButtonProps} from "../utilities/types";

export const Button = (props: ButtonProps) => {
  const {button} = props

  return (
    <div>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <Link onClick={() => addAgentMessage(props)} href={button.link} target='_blank'>
        {button.icon && (
          <IconContainer>
            <span className='material-icons' style={{color: button.icon.color}}>
              {button.icon.type}
            </span>
          </IconContainer>
        )}
        <ButtonText>
          {button.text}
        </ButtonText>
      </Link>
    </div>
  )
}
