import { activityDuration } from '../../../lib/domain/activities';
import { getExtensionData } from '../../../lib/wcif/extensions/wcif-extensions';
import { createGroupsAcrossStages } from '../../../lib/wcif/groups';
import { useAppSelector } from '../../../store';
import { updateRoundActivities, updateRoundExtensionData } from '../../../store/actions';
import { selectPersonsShouldBeInRound } from '../../../store/selectors';
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
import { type Activity, type Round } from '@wca/helpers';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

export interface ConfigureGroupCountsDialogProps {
  open: boolean;
  onClose: () => void;
  activityCode: string;
  round: Round;
  roundActivities: Activity[];
}

const ConfigureGroupCountsDialog = ({
  open,
  onClose,
  activityCode,
  round,
  roundActivities,
}: ConfigureGroupCountsDialogProps) => {
  const wcif = useAppSelector((state) => state.wcif);
  const rooms = useAppSelector((state) =>
    state.wcif?.schedule.venues
      .flatMap((v) => v.rooms)
      .filter((room) => room.activities.find((a) => a.activityCode === activityCode))
  );
  const dispatch = useDispatch();
  const [groupsData, setGroupsData] = useState<{
    groups: number | Record<number, number>;
    spreadGroupsAcrossAllStages?: boolean;
  } | null>(getExtensionData('groups', round) as any);
  const spreadGroupsAcrossAllStages = groupsData?.spreadGroupsAcrossAllStages ?? true;
  const actualCompetitors = useAppSelector((state) => selectPersonsShouldBeInRound(state)(round));

  if (!open) {
    return '';
  }

  const { groups: groupCount = 0 } = groupsData || {};
  const multipleStages = roundActivities.length > 1;

  const reset = () => {
    if (round) {
      const data = getExtensionData('groups', round) as {
        groups: number | Record<number, number>;
        spreadGroupsAcrossAllStages?: boolean;
      } | null;
      setGroupsData(data);
    }
  };

  const onSave = () => {
    if (!groupCount || !groupsData) {
      return;
    }

    dispatch(updateRoundExtensionData(round.id, groupsData as Record<string, unknown>));

    const newRoundActivities = createGroupsAcrossStages(
      wcif!,
      roundActivities,
      groupsData as {
        spreadGroupsAcrossAllStages: boolean;
        groups: number | Record<number, number>;
      }
    );
    dispatch(updateRoundActivities(newRoundActivities));

    reset();
    onClose();
  };

  const handleGroupsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGroupCount = parseInt(e.currentTarget.value);

    if (newGroupCount && newGroupCount > 0) {
      setGroupsData({
        ...groupsData,
        groups: +e.currentTarget.value,
      });
    }
  };

  const handleGroupsChangeMultipleRooms = (e: React.ChangeEvent<HTMLInputElement>, room: any) => {
    setGroupsData({
      ...groupsData,
      groups: {
        ...(typeof groupsData?.groups === 'object' ? groupsData.groups : {}),
        [room.id]: +e.target.value,
      },
    });
  };

  const roundSize = actualCompetitors.length;
  const activityMinutes = roundActivities[0] ? activityDuration(roundActivities[0]) / 60000 : 0;

  const groupCountNumber = typeof groupCount === 'number' ? groupCount : 0;

  const cumulativeGroupCount = groupsData?.spreadGroupsAcrossAllStages
    ? groupCountNumber
    : typeof groupCount === 'object'
    ? Object.keys(groupCount).reduce(
        (acc, key) => acc + (groupCount as Record<string, number>)[key],
        0
      )
    : 0;

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
                            ...(rooms?.reduce((acc, room) => {
                              acc[room.id] = 1;
                              return acc;
                            }, {} as Record<number, number>) || {}),
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
                  type="number"
                  value={groupCount || 1}
                  onChange={handleGroupsChange}
                />
                <FormHelperText id="my-helper-text">
                  These groups will be spread across all stages.
                </FormHelperText>
              </FormControl>
              <Typography>
                There will be max group sizes of {Math.ceil(roundSize / (groupCountNumber || 1))} (
                {multipleStages && (
                  <>
                    {Math.ceil(roundSize / roundActivities.length / (groupCountNumber || 1))} per
                    stage)
                  </>
                )}
              </Typography>
              <Typography>
                There will be an average group duration of{' '}
                {Math.round(activityMinutes / (groupCountNumber || 1))} Minutes
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
                  const roundDuration = roomActivity ? activityDuration(roomActivity) / 60000 : 0;

                  return (
                    <Box key={room.id}>
                      <FormControl sx={{ my: 1 }}>
                        <InputLabel htmlFor={`groups-${room.id}-label`}>{room.name}</InputLabel>
                        <Input
                          id={`groups-${room.id}-input`}
                          type="number"
                          value={
                            typeof groupCount === 'object'
                              ? (groupCount as Record<number, number>)[room.id] ?? 1
                              : 1
                          }
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                          ) =>
                            handleGroupsChangeMultipleRooms(
                              e as React.ChangeEvent<HTMLInputElement>,
                              room
                            )
                          }
                        />
                        <FormHelperText id="my-helper-text">
                          {room.name} would have an average duration of{' '}
                          {Math.round(
                            roundDuration /
                              (typeof groupCount === 'object'
                                ? (groupCount as Record<number, number>)[room.id] ?? 1
                                : 1)
                          )}
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
