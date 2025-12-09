import { type SearchResultItem } from '../types';
import ActivityListItem from './ActivityListItem';
import CompetitionListItem from './CompetitionListItem';
import PersonListItem from './PersonListItem';
import { ListItemButton } from '@mui/material';
import { useEffect, useRef } from 'react';

type SearchResultListItemProps = {
  selected: boolean;
  onClick: () => void;
  class: 'person' | 'activity' | 'competition';
} & SearchResultItem;

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
        return <PersonListItem name={props.name} wcaId={props.wcaId} avatar={props.avatar} />;
      case 'activity':
        return <ActivityListItem name={props.name} activityCode={props.activityCode} />;
      case 'competition':
        return (
          <CompetitionListItem
            name={props.name}
            start_date={props.start_date}
            country_iso2={props.country_iso2}
          />
        );
    }
  };

  return (
    <ListItemButton dense selected={selected} onClick={onClick} ref={ref}>
      {contents()}
    </ListItemButton>
  );
}

export default SearchResultListItem;
