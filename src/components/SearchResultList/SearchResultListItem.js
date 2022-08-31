import { useEffect, useRef } from 'react';
import { ListItemButton, ListItemText } from '@mui/material';
import ActivityListItem from './ActivityListItem';
import CompetitionListItem from './CompetitionListItem';
import PersonListItem from './PersonListItem';

function SearchResultListItem({ selected, onClick, ...props }) {
  const ref = useRef();

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected]);

  const contents = () => {
    switch (props.class) {
      case 'person':
        return <PersonListItem {...props} />;
      case 'activity':
        return <ActivityListItem {...props} />;
      case 'competition':
        return <CompetitionListItem {...props} />;
      default:
        return <ListItemText primary={props.primary} secondary={props.secondary} />;
    }
  };

  return (
    <ListItemButton dense selected={selected} onClick={onClick} ref={ref}>
      {contents()}
    </ListItemButton>
  );
}

export default SearchResultListItem;
