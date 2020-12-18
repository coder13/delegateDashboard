import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
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

const Rooms = ({ wcif }) => {
  const classes = useStyles();
  console.log(wcif);

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <Typography variant="h3">Rooms</Typography>
      <Typography variant="subtitle1" paragraph>Configure number of judging stations and stages</Typography>
      {wcif.schedule.venues.map((venue) => <Venue key={venue.id} venue={venue}/>)}
    </Grid>
  );
};

const mapStateToProps = (state) => ({
  wcif: state.wcif,
});

export default connect(mapStateToProps)(Rooms);
