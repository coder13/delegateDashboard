import ActionMenu from '../components/ActionMenu';
import PersonsAssignmentsDialog from '../components/PersonsAssignmentsDialog';
import PersonsDialog from '../components/PersonsDialog';
import {
  activityCodeToName,
  allChildActivities,
  byGroupNumber,
  cumulativeGroupCount,
  findAllActivities,
  roomByActivity,
} from '../lib/domain/activities';
import { mayMakeCutoff, mayMakeTimeLimit } from '../lib/domain/persons';
import { formatTimeRange } from '../lib/utils/time';
import { byName, pluralizeWord, renderResultByEventId } from '../lib/utils/utils';
import { getExtensionData } from '../lib/wcif/extensions/wcif-extensions';
import ConfigureAssignmentsDialog from '../pages/Competition/Round/ConfigureAssignmentsDialog';
import ConfigureGroupCountsDialog from '../pages/Competition/Round/ConfigureGroupCountsDialog';
import { ConfigureGroupsDialog } from '../pages/Competition/Round/ConfigureGroupsDialog';
import ConfigureStationNumbersDialog from '../pages/Competition/Round/ConfigureStationNumbersDialog';
import GroupCard from '../pages/Competition/Round/GroupCard';
import { RawRoundActivitiesDataDialog } from '../pages/Competition/Round/RawRoundActivitiesDataDialog';
import { RawRoundDataDialog } from '../pages/Competition/Round/RawRoundDataDialog';
import { useAppSelector } from '../store';
import {
  bulkRemovePersonAssignments,
  generateAssignments,
  updateRoundChildActivities,
} from '../store/actions';
import { AppState } from '../store/initialState';
import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
  selectPersonsShouldBeInRound,
} from '../store/selectors';
import {
  Alert,
  Box,
  Card,
  CardActions,
  CardHeader,
  Divider,
  List,
  ListItemButton,
  ListSubheader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { type EventId, formatCentiseconds, type Person, type Round } from '@wca/helpers';
import { useConfirm } from 'material-ui-confirm';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

interface RoundContainerProps {
  roundId: string;
  activityCode: string;
  eventId: string;
  round: Round;
}

interface GroupWithRoom {
  id: number;
  parent?: {
    room?: {
      name?: string;
    };
  };
}

const RoundContainer = ({ roundId, activityCode, eventId, round }: RoundContainerProps) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [configureAssignmentsDialog, setConfigureAssignmentsDialog] = useState(false);
  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] = useState(false);
  const [configureGroupsDialog, setConfigureGroupsDialog] = useState(false);
  const [configureStationNumbersDialog, setConfigureStationNumbersDialog] = useState<
    string | false
  >(false);
  const [rawRoundDataDialogOpen, setRawRoundDataDialogOpen] = useState(false);
  const [rawRoundActivitiesDataDialogOpen, setRawRoundActivitiesDataDialogOpen] = useState(false);
  const [showPersonsDialog, setShowPersonsDialog] = useState<{
    open: boolean;
    title?: string;
    persons: Person[];
  }>({
    open: false,
    title: undefined,
    persons: [],
  });
  const [showPersonsAssignmentsDialog, setShowPersonsAssignmentsDialog] = useState(false);

  const wcif = useAppSelector((state) => state.wcif);

  const personsShouldBeInRound = useAppSelector((state) =>
    round ? selectPersonsShouldBeInRound(state)(round) : []
  );

  // list of each stage's round activity
  const roundActivities = wcif
    ? findAllActivities(wcif)
        .filter((activity) => activity.activityCode === activityCode)
        .map((activity) => ({
          ...activity,
          room: roomByActivity(wcif, activity.id),
        }))
    : [];

  const groups = roundActivities.flatMap((roundActivity) => allChildActivities(roundActivity));

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        const groupAWithRoom = groupA as unknown as GroupWithRoom;
        const groupBWithRoom = groupB as unknown as GroupWithRoom;
        const groupAName = groupAWithRoom?.parent?.room?.name;
        const groupBName = groupBWithRoom?.parent?.room?.name;
        return (
          byGroupNumber(groupA, groupB) ||
          (groupAName && groupBName ? groupAName.localeCompare(groupBName) : 0)
        );
      }),
    [groups]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personsAssigned = useAppSelector((state: any) =>
    round ? selectPersonsAssignedForRound(state as AppState, round.id) : []
  );

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned.filter((p: Person) =>
        p.assignments?.some((a) => a.assignmentCode === 'competitor')
      ),
    [personsAssigned]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personsAssignedWithCompetitorAssignmentCount = useAppSelector((state: any) =>
    round ? selectPersonsHavingCompetitorAssignmentsForRound(state as AppState, round.id).length : 0
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
    if (!round) return;
    dispatch(generateAssignments(round.id));
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

  const onConfigureAssignments = () => {
    setConfigureAssignmentsDialog(true);
  };

  const adamRoundConfig = round
    ? (getExtensionData('RoundConfig', round, 'competitionScheduler') as {
        groupCount?: number;
        expectedRegistrations?: number;
      } | null)
    : null;

  if (roundActivities.length === 0) {
    return (
      <div>
        No Group Activities found. <br />
      </div>
    );
  }

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
          <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
          <Button onClick={onGenerateGroupActitivites}>
            Assign Competitor and Judging Assignments
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button onClick={() => setConfigureGroupsDialog(true)}>Configure Groups</Button>
          <Button color="error" onClick={onResetGroupActitivites}>
            Reset Group Activities
          </Button>
        </>
      );
    } else if (groups.length > 0 && personsShouldBeInRound.length === 0) {
      return (
        <>
          <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button onClick={() => setConfigureGroupsDialog(true)}>Configure Groups</Button>
          <Button color="error" onClick={onResetGroupActitivites}>
            Reset Group Activities
          </Button>
        </>
      );
    } else if (personsAssignedToCompete.length > 0) {
      return (
        <>
          <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
          <Button onClick={() => setConfigureStationNumbersDialog(activityCode)}>
            Configure Station Numbers
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetGroupNonScramblingActitivites}>
            Reset Competitor and Judging Assignments
          </Button>
        </>
      );
    }

    return (
      <>
        <Button onClick={() => setConfigureGroupCountsDialog(true)}>Configure Group Counts</Button>
      </>
    );
  };

  if (!round) {
    return null;
  }

  return (
    <>
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
          <Card>
            <CardHeader
              title={activityCodeToName(activityCode)}
              action={
                <ActionMenu
                  items={[
                    {
                      label: 'Dangerously Edit Raw Round Data',
                      onClick: () => setRawRoundDataDialogOpen(true),
                    },
                    {
                      label: 'Dangerously Edit Raw Round Activities Data',
                      onClick: () => setRawRoundActivitiesDataDialogOpen(true),
                    },
                  ]}
                />
              }
            />
            <List dense subheader={<ListSubheader id="stages">Stages</ListSubheader>}>
              {roundActivities.map(({ id, startTime, endTime, room }) => (
                <ListItemButton key={id}>
                  {room?.name}: {new Date(startTime).toLocaleDateString()}{' '}
                  {formatTimeRange(startTime, endTime)} (
                  {(new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60}{' '}
                  Minutes)
                </ListItemButton>
              ))}
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
                      setShowPersonsDialog({
                        open: true,
                        persons: personsShouldBeInRound?.sort(byName) || [],
                        title: 'People who should be in the round',
                      })
                    }>
                    {personsShouldBeInRound?.length || '???'}
                  </TableCell>
                  <TableCell
                    className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                    sx={{ textAlign: 'center' }}
                    onClick={() =>
                      setShowPersonsDialog({
                        open: round.results.length > 0,
                        persons:
                          round.results
                            .map(({ personId }) =>
                              wcif?.persons.find(({ registrantId }) => registrantId === personId)
                            )
                            .filter((p): p is Person => p !== undefined)
                            .sort(byName) || [],
                        title: 'People in the round according to wca-live',
                      })
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
                    onClick={() => setShowPersonsAssignmentsDialog(true)}>
                    {personsAssigned.length}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{cumulativeGroupCount(round)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex' }}>
              {round.timeLimit && (
                <Tooltip title="Defined by the number of people who have a PR single under the timelimit">
                  <Box sx={{ px: 3, py: 1 }}>
                    <Typography>
                      Time Limit: {formatCentiseconds(round.timeLimit.centiseconds)}
                    </Typography>
                    {personsShouldBeInRound.length > 0 && (
                      <Typography>
                        May make TimeLimit:{' '}
                        {
                          mayMakeTimeLimit(eventId as EventId, round, personsShouldBeInRound)
                            ?.length
                        }
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              )}
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              {round.cutoff && (
                <Tooltip title="Defined by the number of people who have a PR average under the cutoff">
                  <Box sx={{ px: 3, py: 1 }}>
                    <Typography>
                      Cutoff: {round.cutoff.numberOfAttempts} attempts to get {'< '}
                      {renderResultByEventId(
                        eventId as EventId,
                        'average',
                        round.cutoff.attemptResult
                      )}
                    </Typography>
                    {personsShouldBeInRound.length > 0 && (
                      <Typography>
                        May make cutoff:{' '}
                        {mayMakeCutoff(eventId as EventId, round, personsShouldBeInRound)?.length}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              )}
            </Box>
            <Divider />

            <CardActions>{actionButtons()}</CardActions>
          </Card>
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
          open={configureAssignmentsDialog}
          onClose={() => setConfigureAssignmentsDialog(false)}
          round={round}
          activityCode={activityCode}
          groups={groups}
        />
        <ConfigureGroupCountsDialog
          open={configureGroupCountsDialog}
          onClose={() => setConfigureGroupCountsDialog(false)}
          activityCode={activityCode}
          round={round}
          roundActivities={roundActivities}
        />
        {configureStationNumbersDialog && (
          <ConfigureStationNumbersDialog
            open={Boolean(configureStationNumbersDialog)}
            onClose={() => setConfigureStationNumbersDialog(false)}
            activityCode={configureStationNumbersDialog}
          />
        )}
        <PersonsDialog
          open={showPersonsDialog?.open}
          persons={showPersonsDialog?.persons}
          title={showPersonsDialog?.title || ''}
          onClose={() =>
            setShowPersonsDialog({
              open: false,
              title: undefined,
              persons: [],
            })
          }
        />
        <PersonsAssignmentsDialog
          open={showPersonsAssignmentsDialog}
          persons={personsShouldBeInRound}
          roundId={round.id}
          onClose={() => setShowPersonsAssignmentsDialog(false)}
        />
        <ConfigureGroupsDialog
          open={configureGroupsDialog}
          onClose={() => setConfigureGroupsDialog(false)}
          activityCode={activityCode}
        />
        <RawRoundDataDialog
          open={rawRoundDataDialogOpen}
          onClose={() => setRawRoundDataDialogOpen(false)}
          roundId={roundId}
        />
        <RawRoundActivitiesDataDialog
          open={rawRoundActivitiesDataDialogOpen}
          onClose={() => setRawRoundActivitiesDataDialogOpen(false)}
          activityCode={activityCode}
        />
      </Grid>
    </>
  );
};

export default RoundContainer;
