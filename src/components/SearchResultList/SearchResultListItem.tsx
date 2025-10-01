import { useEffect, useRef } from 'react';
import { ListItemButton, ListItemText } from '@mui/material';
import ActivityListItem from './ActivityListItem';
import CompetitionListItem from './CompetitionListItem';
import PersonListItem from './PersonListItem';

interface SearchResultListItemProps {
  selected: boolean;
  onClick: () => void;
  class?: string;
  [key: string]: any;
}

function SearchResultListItem({ selected, onClick, ...props }: SearchResultListItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected]);

  const contents = () => {
    switch (props.class) {
      case 'person':
        return <PersonListItem {...(props as any)} />;
      case 'activity':
        return <ActivityListItem {...(props as any)} />;
      case 'competition':
        return <CompetitionListItem {...(props as any)} />;
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
