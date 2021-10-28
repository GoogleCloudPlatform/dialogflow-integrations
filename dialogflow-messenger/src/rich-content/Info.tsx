import {SubTitle, Title, InfoContainer, InfoTextContainer, InfoImage} from "../Styles";
import {Info as InfoType, Message} from "../utilities/types";

export const Info = ({info}: {info: InfoType}) => {

  return (
    <a href={info.actionLink} style={{textDecoration: 'none'}} target='_blank'>
      <InfoContainer>
        {info.image &&
          <InfoImage src={info.image?.src.rawUrl} />
        }
        <InfoTextContainer>
          <Title>{info.title}</Title>
          <SubTitle>{info.subtitle}</SubTitle>
        </InfoTextContainer>
      </InfoContainer>
    </a>
  )
}
