import { parseActivityCode } from '../../lib/domain/activities';
import { ListItemIcon, ListItemText } from '@mui/material';

function ActivityListItem({ name, activityCode }) {
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
