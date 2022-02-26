import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Link from '../shared/MaterialLink';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'Column',
    flex: 1,
    width: '100%',
  },
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const CompetitionHome = () => {
  const wcif = useSelector((state) => state.wcif);
  const classes = useStyles();
  const approvedRegistrations = wcif.persons.filter((person) => person.registration.status === 'accepted');

  const { path } = useRouteMatch();

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <Typography variant="h3" paragraph>{wcif.name}</Typography>
      <Typography paragraph>Competitors: {approvedRegistrations.length} / {wcif.competitorLimit}</Typography>
      <Typography paragraph>StartDate: {wcif.schedule.startDate}</Typography>
      <Typography paragraph>Events: {wcif.events.map((event) => event.id).join(', ')}</Typography>
      <Link to={`${path}/roles`}>Configure Roles</Link>
      <Link to={`${path}/rooms`}>Configure Rooms</Link>
      <Link to={`${path}/events`}>Configure Groups</Link>
      <Typography variant="h3" paragraph>Summary</Typography>
      <Typography variant="h4" paragraph>Venues</Typography>
      {wcif.schedule.venues.map((venue) => (
        <Box key={venue.id}>
          <Typography>{venue.name}</Typography>
          <Typography variant="h5">Rooms</Typography>
          {venue.rooms.map((room) => (
            <Box key={room.id}>
              {room.name}
            </Box>
          ))}
        </Box>
      ))}
    </Grid>
  );
};

export default CompetitionHome;