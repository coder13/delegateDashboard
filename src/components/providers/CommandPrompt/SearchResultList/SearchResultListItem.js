import { ListItemButton, ListItemText } from '@mui/material';
import ActivityListItem from './ActivityListItem';
import CompetitionListItem from './CompetitionListItem';
import PersonListItem from './PersonListItem';

function SearchResultListItem({ selected, onClick, ...props }) {
  const contents = () => {
    switch (props.class) {
      case 'person':
        return (
          <PersonListItem {...props} />
        );
      case 'activity':
        return (
          <ActivityListItem {...props} />
        );
      case 'competition':
        return (
          <CompetitionListItem {...props} />
        );
      default:
        return (
          <ListItemText primary={props.primary} secondary={props.secondary} />
        );
    }
  }

  return (
    <ListItemButton dense selected={selected} onClick={onClick}>
      {contents()}
    </ListItemButton>
  );
}

export default SearchResultListItem;
