import { ListItemIcon, ListItemText } from '@mui/material';
import { parseActivityCode } from '../../lib/activities';

interface ActivityListItemProps {
  name: string;
  activityCode: string;
}

function ActivityListItem({ name, activityCode }: ActivityListItemProps) {
  const { eventId } = parseActivityCode(activityCode);

  return (
    <>
      <ListItemIcon>
        <span className={`cubing-icon event-${eventId}`} />
      </ListItemIcon>
      <ListItemText primary={name} secondary={activityCode} />
    </>
  );
}

export default ActivityListItem;
