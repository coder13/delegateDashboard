import PersonsAssignmentsDialog from '../../components/PersonsAssignmentsDialog';
import PersonsDialog from '../../components/PersonsDialog';
import ConfigureAssignmentsDialog from '../../pages/Competition/Round/ConfigureAssignmentsDialog/ConfigureAssignmentsDialog';
import ConfigureGroupCountsDialog from '../../pages/Competition/Round/ConfigureGroupCountsDialog';
import { ConfigureGroupsDialog } from '../../pages/Competition/Round/ConfigureGroupsDialog';
import ConfigureStationNumbersDialog from '../../pages/Competition/Round/ConfigureStationNumbersDialog';
import GroupCard from '../../pages/Competition/Round/GroupCard';
import { RawRoundActivitiesDataDialog } from '../../pages/Competition/Round/RawRoundActivitiesDataDialog';
import { RawRoundDataDialog } from '../../pages/Competition/Round/RawRoundDataDialog';
import { RoundActionButtons } from './components/RoundActionButtons';
import { RoundStatisticsCard } from './components/RoundStatisticsCard';
import { useRoundActions } from './hooks/useRoundActions';
import { useRoundData } from './hooks/useRoundData';
import { useRoundDialogs } from './hooks/useRoundDialogs';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { type Round } from '@wca/helpers';
import { ConfirmProvider } from 'material-ui-confirm';

interface RoundContainerProps {
  roundId: string;
  activityCode: string;
  eventId: string;
  round: Round;
}

const RoundContainer = ({ roundId, activityCode, eventId, round }: RoundContainerProps) => {
  const dialogs = useRoundDialogs();

  const {
    wcif,
    personsShouldBeInRound,
    roundActivities,
    groups,
    sortedGroups,
    personsAssigned,
    personsAssignedToCompete,
    personsAssignedWithCompetitorAssignmentCount,
    adamRoundConfig,
  } = useRoundData(activityCode, round);

  const { handleGenerateAssignments, handleResetAll, handleResetNonScrambling } = useRoundActions({
    round,
    groups,
    roundActivities,
  });

  if (roundActivities.length === 0) {
    return (
      <div>
        No Group Activities found. <br />
      </div>
    );
  }

  const pluralizeWord = (count: number, singular: string, plural?: string) =>
    count === 1 ? singular : plural || singular + 's';

  if (!round) {
    return null;
  }

  return (
    <ConfirmProvider>
      <Grid container direction="column" spacing={2}>
        <Grid item>
          {adamRoundConfig && (
            <Alert severity="info">
              The delegate team strongly recommends <b>{adamRoundConfig.groupCount}</b>{' '}
              {pluralizeWord(adamRoundConfig.groupCount || 0, 'group', 'groups')} for this round.
              This was based on an estimated number of competitors for this round of{' '}
              <b>{adamRoundConfig.expectedRegistrations}</b>. Discuss with the delegates before
              deviating from this number.
            </Alert>
          )}
        </Grid>
        <Grid item>
          <RoundStatisticsCard
            activityCode={activityCode}
            roundActivities={roundActivities}
            round={round}
            eventId={eventId}
            personsShouldBeInRound={personsShouldBeInRound}
            personsAssigned={personsAssigned}
            personsAssignedWithCompetitorAssignmentCount={
              personsAssignedWithCompetitorAssignmentCount
            }
            wcif={wcif}
            onOpenRawRoundData={() => dialogs.rawRoundData.setOpen(true)}
            onOpenRawActivitiesData={() => dialogs.rawRoundActivitiesData.setOpen(true)}
            onOpenPersonsDialog={dialogs.personsDialog.open}
            onOpenPersonsAssignmentsDialog={() => dialogs.personsAssignments.setOpen(true)}
            actionButtons={
              <RoundActionButtons
                groups={groups}
                personsAssignedToCompete={personsAssignedToCompete}
                personsShouldBeInRound={personsShouldBeInRound}
                activityCode={activityCode}
                onConfigureAssignments={() => dialogs.configureAssignments.setOpen(true)}
                onGenerateAssignments={handleGenerateAssignments}
                onConfigureStationNumbers={(code) =>
                  dialogs.configureStationNumbers.setActivityCode(code)
                }
                onConfigureGroups={() => dialogs.configureGroups.setOpen(true)}
                onResetAll={handleResetAll}
                onResetNonScrambling={handleResetNonScrambling}
                onConfigureGroupCounts={() => dialogs.configureGroupCounts.setOpen(true)}
              />
            }
          />
        </Grid>

        {personsShouldBeInRound.length === 0 && (
          <Grid item>
            <Alert severity="warning">
              <Typography>
                No one in round to automatically assign. Make sure the next round is opened on
                WCA-Live to generate assignments
              </Typography>
            </Alert>
          </Grid>
        )}

        <Grid item>
          {sortedGroups.map((group) => (
            <GroupCard key={group.id} groupActivity={group} />
          ))}
        </Grid>

        <ConfigureAssignmentsDialog
          open={dialogs.configureAssignments.open}
          onClose={() => dialogs.configureAssignments.setOpen(false)}
          round={round}
          activityCode={activityCode}
          groups={groups}
        />
        <ConfigureGroupCountsDialog
          open={dialogs.configureGroupCounts.open}
          onClose={() => dialogs.configureGroupCounts.setOpen(false)}
          activityCode={activityCode}
          round={round}
          roundActivities={roundActivities}
        />
        {dialogs.configureStationNumbers.activityCode && (
          <ConfigureStationNumbersDialog
            open={Boolean(dialogs.configureStationNumbers.activityCode)}
            onClose={() => dialogs.configureStationNumbers.setActivityCode(false)}
            activityCode={dialogs.configureStationNumbers.activityCode}
          />
        )}
        <PersonsDialog
          open={dialogs.personsDialog.state.open}
          persons={dialogs.personsDialog.state.persons}
          title={dialogs.personsDialog.state.title || ''}
          onClose={dialogs.personsDialog.close}
        />
        <PersonsAssignmentsDialog
          open={dialogs.personsAssignments.open}
          persons={personsShouldBeInRound}
          roundId={round.id}
          onClose={() => dialogs.personsAssignments.setOpen(false)}
        />
        <ConfigureGroupsDialog
          open={dialogs.configureGroups.open}
          onClose={() => dialogs.configureGroups.setOpen(false)}
          activityCode={activityCode}
        />
        <RawRoundDataDialog
          open={dialogs.rawRoundData.open}
          onClose={() => dialogs.rawRoundData.setOpen(false)}
          roundId={roundId}
        />
        <RawRoundActivitiesDataDialog
          open={dialogs.rawRoundActivitiesData.open}
          onClose={() => dialogs.rawRoundActivitiesData.setOpen(false)}
          activityCode={activityCode}
        />
      </Grid>
    </ConfirmProvider>
  );
};

export default RoundContainer;
