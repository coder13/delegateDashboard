import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { type Round, type Activity } from '@wca/helpers';
import { RoundStatisticsCard } from '../../../components/RoundStatisticsCard';
import GroupCard from '../../../components/GroupCard';
import { type ActivityWithRoom } from '../../../lib/domain/types';
import { type AppState } from '../../../store/initialState';
import { type Person } from '@wca/helpers';

interface NormalRoundViewProps {
  activityCode: string;
  roundActivities: ActivityWithRoom[];
  round: Round;
  eventId: string;
  personsShouldBeInRound: Person[];
  personsAssigned: Person[];
  personsAssignedWithCompetitorAssignmentCount: number;
  wcif: AppState['wcif'];
  onOpenRawRoundData: () => void;
  onOpenRawActivitiesData: () => void;
  onOpenPersonsDialog: (title: string, persons: Person[]) => void;
  onOpenPersonsAssignmentsDialog: () => void;
  actionButtons: React.ReactNode;
  adamRoundConfig: {
    groupCount?: number;
    expectedRegistrations?: number;
  } | null;
  sortedGroups: Activity[];
}

/**
 * View component for regular rounds that use group activities.
 * Allows creating groups and making assignments at the group level.
 */
const NormalRoundView = ({
  activityCode,
  roundActivities,
  round,
  eventId,
  personsShouldBeInRound,
  personsAssigned,
  personsAssignedWithCompetitorAssignmentCount,
  wcif,
  onOpenRawRoundData,
  onOpenRawActivitiesData,
  onOpenPersonsDialog,
  onOpenPersonsAssignmentsDialog,
  actionButtons,
  adamRoundConfig,
  sortedGroups,
}: NormalRoundViewProps) => {
  const pluralizeWord = (count: number, singular: string, plural?: string) =>
    count === 1 ? singular : plural || singular + 's';

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        {adamRoundConfig && (
          <Alert severity="info">
            The delegate team strongly recommends <b>{adamRoundConfig.groupCount}</b>{' '}
            {pluralizeWord(adamRoundConfig.groupCount || 0, 'group', 'groups')} for this round. This
            was based on an estimated number of competitors for this round of{' '}
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
          personsAssignedWithCompetitorAssignmentCount={personsAssignedWithCompetitorAssignmentCount}
          wcif={wcif}
          onOpenRawRoundData={onOpenRawRoundData}
          onOpenRawActivitiesData={onOpenRawActivitiesData}
          onOpenPersonsDialog={onOpenPersonsDialog}
          onOpenPersonsAssignmentsDialog={onOpenPersonsAssignmentsDialog}
          actionButtons={actionButtons}
        />
      </Grid>

      {personsShouldBeInRound.length === 0 && (
        <Grid item>
          <Alert severity="warning">
            <Typography>
              No one in round to automatically assign. Make sure the next round is opened on WCA-Live
              to generate assignments
            </Typography>
          </Alert>
        </Grid>
      )}

      <Grid item>
        {sortedGroups.map((group) => (
          <GroupCard key={group.id} groupActivity={group} />
        ))}
      </Grid>
    </Grid>
  );
};

export default NormalRoundView;
