import { Activity, activityCodeToName, parseActivityCode } from '@wca/helpers';
import { formatDuration } from 'date-fns';
import { Fragment, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Delete } from '@mui/icons-material';
import {
  Button,
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
import { createGroupActivity, findAllActivities } from '../../../lib/activities';
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
      {groups.map((activity) => {
        const duration =
          new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime();
        const minutes = duration / 1000 / 60;

        return (
          <ListItem
            key={activity.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteGroup(activity)}>
                <Delete />
              </IconButton>
            }>
            <ListItemText
              primary={activityCodeToName(activity.activityCode)}
              secondary={`${formatTimeRange(
                activity.startTime,
                activity.endTime
              )} (${formatDuration({ minutes })})`}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export const ConfigureGroupsDialog = ({ open, onClose, activityCode }) => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();

  // Rooms that have this activity
  const rooms = wcif?.schedule?.venues
    .flatMap((venue) => venue.rooms)
    ?.filter((room) => room.activities.some((ra) => ra.activityCode === activityCode));

  const addGroup = useCallback(
    (ra: Activity) => {
      const maxId = wcif
        ? findAllActivities(wcif).reduce((max, a) => Math.max(max, a.id), 0) + 1
        : -1;
      const groups = ra.childActivities.sort(
        (a, b) =>
          (parseActivityCode(a.activityCode).groupNumber ?? 0) -
          (parseActivityCode(b.activityCode).groupNumber ?? 0)
      );
      const lastGroup = parseActivityCode(groups[groups.length - 1].activityCode);
      const newGroupNumber = (lastGroup?.groupNumber ?? 0) + 1;
      const startDate = new Date(ra.startTime);
      const endDate = new Date(ra.endTime);
      const dateDiff = endDate.getTime() - startDate.getTime();

      const newGroups = [
        ...groups,
        createGroupActivity(maxId, ra, newGroupNumber, ra.startTime, ra.endTime),
      ].map((g, i, arr) => ({
        ...g,
        startTime: new Date(startDate.getTime() + (dateDiff / arr.length) * i).toISOString(),
        endTime: new Date(startDate.getTime() + (dateDiff / arr.length) * (i + 1)).toISOString(),
      }));

      dispatch(
        updateRoundChildActivities(
          ra.id,
          newGroups.sort((a, b) => a.startTime.localeCompare(b.startTime))
        )
      );
    },
    [dispatch, wcif]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <span>Configuring groups for {activityCodeToName(activityCode)}</span>
      </DialogTitle>
      <DialogContent>
        <br />
        <Grid container direction="row" spacing={1}>
          {rooms?.map((room) => (
            <Grid key={room.id} item xs={12 / rooms.length}>
              <Typography variant="h5">{room.name}</Typography>
              {room.activities
                .filter((ra) => ra.activityCode === activityCode)
                .map((ra) => (
                  <Fragment key={ra.id}>
                    <Typography variant="h6">{ra.name}</Typography>
                    <Typography variant="caption">
                      {formatTimeRange(ra.startTime, ra.endTime)}
                    </Typography>
                    <ConfigurableGroupList
                      roundActivity={ra}
                      groups={
                        room.activities.find((ra) => ra.activityCode === activityCode)
                          ?.childActivities || []
                      }
                    />
                    <Button fullWidth variant="outlined" onClick={() => addGroup(ra)}>
                      Add Group
                    </Button>
                    <Typography></Typography>
                  </Fragment>
                ))}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
