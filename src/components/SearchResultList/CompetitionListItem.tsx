import PublicIcon from '@mui/icons-material/Public';
// import FlagIconFactory from 'react-flag-icon-css';
import { ListItemIcon, ListItemText } from '@mui/material';

// const FlagIcon = FlagIconFactory(React, { useCssModules: false });

interface CompetitionListItemProps {
  name: string;
  start_date: string;
  country_iso2?: string;
}

function CompetitionListItem({ name, start_date, country_iso2 }: CompetitionListItemProps) {
  return (
    <>
      <ListItemIcon>
        {!country_iso2 || RegExp('(x|X)', 'g').test(country_iso2.toLowerCase()) ? (
          <PublicIcon />
        ) : (
          <div />
          // <FlagIcon code={country_iso2.toLowerCase()} size="lg" />
        )}
      </ListItemIcon>
      <ListItemText
        primary={name}
        secondary={new Date(start_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      />
    </>
  );
}

export default CompetitionListItem;
