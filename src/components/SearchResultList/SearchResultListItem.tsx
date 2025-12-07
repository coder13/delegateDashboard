import ActivityListItem from './ActivityListItem';
import CompetitionListItem from './CompetitionListItem';
import PersonListItem from './PersonListItem';
import { ListItemButton, ListItemText } from '@mui/material';
import { useEffect, useRef } from 'react';

interface SearchResultListItemProps {
  selected: boolean;
  onClick: () => void;
  class: 'person' | 'activity' | 'competition';
  primary?: string;
  secondary?: string;
  [key: string]: unknown;
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
        return (
          <PersonListItem
            name={(props as any).name}
            wcaId={(props as any).wcaId}
            avatar={(props as any).avatar}
          />
        );
      case 'activity':
        return (
          <ActivityListItem name={(props as any).name} activityCode={(props as any).activityCode} />
        );
      case 'competition':
        return (
          <CompetitionListItem
            name={(props as any).name}
            start_date={(props as any).start_date}
            country_iso2={(props as any).country_iso2}
          />
        );
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
