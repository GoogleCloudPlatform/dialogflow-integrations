import {ButtonText, IconContainer, Link} from "../Styles";
import {Button as ButtonType} from "../utilities/types";

export const Button = ({button}: {button: ButtonType}) => {
  return (
    <div>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <Link href={button.link} target='_blank'>
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
