import {Divider, ListItemContainer, SubTitle, Title} from "../Styles";
import {ListItemProps, ListProps} from "../utilities/types";
import {addAgentMessage} from "../utilities/utils";

const ListItem = (props: ListItemProps) => {
  const {item} = props

  return (
    <ListItemContainer onClick={() => addAgentMessage(props)}>
      <Title>{item.title}</Title>
      <SubTitle>{item.subtitle}</SubTitle>
    </ListItemContainer>
  )
}

export const List = (props: ListProps) => {
  const {list} = props

  return (
    <div>
      {list.items.map(item => {
        if (item === 'DIVIDER') {
          return <Divider />
        } else {
          return <ListItem {...props} item={item} />
        }
      })}
    </div>
  )
}
