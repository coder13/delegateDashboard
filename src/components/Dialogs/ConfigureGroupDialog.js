import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material';
import { parseActivityCode } from '../../lib/activities';
import { editActivity } from '../../store/actions';

const ConfigureGroupDialog = ({ open, onClose, activity }) => {
  const dispatch = useDispatch();

  const [id, setId] = useState(activity.id);
  const [name, setName] = useState(activity.name);
  const [groupNumber] = useState(parseActivityCode(activity.activityCode).groupNumber);

  const handleSave = () => {
    if (!id) {
      return;
    }

    dispatch(
      editActivity(
        {
          id: activity.id,
          activityCode: activity.activityCode,
          name: activity.name,
        },
        {
          id: parseInt(id, 10),
        }
      )
    );

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <span>Configuring {activity.activityCode}</span>
      </DialogTitle>
      <DialogContent
        style={{
          padding: '1em',
        }}>
        <Typography>
          You likely shouldn't be using this dialog unless you know what you're doing.
        </Typography>
        <br />
        <FormGroup>
          <TextField margin="dense" label="id" value={id} onChange={(e) => setId(e.target.value)} />
          <TextField
            margin="dense"
            label="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="groupNumber"
            value={groupNumber}
            onChange={(e) => setId(e.target.value)}
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureGroupDialog;
