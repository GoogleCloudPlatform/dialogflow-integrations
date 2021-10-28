import {DescriptionContainer, DescriptionLine, DescriptionTitle} from "../Styles";
import {Description as DescriptionType} from "../utilities/types";

export const Description = ({description}: {description: DescriptionType}) => {

  return (
    <DescriptionContainer>
      <DescriptionTitle>{description.title}</DescriptionTitle>
      {description.text.map(line => <DescriptionLine>{line}</DescriptionLine>)}
    </DescriptionContainer>
  )
}
