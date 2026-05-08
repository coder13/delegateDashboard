import PersonsAssignmentsDialog from '../../../dialogs/PersonsAssignmentsDialog';
import PersonsDialog from '../../../dialogs/PersonsDialog';
import ConfigureAssignmentsDialog from '../../../dialogs/ConfigureAssignmentsDialog/ConfigureAssignmentsDialog';
import ConfigureGroupCountsDialog from '../../../dialogs/ConfigureGroupCountsDialog';
import { ConfigureGroupsDialog } from '../../../dialogs/ConfigureGroupsDialog';
import ConfigureStationNumbersDialog from '../../../dialogs/ConfigureStationNumbersDialog';
import { RawRoundActivitiesDataDialog } from '../../../dialogs/RawRoundActivitiesDataDialog';
import { RawRoundDataDialog } from '../../../dialogs/RawRoundDataDialog';
import { RoundActionButtons } from '../../../components/RoundActionButtons';
import { useRoundActions } from './hooks/useRoundActions';
import { useRoundData } from './hooks/useRoundData';
import { useRoundDialogs } from './hooks/useRoundDialogs';
import DistributedAttemptRoundView from './DistributedAttemptRoundView';
import NormalRoundView from './NormalRoundView';
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
    isDistributedAttemptRoundLevel,
    distributedAttemptGroups,
  } = useRoundData(activityCode, round);

  const {
    handleGenerateAssignments,
    handleAssignToRoundAttempt,
    handleResetAttemptAssignments,
    handleResetAll,
    handleResetNonScrambling,
  } = useRoundActions({
    round,
    activityCode,
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

  if (!round) {
    return null;
  }

  const actionButtons = (
    <RoundActionButtons
      groups={groups}
      personsAssignedToCompete={personsAssignedToCompete}
      personsShouldBeInRound={personsShouldBeInRound}
      activityCode={activityCode}
      onConfigureAssignments={() => dialogs.configureAssignments.setOpen(true)}
      onGenerateAssignments={handleGenerateAssignments}
      onAssignToRoundAttempt={handleAssignToRoundAttempt}
      onResetAttemptAssignments={handleResetAttemptAssignments}
      onConfigureStationNumbers={(code) => dialogs.configureStationNumbers.setActivityCode(code)}
      onConfigureGroups={() => dialogs.configureGroups.setOpen(true)}
      onResetAll={handleResetAll}
      onResetNonScrambling={handleResetNonScrambling}
      onConfigureGroupCounts={() => dialogs.configureGroupCounts.setOpen(true)}
      isDistributedAttemptRoundLevel={isDistributedAttemptRoundLevel}
    />
  );

  const commonDialogs = (
    <>
      <ConfigureAssignmentsDialog
        open={dialogs.configureAssignments.open}
        onClose={() => dialogs.configureAssignments.setOpen(false)}
        round={round}
        activityCode={activityCode}
        groups={groups}
        isDistributedAttemptRoundLevel={isDistributedAttemptRoundLevel}
        distributedAttemptGroups={distributedAttemptGroups}
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
    </>
  );

  return (
    <ConfirmProvider>
      {isDistributedAttemptRoundLevel ? (
        <DistributedAttemptRoundView
          activityCode={activityCode}
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
          actionButtons={actionButtons}
          adamRoundConfig={adamRoundConfig}
          distributedAttemptGroups={distributedAttemptGroups}
        />
      ) : (
        <NormalRoundView
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
          actionButtons={actionButtons}
          adamRoundConfig={adamRoundConfig}
          sortedGroups={sortedGroups}
        />
      )}
      {commonDialogs}
    </ConfirmProvider>
  );
};

export default RoundContainer;
