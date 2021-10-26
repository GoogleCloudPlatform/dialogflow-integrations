import {useState} from "react";
import {AccordionContainer, AccordionIcon, AccordionImage, AccordionSubTitle, AccordionTitle, Content, ImageContent, TextContent, TextRow, TopRow} from "../Styles";
import {Accordion as AccordionType} from "../utilities/types";

export const Accordion = ({accordion}: {accordion: AccordionType}) => {
  const [open, setOpen] = useState(false);

  return (
    <AccordionContainer>
      <TopRow onClick={() => setOpen(!open)}>
        <Content>
          {accordion.image &&
            <ImageContent>
              <AccordionImage src={accordion.image?.src?.rawUrl} />
            </ImageContent>
          }
          <TextContent>
            <AccordionTitle>{accordion.title}</AccordionTitle>
            <AccordionSubTitle>{accordion.subtitle}</AccordionSubTitle>
          </TextContent>
        </Content>
        <div>
          <AccordionIcon open={open} className='material-icons'>
            chevron_right
          </AccordionIcon>
        </div>
      </TopRow>
      <TextRow open={open}>
        {accordion.text}
      </TextRow>
    </AccordionContainer>
  )
}
