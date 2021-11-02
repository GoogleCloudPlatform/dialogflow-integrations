import {ChatSVG, CloseSVG, CustomIcon} from '../Styles';

export const ChatIcon = ({visible, url}: {visible: boolean, url?: string}) => {
  return url ?
    <CustomIcon visible={visible} src={url} />
    :
    /* Dialogflow Messenger Icon */
    (
      <ChatSVG visible={visible} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="3" y="3" width="30" height="30">
          <path fillRule="evenodd" clipRule="evenodd" d="M24.0001 19.5C24.8251 19.5 25.5001 18.825 25.5001 18V4.5C25.5001 3.675 24.8251 3 24.0001 3H4.50006C3.67506 3 3.00006 3.675 3.00006 4.5V25.5L9.00006 19.5H24.0001ZM22.5001 5.99999V16.5H9.00013H6.00013V5.99999H22.5001ZM28.5 9.00001H31.5C32.325 9.00001 33 9.67501 33 10.5V33L27 27H10.5C9.675 27 9 26.325 9 25.5V22.5H28.5V9.00001Z" fill="white" />
        </mask>
        <g mask="url(#mask0)">
          <rect width="36" height="36" fill="white" />
        </g>
      </ChatSVG>
    )
}

export const CloseIcon = ({visible}: {visible: boolean}) => {
  /* Close (X) Icon */
  return (
    <CloseSVG visible={visible} id="closeSvg" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59
          12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
      <path d="M0 0h24v24H0z" fill="none"></path>
    </CloseSVG>
  )
}
