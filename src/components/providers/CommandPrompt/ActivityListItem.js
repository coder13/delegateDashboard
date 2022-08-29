import { ListItemButton, ListItemText } from '@mui/material';

function ActivityListItem({ name, activityCode, selected }) {
  return (
    <ListItemButton dense selected={selected}>
      <ListItemText primary={name} secondary={activityCode} />
    </ListItemButton>
  );
}

export default ActivityListItem;
