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
          {/* Chevron Right Icon */}
          <AccordionIcon open={open} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#455A64">
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M7.59 18.59L9 20l8-8-8-8-1.41 1.41L14.17 12" />
          </AccordionIcon>
        </div>
      </TopRow>
      <TextRow open={open}>
        {accordion.text}
      </TextRow>
    </AccordionContainer>
  )
}
