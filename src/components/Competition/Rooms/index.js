import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Room from './Room';

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
  }
}));

const Venue = ({ venue }) => {
  const classes = useStyles();

  return (
    <Grid
      key={venue.id}
      item
      component={Paper}
      className={classes.paper}
      elevation={4}
    >
      <Typography variant="h5" paragraph>{venue.name}</Typography>
      {venue.rooms.map((room) => <Room key={room.id} venue={venue} room={room}/>)}
    </Grid>
  )
};

const Rooms = () => {
  const classes = useStyles();
  const wcif = useSelector((state) => state.wcif);

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <Typography variant="h3">Rooms</Typography>
      <Typography variant="subtitle1" paragraph>Configure number of judging stations and stages</Typography>
      {wcif.schedule.venues.map((venue) => <Venue key={venue.id} venue={venue}/>)}
    </Grid>
  );
};

export default Rooms;
