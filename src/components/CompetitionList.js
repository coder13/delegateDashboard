import React, { useState, useEffect } from 'react';
import FlagIconFactory from 'react-flag-icon-css';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import PublicIcon from '@mui/icons-material/Public';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { sortBy } from '../lib/utils';
import { getUpcomingManageableCompetitions, getPastManageableCompetitions } from '../lib/wcaAPI.js';
import { useAuth } from './providers/AuthProvider.js';

const FlagIcon = FlagIconFactory(React, { useCssModules: false });

const CompetitionLink = ({ comp, ...props }) => (
  <ListItem button component={Link} to={`/competitions/${comp.id}`}>
    <ListItemIcon>
      {RegExp('(x|X)', 'g').test(comp.country_iso2.toLowerCase()) ? (
        <PublicIcon />
      ) : (
        <FlagIcon code={comp.country_iso2.toLowerCase()} size="lg" />
      )}
    </ListItemIcon>
    <ListItemText
      primary={comp.name}
      secondary={new Date(comp.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    />
  </ListItem>
);

const CompetitionList = () => {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [pastCompetitions, setPastCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getUpcomingManageableCompetitions()
        .then((competitions) => {
          setUpcomingCompetitions(sortBy(competitions, (competition) => competition['start_date']));
        })
        .catch((error) => setError(error.message))
        .finally(() => setLoading(false));

      getPastManageableCompetitions()
        .then((competitions) => {
          setPastCompetitions(sortBy(competitions, (competition) => -competition['start_date']));
        })
        .catch((error) => setError(error))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (error) {
    return (
      <Container
        fluid
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

  if (loading) {
    return (
      <Container
        fluid
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

        {upcomingCompetitions.map((comp) => (
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
