import { format, parseISO } from 'date-fns';
import React from 'react';
import FlagIconFactory from 'react-flag-icon-css';
import ReactLoading from 'react-loading';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PublicIcon from '@mui/icons-material/Public';
import { ListItemButton } from '@mui/material';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';

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

const FlagIcon = FlagIconFactory(React, { useCssModules: false });

const CompetitionLink = ({ comp }) => (
  <ListItemButton component={Link} to={`/competitions/${comp.id}`}>
    <ListItemIcon>
      {!comp.country_iso2 || RegExp('(x|X)', 'g').test(comp.country_iso2.toLowerCase()) ? (
        <PublicIcon />
      ) : (
        <FlagIcon code={comp.country_iso2.toLowerCase()} size="lg" />
      )}
    </ListItemIcon>
    <ListItemText primary={comp.name} secondary={formatDateRange(comp.start_date, comp.end_date)} />
  </ListItemButton>
);

const CompetitionList = () => {
  const competitions = useSelector((state) => state.competitions);
  const loadingComps = useSelector((state) => state.fetchingCompetitions);
  const error = useSelector((state) => state.fetchingCompetitionsError);
  const upcomingCompetitions = competitions.filter(
    (comp) => comp.end_date >= new Date().toISOString().split('T')[0]
  );
  const pastCompetitions = competitions.filter(
    (comp) => comp.end_date < new Date().toISOString().split('T')[0]
  );

  if (error) {
    return (
      <Container
        maxWidth="sm"
        style={{
          display: 'flex',
          flexDirection: 'col',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {error.message}
      </Container>
    );
  }

  if (loadingComps) {
    return (
      <Container
        maxWidth="sm"
        style={{
          display: 'flex',
          flexDirection: 'col',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ReactLoading type="cubes" color="#000000" />
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4">My Competitions</Typography>

      <List>
        <ListSubheader inset disableSticky color="primary">
          Upcoming Competitions
        </ListSubheader>

        {upcomingCompetitions.reverse().map((comp) => (
          <CompetitionLink key={comp.id} comp={comp} />
        ))}

        <Divider />

        <ListSubheader inset disableSticky color="primary">
          Past Competitions
        </ListSubheader>

        {pastCompetitions.map((comp) => (
          <CompetitionLink key={comp.id} comp={comp} />
        ))}
      </List>
    </Container>
  );
};

export default CompetitionList;
