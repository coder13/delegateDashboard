import { List, ListItemButton, ListSubheader } from '@mui/material';
import { ActivityWithRoom } from '../../lib/activities';

const StageListItem = ({ startTime, endTime, room }: ActivityWithRoom) => {
  const startDateTime = new Date(startTime);
  const endDateTime = new Date(endTime);
  const minutes = (endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60;

  return (
    <ListItemButton>
      {room.name}: {startDateTime.toLocaleDateString()} {startDateTime.toLocaleTimeString()} -{' '}
      {endDateTime.toLocaleTimeString()} ({minutes} Minutes)
    </ListItemButton>
  );
};

interface StageListProps {
  roundActivities: ActivityWithRoom[];
}

const subheader = <ListSubheader id="stages">Stages</ListSubheader>;

export default function StageList({ roundActivities }: StageListProps) {
  return (
    <List dense subheader={subheader}>
      {roundActivities.map(({ id, ...activity }) => (
        <StageListItem key={id} id={id} {...activity} />
      ))}
    </List>
  );
}
