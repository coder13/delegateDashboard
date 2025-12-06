import { activityDurationString } from '../../lib/domain/activities';
import { PERSON_ASSIGNMENT_SCHEDULE_CONFLICT } from '../../lib/wcif/wcif-validation';
import { bulkRemovePersonAssignments } from '../../store/actions';
import { WCIFError } from './types';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useDispatch } from 'react-redux';

const ErrorRenderers = {
  [PERSON_ASSIGNMENT_SCHEDULE_CONFLICT]: (error: WCIFError) => {
    const dispatch = useDispatch();
    console.log(17, error);

    const removeAssignment = ({ assignmentCode, activity }) => {
      dispatch(
        bulkRemovePersonAssignments([
          {
            registrantId: error.data.person.registrantId,
            activityId: activity.id,
            assignmentCode,
          },
        ])
      );
    };

    return (
      <>
        {error.data.conflictingAssignments.map(({ id, assignmentA, assignmentB }) => {
          return (
            <div key={id}>
              <List>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeAssignment(assignmentA)}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                  <ListItemText
                    primary={assignmentA.assignmentCode}
                    secondary={`${assignmentA.room.name}: ${
                      assignmentA.activity.name
                    } (${activityDurationString(assignmentA.activity)})`}
                  />
                </ListItem>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeAssignment(assignmentB)}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                  <ListItemText
                    primary={assignmentB.assignmentCode}
                    secondary={`${assignmentB.room.name}: ${
                      assignmentB.activity.name
                    } (${activityDurationString(assignmentB.activity)})`}
                  />
                </ListItem>
              </List>
              <Divider />
            </div>
          );
        })}
      </>
    );
  },
};

interface ErrorDialogProps {
  error?: WCIFError;
  onClose: () => void;
}

export function ErrorDialog({ error, onClose }: ErrorDialogProps) {
  return (
    <Dialog open={!!error} onClose={onClose}>
      <DialogTitle>{error?.message}</DialogTitle>
      <DialogContent>
        {error && ErrorRenderers[error.type] && ErrorRenderers[error.type](error)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
