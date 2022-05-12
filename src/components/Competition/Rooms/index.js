import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Room from './Room';
import { useParams } from 'react-router-dom';
import { Breadcrumbs } from '@mui/material';
import Link from '../../shared/MaterialLink';

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
      <Grid item>
        <Typography variant="h5" paragraph>{venue.name}</Typography>
        {venue.rooms.map((room) => <Room key={room.id} venue={venue} room={room}/>)}
      </Grid>
    </Grid>
  )
};

const Rooms = () => {
  const classes = useStyles();
  const wcif = useSelector((state) => state.wcif);
  const { competitionId } = useParams();

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <Grid item>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to={`/competitions/${competitionId}`}>
            {wcif.name || competitionId}
          </Link>
          <Typography color="textPrimary">Rooms</Typography>
        </Breadcrumbs>
      </Grid>
      <Grid item>
        <Typography variant="h3">Rooms</Typography>
        <Typography variant="subtitle1" paragraph>Configure number of judging stations and stages</Typography>
        {wcif.schedule.venues.map((venue) => <Venue key={venue.id} venue={venue}/>)}
      </Grid>
    </Grid>
  );
};

export default Rooms;
