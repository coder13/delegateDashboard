import { Round } from '@wca/helpers';
import { useConfirm } from 'material-ui-confirm';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Card, CardActions, CardHeader, Divider, Typography } from '@mui/material';
import {
  activityCodeToName,
  findGroupActivitiesByRound,
  findRoundActivitiesById,
  parseActivityCode,
} from '../../lib/activities';
import { useAppSelector } from '../../store';
import {
  bulkRemovePersonAssignments,
  generateAssignments,
  updateRoundChildActivities,
} from '../../store/actions';
import { selectPersonsAssignedForRound, selectPersonsShouldBeInRound } from '../../store/selectors';
import ConfigureGroupCountsDialog from '../Dialogs/ConfigureGroupCountsDialog';
import ConfigureStationNumbersDialog from '../Dialogs/ConfigureStationNumbersDialog';
import GroupsGeneratorList from './GroupsGeneratorList';
import { PersonsTable } from './PersonsTable';
import StageList from './StageList';

export const RoundSummaryCard = ({ activityCode }) => {
  const { eventId } = parseActivityCode(activityCode);
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] = useState(false);
  const [configureStationNumbersDialog, setConfigureStationNumbersDialog] = useState(false);

  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode) as Round;
  const personsShouldBeInRound = useAppSelector(selectPersonsShouldBeInRound(round));

  const roundActivities = findRoundActivitiesById(wcif, activityCode);
  const groups = findGroupActivitiesByRound(wcif, activityCode);

  const personsAssigned = useAppSelector(selectPersonsAssignedForRound(round.id));

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned.filter((p) => p.assignments?.some((a) => a.assignmentCode === 'competitor')),
    [personsAssigned]
  );

  /**
   * Fills in assignment gaps. Everyone should end up having a competitor assignment and staff assignment
   * 1. Start with giving out competitor assignments.
   *   1a Start with assigning competitor assignments to people who are already assigned to staff
   *   1b Assign organizers and delegates their competing assignments, don't assign  staff assignments
   *   1c Then hand out competitor assignments to people who are not assigned to staff
   *
   * 2. Then give out judging assignments to competitors without staff assignments
   */
  const onGenerateGroupActitivites = () => {
    if (round) {
      dispatch(generateAssignments(round.id));
    }
  };

  const onResetGroupActitivites = () => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(
          bulkRemovePersonAssignments([
            ...groups.map((group) => ({
              activityId: group.id,
            })),
          ])
        );

        roundActivities.forEach((roundActivity) => {
          dispatch(updateRoundChildActivities(roundActivity.id, []));
        });
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const onResetGroupNonScramblingActitivites = () => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(
          bulkRemovePersonAssignments([
            ...groups.map((group) => ({
              activityId: group.id,
              assignmentCode: 'staff-judge',
            })),
            ...groups.map((group) => ({
              activityId: group.id,
              assignmentCode: 'competitor',
            })),
          ])
        );
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const actionButtons = () => {
    if (groups.length === 0) {
      return (
        <>
          <Button onClick={() => setConfigureGroupCountsDialog(true)}>
            Configure Group Counts
          </Button>
        </>
      );
    } else if (
      groups.length > 0 &&
      personsAssignedToCompete.length < personsShouldBeInRound.length
    ) {
      return (
        <>
          <Button onClick={onGenerateGroupActitivites}>
            Assign Competitor and Judging Assignments
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetGroupActitivites}>
            Reset Group Activities
          </Button>
        </>
      );
    } else if (personsAssignedToCompete.length > 0) {
      return (
        <>
          <Button onClick={() => setConfigureStationNumbersDialog(activityCode)}>
            Configure Station Numbers
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetGroupNonScramblingActitivites}>
            Reset Competitor and Judging Assignments
          </Button>
        </>
      );
    } else {
      console.log({
        groupCount: groups,
        personsAssignedToCompete: personsAssignedToCompete,
        personsShouldBeInRound: personsShouldBeInRound,
      });

      return (
        <>
          <Button onClick={() => setConfigureGroupCountsDialog(true)}>
            Configure Group Counts
          </Button>
          <Typography>No one in round to assign! Double check registrations.</Typography>
        </>
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader title={activityCodeToName(activityCode)} />
        <StageList roundActivities={roundActivities} />
        <Divider />
        <PersonsTable activityCode={activityCode} />
        {groups.length ? <GroupsGeneratorList activityCode={activityCode} /> : null}
        <CardActions>{actionButtons()}</CardActions>
      </Card>
      <ConfigureGroupCountsDialog
        open={configureGroupCountsDialog}
        onClose={() => setConfigureGroupCountsDialog(false)}
        roundActivityCode={activityCode}
      />
      {configureStationNumbersDialog && (
        <ConfigureStationNumbersDialog
          open={Boolean(configureStationNumbersDialog)}
          onClose={() => setConfigureStationNumbersDialog(false)}
          activityCode={configureStationNumbersDialog}
        />
      )}
    </>
  );
};
