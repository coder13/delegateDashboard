import { Activity, activityCodeToName } from '@wca/helpers';
import { Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { Delete } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { formatTimeRange } from '../../../lib/time';
import { useAppSelector } from '../../../store';
import { updateRoundChildActivities } from '../../../store/actions';

export const ConfigurableGroupList = ({
  roundActivity,
  groups,
}: {
  roundActivity: Activity;
  groups: Activity[];
}) => {
  const dispatch = useDispatch();
  const handleDeleteGroup = (activity: Activity) => {
    console.log('delete', activity);
    const filteredGroups = groups.filter((g) => g.id !== activity.id);
    const numberOfGroups = filteredGroups.length;
    const startDate = new Date(roundActivity.startTime);
    const endDate = new Date(roundActivity.endTime);
    const dateDiff = endDate.getTime() - startDate.getTime();

    const newGroups = filteredGroups.map((g, i) => ({
      ...g,
      startTime: new Date(startDate.getTime() + (dateDiff / numberOfGroups) * i),
      endTime: new Date(startDate.getTime() + (dateDiff / numberOfGroups) * (i + 1)),
    }));

    dispatch(updateRoundChildActivities(roundActivity.id, newGroups));
  };

  return (
    <List>
      {groups.map((activity) => (
        <ListItem
          key={activity.id}
          secondaryAction={
            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteGroup(activity)}>
              <Delete />
            </IconButton>
          }>
          <ListItemText
            primary={activityCodeToName(activity.activityCode)}
            secondary={formatTimeRange(activity.startTime, activity.endTime)}
          />
        </ListItem>
      ))}
    </List>
  );
};

export const ConfigureGroupsDialog = ({ open, onClose, activityCode }) => {
  const wcif = useAppSelector((state) => state.wcif);

  // Rooms that have this activity
  const rooms = wcif?.schedule?.venues
    .flatMap((venue) => venue.rooms)
    ?.filter((room) => room.activities.some((ra) => ra.activityCode === activityCode));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <span>Configuring groups for {activityCodeToName(activityCode)}</span>
      </DialogTitle>
      <DialogContent
        style={{
          padding: '1em',
        }}>
        <br />
        <Grid container direction="row" spacing={1}>
          {rooms?.map((room) => (
            <Grid key={room.id} item xs={12 / rooms.length} direction="column" sx={{}}>
              <Typography variant="h5">{room.name}</Typography>
              {room.activities
                .filter((ra) => ra.activityCode === activityCode)
                .map((ra) => (
                  <Fragment key={ra.id}>
                    <Typography variant="h6">{ra.name}</Typography>
                    <ConfigurableGroupList
                      roundActivity={ra}
                      groups={
                        room.activities.find((ra) => ra.activityCode === activityCode)
                          ?.childActivities || []
                      }
                    />
                  </Fragment>
                ))}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
