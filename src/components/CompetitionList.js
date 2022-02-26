import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import PublicIcon from '@mui/icons-material/Public';
import FlagIconFactory from 'react-flag-icon-css';
import { 
  getUpcomingManageableCompetitions,
  getPastManageableCompetitions,
} from '../lib/wcaAPI.js'
import { sortBy } from '../lib/utils';

const FlagIcon = FlagIconFactory(React, { useCssModules: false });

const CompetitionLink = ({ comp, ...props }) => (
  <ListItem button component={Link} to={`/competitions/${comp.id}`}>
    <ListItemIcon>
      {RegExp('(x|X)', 'g').test(comp.country_iso2.toLowerCase()) ?
        <PublicIcon/> :
        <FlagIcon code={comp.country_iso2.toLowerCase()} size="lg"/>
      }
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
)

const CompetitionList = () => {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [pastCompetitions, setPastCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUpcomingManageableCompetitions()
      .then(competitions => {
        setUpcomingCompetitions(
          sortBy(competitions, competition => competition['start_date'])
        );
      })
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));

      getPastManageableCompetitions()
        .then(competitions => {
          setPastCompetitions(
            sortBy(competitions, competition => -competition['start_date'])
          );
        })
        .catch(error => setError(error.message))
        .finally(() => setLoading(false));
  }, []);

  return (
    <Container>
      <Typography>My Competitions</Typography>

      <List>
        <ListSubheader inset disableSticky color="primary">Upcoming Competitions</ListSubheader>

        {upcomingCompetitions.map((comp) =>
          <CompetitionLink key={comp.id} comp={comp}/>
        )}

        <Divider/>

        <ListSubheader inset disableSticky color="primary">Past Competitions</ListSubheader>

        {pastCompetitions.map((comp) => 
          <CompetitionLink key={comp.id} comp={comp}/>
        )}
      </List>
    </Container>
  );
};

export default CompetitionList;
