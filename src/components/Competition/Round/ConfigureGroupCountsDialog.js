import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
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
  Typography,
} from '@mui/material';
import { parseActivityCode } from '../../../lib/activities';
import { advancingCompetitors } from '../../../lib/formulas';
import { createGroupsAcrossStages } from '../../../lib/groups';
import { personsRegistered } from '../../../lib/persons';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { updateRoundActivities, updateRoundExtensionData } from '../../../store/actions';

const ConfigureGroupCountsDialog = ({ open, onClose, activityCode, round, roundActivities }) => {
  const wcif = useSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const [groupsData, setGroupsData] = useState(getExtensionData('groups', round));

  if (!open) {
    return '';
  }

  const { spreadGroupsAcrossAllStages, groups: groupCount } = groupsData;
  const multipleStages = roundActivities.length > 1;

  const reset = () => {
    if (round) {
      setGroupsData(getExtensionData('groups', round));
    }
  };

  const onSave = () => {
    if (!groupCount) {
      return;
    }

    if (spreadGroupsAcrossAllStages) {
      dispatch(updateRoundExtensionData(round.id, groupsData));
    }

    dispatch(updateRoundActivities(createGroupsAcrossStages(wcif, roundActivities, groupCount)));

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

  const { eventId, roundNumber } = parseActivityCode(round.id);
  const registeredPersonsForEvent = personsRegistered(wcif.persons, eventId);

  const event = wcif.events.find((i) => i.id === eventId);
  const previousRound = roundNumber > 1 ? event.rounds[roundNumber - 2] : null;
  const advancementCondition = previousRound?.advancementCondition;

  const estimatedCompetitors =
    roundNumber === 1
      ? registeredPersonsForEvent
      : advancingCompetitors(
          advancementCondition,
          previousRound.results.length || registeredPersonsForEvent
        );
  const actualCompetitors = round.results.length;

  const roundSize = actualCompetitors || estimatedCompetitors;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl">
      <DialogTitle>Configuring Group Counts For {activityCode}</DialogTitle>
      <DialogContent>
        <FormGroup>
          {multipleStages && (
            <FormControlLabel
              control={<Checkbox checked={spreadGroupsAcrossAllStages} />}
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
                  variant="outlined"
                  value={groupCount || 1}
                  onChange={handleGroupsChange}
                />
                <FormHelperText id="my-helper-text">
                  These groups will be spread across all stages.
                </FormHelperText>
              </FormControl>
              <Typography>
                There will be max group sizes of {Math.ceil(roundSize / (groupCount || 1))}
              </Typography>
              {multipleStages && (
                <Typography>
                  There will be max group sizes of {Math.ceil(roundSize / 2 / (groupCount || 1))}{' '}
                  per stage
                </Typography>
              )}
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
