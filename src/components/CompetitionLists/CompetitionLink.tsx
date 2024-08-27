import PublicIcon from '@mui/icons-material/Public';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

export interface APICompetition {
  id: string;
  name: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
}

// https://github.com/thewca/wca-live/blob/8884f8dc5bb2efcc3874f9fff4f6f3c098efbd6a/client/src/lib/date.js#L10
const formatDateRange = (startString, endString) => {
  const [startDay, startMonth, startYear] = format(parseISO(startString), 'd MMM yyyy').split(' ');
  const [endDay, endMonth, endYear] = format(parseISO(endString), 'd MMM yyyy').split(' ');
  if (startString === endString) {
    return `${startMonth} ${startDay}, ${startYear}`;
  }
  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
  }
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
};

export const CompetitionLink = ({ comp }) => (
  <ListItemButton component={Link} to={`/competitions/${comp.id}`}>
    <ListItemIcon>
      {!comp.country_iso2 || RegExp('(x|X)', 'g').test(comp.country_iso2.toLowerCase()) ? (
        <PublicIcon />
      ) : (
        <div />
        // <FlagIcon code={comp.country_iso2.toLowerCase()} size="lg" />
      )}
    </ListItemIcon>
    <ListItemText primary={comp.name} secondary={formatDateRange(comp.start_date, comp.end_date)} />
  </ListItemButton>
);
