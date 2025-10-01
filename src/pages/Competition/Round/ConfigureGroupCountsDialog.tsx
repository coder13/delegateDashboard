import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../store/initialState';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Input,
  InputLabel,
  Stack,
  Typography,
} from '@mui/material';
import { activityDuration } from '../../../lib/activities';
import { createGroupsAcrossStages } from '../../../lib/groups';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { updateRoundActivities, updateRoundExtensionData } from '../../../store/actions';
import { selectPersonsShouldBeInRound } from '../../../store/selectors';

const ConfigureGroupCountsDialog = ({ open, onClose, activityCode, round, roundActivities }: any) => {
  const wcif = useSelector((state: AppState) => (state.wcif as any));

  if (!wcif) return null;
  const rooms = useSelector((state: AppState) =>
    (state.wcif as any).schedule.venues
      .flatMap((v) => v.rooms)
      .filter((room) => room.activities.find((a) => a.activityCode === activityCode))
  );
  const dispatch = useDispatch();
  const [groupsData, setGroupsData] = useState(getExtensionData('groups', round));
  const spreadGroupsAcrossAllStages = groupsData?.spreadGroupsAcrossAllStages ?? true;
  const actualCompetitors = useSelector((state: AppState) => selectPersonsShouldBeInRound(state)(round));

  if (!open) {
    return null;
  }

  const { groups: groupCount } = groupsData;
  const multipleStages = roundActivities.length > 1;

  console.log(37, groupsData);

  const reset = (props?: any) => {
    if (round) {
      setGroupsData(getExtensionData('groups', round));
    }
  };

  const onSave = (props?: any) => {
    if (!groupCount) {
      return;
    }

    dispatch(updateRoundExtensionData(round.id, groupsData));

    const newRoundActivities = createGroupsAcrossStages(wcif, roundActivities, groupsData);
    console.log(newRoundActivities);
    dispatch(updateRoundActivities(newRoundActivities));

    reset();
    onClose();
  };

  const handleGroupsChange = (e) => {
    const newGroupCount = parseInt(e.currentTarget.value);

    if (newGroupCount && newGroupCount > 0) {
      setGroupsData({
        ...groupsData,
        groups: +e.currentTarget.value,
      });
    }
  };

  const handleGroupsChangeMultipleRooms = (e, room) => {
    console.log(e.target.value, room);
    setGroupsData({
      ...groupsData,
      groups: {
        ...groupsData.groups,
        [room.id]: +e.target.value,
      },
    });
  };

  const roundSize = actualCompetitors.length;
  const activityMinutes = activityDuration(roundActivities[0]) / 60000;

  const cumulativeGroupCount = groupsData?.spreadGroupsAcrossAllStages
    ? groupCount
    : Object.keys(groupCount).reduce((acc, key) => acc + groupCount[key], 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl">
      <DialogTitle>Configuring Group Counts For {activityCode}</DialogTitle>
      <DialogContent>
        <FormGroup>
          {multipleStages && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={spreadGroupsAcrossAllStages}
                  onChange={(e) =>
                    setGroupsData({
                      ...groupsData,
                      spreadGroupsAcrossAllStages: e.target.checked,
                      groups: e.target.checked
                        ? 1
                        : {
                            ...rooms.reduce((acc, room) => {
                              acc[room.id] = 1;
                              return acc;
                            }, {}),
                          },
                    })
                  }
                />
              }
              label="Spread Groups Across All Stages"
            />
          )}
          <br />
          {spreadGroupsAcrossAllStages && (
            <>
              <FormControl>
                <InputLabel htmlFor="groups">Groups</InputLabel>
                <Input
                  id="groups"
                  label="Groups"
                  type="number"
                  variant={"outlined" as any}
                  value={groupCount || 1}
                  onChange={handleGroupsChange}
                />
                <FormHelperText id="my-helper-text">
                  These groups will be spread across all stages.
                </FormHelperText>
              </FormControl>
              <Typography>
                There will be max group sizes of {Math.ceil(roundSize / (groupCount || 1))} (
                {multipleStages && (
                  <>
                    {Math.ceil(roundSize / roundActivities.length / (groupCount || 1))} per stage)
                  </>
                )}
              </Typography>
              <Typography>
                There will be an average group duration of{' '}
                {Math.round(activityMinutes / (groupCount || 1))} Minutes
              </Typography>
            </>
          )}
          {!spreadGroupsAcrossAllStages && (
            <>
              <Alert severity="warning">
                This feature is experimental and may not work as expected.
                <br />
                Only make groups manually.
              </Alert>
              <br />
              <Stack spacing={2}>
                {rooms?.map((room) => {
                  const roomActivity = room.activities.find((a) => a.activityCode === activityCode);
                  const roundDuration = activityDuration(roomActivity as any) / 60000;

                  return (
                    <Box key={room.id}>
                      <FormControl sx={{ my: 1 }}>
                        <InputLabel htmlFor={`groups-${room.id}-label`}>{room.name}</InputLabel>
                        <Input
                          id={`groups-${room.id}-input`}
                          label={room.name}
                          type="number"
                          variant={"outlined" as any}
                          value={groupCount[room.id] ?? 1}
                          onChange={(e) => handleGroupsChangeMultipleRooms(e, room)}
                        />
                        <FormHelperText id="my-helper-text">
                          {room.name} would have an average duration of{' '}
                          {Math.round(roundDuration / (groupCount[room.id] ?? 1))}
                        </FormHelperText>
                      </FormControl>
                    </Box>
                  );
                })}
              </Stack>
              <Typography>With a combined total of {cumulativeGroupCount} groups:</Typography>
              <Typography>
                There will be max group sizes of{' '}
                {Math.ceil(roundSize / (cumulativeGroupCount || 1))} (
                {multipleStages && (
                  <>
                    {Math.ceil(roundSize / roundActivities.length / (cumulativeGroupCount || 1))}{' '}
                    per stage)
                  </>
                )}
              </Typography>
              <Typography>
                There will be an average group duration of{' '}
                {Math.round(activityMinutes / (cumulativeGroupCount || 1))} Minutes
              </Typography>
            </>
          )}
        </FormGroup>
      </DialogContent>
      <DialogActions style={{ display: 'flex' }}>
        <Button onClick={onSave} disabled={!groupCount}>
          Save And Create Groups
        </Button>
        <div style={{ flex: 1 }} />
        <Button
          color="error"
          onClick={() => {
            reset();
            onClose();
          }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureGroupCountsDialog;
