import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { AppState } from '../../../store/initialState';
import Room from './Room';
import { Venue as VenueType } from '@wca/helpers';

const useStyles = makeStyles((theme: any) => ({
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
}));

interface VenueProps {
  venue: VenueType;
}

const Venue = ({ venue }: VenueProps) => {
  const classes = useStyles();

  return (
    <Grid key={venue.id} item component={Paper} className={classes.paper} elevation={4}>
      <Grid item>
        <Typography variant="h5" paragraph>
          {venue.name}
        </Typography>
        {venue.rooms.map((room) => (
          <Room key={room.id} venue={venue} room={room} />
        ))}
      </Grid>
    </Grid>
  );
};

const Rooms = (props?: any) => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const wcif = useSelector((state: AppState) => state.wcif);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Rooms',
      },
    ]);
  }, [setBreadcrumbs]);

  if (!wcif) return null;

  return (
    <>
      <Typography variant="h3">Rooms</Typography>
      <Typography variant="subtitle1" paragraph>
        Configure number of judging stations and stages
      </Typography>
      {wcif.schedule.venues.map((venue) => (
        <Venue key={venue.id} venue={venue} />
      ))}
    </>
  );
};

export default Rooms;
