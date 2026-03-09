import { activityDurationString } from '../../../lib/domain/activities';
import { type ValidationError } from '../../../lib/wcif/validation';
import { useAppDispatch } from '../../../store';
import { bulkRemovePersonAssignments } from '../../../store/actions';
import DeleteIcon from '@mui/icons-material/Delete';
import { Divider, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { type Activity } from '@wca/helpers';

export interface ValidationErrorRendererProps {
  error: ValidationError;
}

export const ValidationErrorRenderer = ({ error }: ValidationErrorRendererProps) => {
  const dispatch = useAppDispatch();

  const removeAssignment = ({
    assignmentCode,
    activity,
  }: {
    assignmentCode: string;
    activity: Activity;
  }) => {
    dispatch(
      bulkRemovePersonAssignments([
        {
          registrantId: error.data.person?.registrantId,
          activityId: activity.id,
          assignmentCode,
        },
      ])
    );
  };

  return (
    <>
      {error.data?.conflictingAssignments?.map(({ id, assignmentA, assignmentB }) => {
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
                  secondary={`${assignmentA.room?.name}: ${
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
                  secondary={`${assignmentB.room?.name}: ${
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
};
