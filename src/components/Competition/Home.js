import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
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

  const { path } = useLocation();

  return (
    <Box display="flex" flexDirection="column">
      <Typography variant="h3" paragraph>{wcif.name}</Typography>
      <Typography paragraph>Competitors: {approvedRegistrations.length} / {wcif.competitorLimit}</Typography>
      <Typography paragraph>StartDate: {wcif.schedule.startDate}</Typography>
      <Typography paragraph>Events: {wcif.events.map((event) => event.id).join(', ')}</Typography>
      <Link to="roles">Configure Roles</Link>
      <Link to="rooms">Configure Rooms</Link>
      <Link to="events">Configure Groups</Link>
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
    </Box>
  );
};

export default CompetitionHome;