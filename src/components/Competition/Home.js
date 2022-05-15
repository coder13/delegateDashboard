import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '../shared/MaterialLink';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';

const CompetitionHome = () => {
  const wcif = useSelector((state) => state.wcif);
  const { setBreadcrumbs } = useBreadcrumbs();
  const approvedRegistrations = wcif.persons.filter((person) => person.registration.status === 'accepted');

  useEffect(() => {
    setBreadcrumbs([])
  }, [setBreadcrumbs]);


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