import {Divider, ListItemContainer, SubTitle, Title} from "../Styles";
import {List as ListType, ListItem as ListItemType} from "../utilities/types";

const ListItem = ({item}: {item: ListItemType}) => {
  return (
    <ListItemContainer>
      <Title>{item.title}</Title>
      <SubTitle>{item.subtitle}</SubTitle>
    </ListItemContainer>
  )
}

export const List = ({list}: {list: ListType}) => {

  return (
    <div>
      {list.items.map(item => {
        if (item === 'DIVIDER') {
          return <Divider />
        } else {
          return <ListItem item={item} />
        }
      })}
    </div>
  )
}
