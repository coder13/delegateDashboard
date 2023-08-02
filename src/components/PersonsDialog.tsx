import { Person } from '@wca/helpers';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
} from '@mui/material';

const PersonsDialog = ({
  open,
  onClose,
  persons,
  title,
}: {
  open: boolean;
  onClose: () => void;
  persons: Person[];
  title: string;
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <List dense>
          {persons.map((person) => (
            <ListItem button key={person.registrantId}>
              {person.name}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonsDialog;
