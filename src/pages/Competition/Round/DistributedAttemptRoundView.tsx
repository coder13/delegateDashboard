import { Alert, Typography, Card, CardHeader, CardActions, Divider, List, ListItemButton, ListSubheader, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { type Round } from '@wca/helpers';
import { type ActivityWithRoom } from '../../../lib/domain/types';
import { type AppState } from '../../../store/initialState';
import { type Person } from '@wca/helpers';
import { activityCodeToName } from '../../../lib/domain/activities';
import { formatTimeRange } from '../../../lib/utils/time';
import { byName } from '../../../lib/utils/utils';
import { cumulativeGroupCount } from '../../../lib/wcif/groups';
import { RoundLimitInfo } from '../../../components/RoundLimitInfo';
import ActionMenu from '../../../components/ActionMenu';

interface DistributedAttemptRoundViewProps {
  activityCode: string;
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
  distributedAttemptGroups: Array<{
    attemptNumber: number;
    activities: ActivityWithRoom[];
  }>;
}

/**
 * View component for rounds with distributed attempts (333fm, 333mbf).
 * These events require round-level competitor assignments rather than group-level assignments.
 */
const DistributedAttemptRoundView = ({
  activityCode,
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
  distributedAttemptGroups,
}: DistributedAttemptRoundViewProps) => {
  const pluralizeWord = (count: number, singular: string, plural?: string) =>
    count === 1 ? singular : plural || singular + 's';

  // Check if there are multiple stages
  const uniqueStages = new Set(
    distributedAttemptGroups.flatMap(({ activities }) =>
      activities.map((activity) => activity.room.name)
    )
  );
  const hasMultipleStages = uniqueStages.size > 1;

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
        <Card>
          <CardHeader
            title={activityCodeToName(activityCode)}
            action={
              <ActionMenu
                items={[
                  {
                    label: 'Dangerously Edit Raw Round Data',
                    onClick: onOpenRawRoundData,
                  },
                  {
                    label: 'Dangerously Edit Raw Round Activities Data',
                    onClick: onOpenRawActivitiesData,
                  },
                ]}
              />
            }
          />
          <List dense subheader={<ListSubheader id="attempts">Attempts</ListSubheader>}>
            {distributedAttemptGroups.map(({ attemptNumber, activities }) => {
              // For each attempt, show all activities (potentially across multiple stages)
              if (hasMultipleStages) {
                // Show stage info for each activity
                return activities.map((activity) => {
                  const roomName = activity.room.name;
                  
                  return (
                    <ListItemButton key={activity.id}>
                      Attempt {attemptNumber} - {roomName}:{' '}
                      {new Date(activity.startTime).toLocaleDateString()}{' '}
                      {formatTimeRange(activity.startTime, activity.endTime)} (
                      {(new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) /
                        1000 /
                        60}{' '}
                      Minutes)
                    </ListItemButton>
                  );
                });
              } else {
                // Single stage - just show the attempt with timing
                const firstActivity = activities[0];
                if (!firstActivity) return null;
                
                return (
                  <ListItemButton key={attemptNumber}>
                    Attempt {attemptNumber}: {new Date(firstActivity.startTime).toLocaleDateString()}{' '}
                    {formatTimeRange(firstActivity.startTime, firstActivity.endTime)} (
                    {(new Date(firstActivity.endTime).getTime() -
                      new Date(firstActivity.startTime).getTime()) /
                      1000 /
                      60}{' '}
                    Minutes)
                  </ListItemButton>
                );
              }
            })}
          </List>

          <Divider />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: 'center' }}>Round Size</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  Persons In Round
                  <br />
                  <Typography variant="caption">Based on WCA-Live data</Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Competitors assigned</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Persons with any assignment</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  Groups Configured <br />
                  (per stage)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={() =>
                    onOpenPersonsDialog(
                      'People who should be in the round',
                      personsShouldBeInRound?.sort(byName) || []
                    )
                  }>
                  {personsShouldBeInRound?.length || '???'}
                </TableCell>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={() =>
                    onOpenPersonsDialog(
                      'People in the round according to wca-live',
                      round.results.length > 0
                        ? round.results
                            .map(({ personId }) =>
                              wcif?.persons.find(({ registrantId }) => registrantId === personId)
                            )
                            .filter((p): p is Person => p !== undefined)
                            .sort(byName) || []
                        : []
                    )
                  }>
                  {round?.results?.length}
                </TableCell>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}>
                  {personsAssignedWithCompetitorAssignmentCount}
                </TableCell>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={onOpenPersonsAssignmentsDialog}>
                  {personsAssigned.length}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{cumulativeGroupCount(round)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <RoundLimitInfo
            round={round}
            eventId={eventId}
            personsShouldBeInRound={personsShouldBeInRound}
          />
          <Divider />

          <CardActions>{actionButtons}</CardActions>
        </Card>
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
    </Grid>
  );
};

export default DistributedAttemptRoundView;
