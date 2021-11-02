import {Chip, ChipContainer, ChipImage, Redirect} from "../Styles";
import {Chips as ChipsType} from "../utilities/types";

const Option = ({text, link, image}: {
  text: string;
  link: string;
  image?: {
    src: {
      rawUrl: string
    }
  }
}) => {
  return (
    <Chip href={link} target='_blank'>
      {image && <ChipImage src={image.src.rawUrl} />}
      {text}
      {/* Redirect Icon */}
      <Redirect xmlns="http://www.w3.org/2000/svg" fill="black" height="24" viewBox="0 0 24 24" width="24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
      </Redirect>
    </Chip>
  )
}

export const Chips = ({chips}: {chips: ChipsType}) => {

  return (
    <ChipContainer>
      {chips.options.map(opt => <Option text={opt.text} link={opt.link} image={opt.image} />)}
    </ChipContainer>
  )
}
