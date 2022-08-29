import { ListItemButton, ListItemText } from '@mui/material';

function PersonListItem({ name, wcaId, selected }) {
  return (
    <ListItemButton dense selected={selected}>
      <ListItemText primary={name} secondary={wcaId} />
    </ListItemButton>
  );
}

export default PersonListItem;
