import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppSelector } from '../../../store';
import Room from './Room';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

const Venue = ({ venue }) => {
  return (
    <Grid key={venue.id} item component={Paper} elevation={4} sx={{ width: '100%', p: 2 }}>
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

const Rooms = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const wcif = useAppSelector((state) => state.wcif);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Rooms',
      },
    ]);
  }, [setBreadcrumbs]);

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
