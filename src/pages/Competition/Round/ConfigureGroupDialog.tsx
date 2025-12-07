import { generateNextChildActivityId, parseActivityCode } from '../../../lib/domain/activities';
import { useAppSelector } from '../../../store';
import { editActivity } from '../../../store/actions';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material';
import { activityCodeToName } from '@wca/helpers';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

const ConfigureGroupDialog = ({ open, onClose, activity }: any) => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const { eventId, roundNumber, ...rest } = parseActivityCode(activity.activityCode) as {
    eventId: string;
    roundNumber: number;
    groupNumber: number;
  };

  const [id, setId] = useState<number>(activity.id);
  const [name, setName] = useState(activity.name);
  const [groupNumber, setGroupNumber] = useState<number | undefined>(rest.groupNumber);
  const newActivityCode = `${eventId}-r${roundNumber}-g${groupNumber}`;

  useEffect(() => {
    if (groupNumber && !isNaN(groupNumber) && groupNumber > 0) {
      setName(activityCodeToName(newActivityCode));
    }
  }, [setName, groupNumber]);

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
          ...(id !== activity.id
            ? {
                id,
              }
            : null),
          ...(newActivityCode !== activity.activityCode
            ? {
                activityCode: newActivityCode,
              }
            : null),
          ...(name !== activity.name
            ? {
                name: name,
              }
            : null),
        }
      )
    );

    onClose();
  };

  const resetIdToMax = () => {
    if (!wcif) {
      return;
    }

    const maxId = generateNextChildActivityId(wcif);
    setId(maxId);
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
          {"You likely shouldn't be using this dialog unless you know what you're doing."}
        </Typography>
        <br />
        <FormGroup>
          <Box sx={{ display: 'flex' }}>
            <TextField
              id="activityId"
              margin="dense"
              label="id"
              type="number"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              value={id}
              onChange={(e) => setId(parseInt(e.target.value, 10))}
              fullWidth
            />
            <Button onClick={resetIdToMax}>Set to Max</Button>
          </Box>
          <TextField
            id="groupNumber"
            margin="dense"
            label="groupNumber"
            type="number"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            value={groupNumber ?? ''}
            onChange={(e) => {
              setGroupNumber(e.target.value ? parseInt(e.target.value, 10) : undefined);
            }}
          />
          <TextField
            id="activityName"
            margin="dense"
            label="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
