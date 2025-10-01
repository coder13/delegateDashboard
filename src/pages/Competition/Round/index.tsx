import ActionMenu from '../../../components/ActionMenu';
import PersonsAssignmentsDialog from '../../../components/PersonsAssignmentsDialog';
import PersonsDialog from '../../../components/PersonsDialog';
import {
  activityCodeToName,
  findAllActivities,
  byGroupNumber,
  roomByActivity,
  cumulativeGroupCount,
  allChildActivities,
} from '../../../lib/activities';
import { mayMakeCutoff, mayMakeTimeLimit } from '../../../lib/persons';
import { formatTimeRange } from '../../../lib/time';
import { byName, pluralize, pluralizeWord, renderResultByEventId } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import {
  bulkRemovePersonAssignments,
  generateAssignments,
  updateRoundChildActivities,
} from '../../../store/actions';
import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
  selectPersonsShouldBeInRound,
  selectRoundById,
} from '../../../store/selectors';
import ConfigureAssignmentsDialog from './ConfigureAssignmentsDialog';
import ConfigureGroupCountsDialog from './ConfigureGroupCountsDialog';
import { ConfigureGroupsDialog } from './ConfigureGroupsDialog';
import ConfigureStationNumbersDialog from './ConfigureStationNumbersDialog';
import GroupCard from './GroupCard';
import { RawRoundActivitiesDataDialog } from './RawRoundActivitiesDataDialog';
import { RawRoundDataDialog } from './RawRoundDataDialog';
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
import { formatCentiseconds, parseActivityCode } from '@wca/helpers';
import { useConfirm } from 'material-ui-confirm';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../store/initialState';
import { useParams } from 'react-router-dom';

/**
 * I want some visualization of who's competing / staffing what for this particular round
 * If no one has been assigned, I want to generate assignments
 * I want to view a mini psych sheet so that I can pick scramblers
 * I want DOB so that I know who really not to bother assigning
 *
 */

/**
 * Handles multiple activities across multiple rooms under 1 round activity code
 */
const RoundPage = (props?: any) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { roundId: activityCode } = useParams();
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const roundId = `${eventId}-r${roundNumber}`;
  const [configureAssignmentsDialog, setConfigureAssignmentsDialog] = useState<boolean>(false);
  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] = useState<boolean>(false);
  const [configureGroupsDialog, setConfigureGroupsDialog] = useState<boolean>(false);
  const [configureStationNumbersDialog, setConfigureStationNumbersDialog] = useState<boolean>(false);
  const [rawRoundDataDialogOpen, setRawRoundDataDialogOpen] = useState<boolean>(false);
  const [rawRoundActivitiesDataDialogOpen, setRawRoundActivitiesDataDialogOpen] = useState<boolean>(false);
  const [showPersonsDialog, setShowPersonsDialog] = useState({
    open: false as any,
    title: undefined,
    persons: [],
  });
  const [showPersonsAssignmentsDialog, setShowPersonsAssignmentsDialog] = useState<boolean>(false);

  const wcif = useSelector((state: AppState) => state.wcif);

  if (!wcif) return null;

  const round = useSelector((state: AppState) => selectRoundById(state)(roundId));
  const personsShouldBeInRound = useSelector((state: AppState) => selectPersonsShouldBeInRound(state)(round));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: activityCode,
      },
    ]);
  }, [setBreadcrumbs, activityCode]);

  // list of each stage's round activity
  const roundActivities = findAllActivities(wcif)
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

  const groups = roundActivities.flatMap((roundActivity) => allChildActivities(roundActivity));

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        return (
          byGroupNumber(groupA, groupB) ||
          (groupA?.parent?.room?.name as any)?.localeCompare(groupB?.parent?.room?.name as any)
        );
      }),
    [groups]
  );

  const personsAssigned = useSelector((state: AppState) => selectPersonsAssignedForRound(state as any, round!.id));

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned.filter((p) => (p.assignments || [])!.some((a) => a.assignmentCode === 'competitor')),
    [personsAssigned]
  );

  const personsAssignedWithCompetitorAssignmentCount = useSelector(
    (state) => selectPersonsHavingCompetitorAssignmentsForRound(state as any, round!.id).length
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
  const onGenerateGroupActitivites = (props?: any) => {
    dispatch(generateAssignments(round!.id));
  };

  const onResetGroupActitivites = (props?: any) => {
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

  const onResetGroupNonScramblingActitivites = (props?: any) => {
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

  const onConfigureAssignments = (props?: any) => {
    setConfigureAssignmentsDialog(true);
  };

  const adamRoundConfig = getExtensionData('RoundConfig', round, 'competitionScheduler');

  if (roundActivities.length === 0) {
    return (
      <div>
        No Group Activities found. <br />
      </div>
    );
  }

  const actionButtons = (props?: any) => {
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
          <Button onClick={() => setConfigureStationNumbersDialog(Boolean(activityCode) as any)}>
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

  return (
    <>
      <Grid container direction="column" spacing={2}>
        <Grid item>
          {adamRoundConfig && (
            <Alert severity="info">
              The delegate team strongly recommends <b>{adamRoundConfig.groupCount}</b>{' '}
              {pluralizeWord(adamRoundConfig.groupCount, 'group', 'groups')} for this round!. This
              was based on an estimated number of competitors for this round of{' '}
              <b>{adamRoundConfig.expectedRegistrations}</b>. Discuss with the delegates before
              deviating from this number.
            </Alert>
          )}
        </Grid>
        <Grid item>
          <Card>
            <CardHeader
              title={activityCodeToName(activityCode!)}
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
                  {room!.name}: {new Date(startTime).toLocaleDateString()}{' '}
                  {formatTimeRange(startTime, endTime)} (
                  {((new Date(endTime) as any) - (new Date(startTime) as any)) / 1000 / 60} Minutes)
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
                        persons: (personsShouldBeInRound?.sort(byName) || []) as any,
                        title: 'People who should be in the round' as any,
                      })
                    }>
                    {personsShouldBeInRound?.length || '???'}
                  </TableCell>
                  <TableCell
                    className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                    sx={{ textAlign: 'center' }}
                    onClick={() =>
                      setShowPersonsDialog({
                        open: round!.results.length > 0,
                        persons: (round!.results
                            .map(({ personId }) =>
                              wcif.persons.find(({ registrantId }) => registrantId === personId)
                            )
                            .sort(byName) || []) as any,
                        title: 'People in the round according to wca-live' as any,
                      })
                    }>
                    {round!.results?.length}
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
              {round!.timeLimit && (
                <Tooltip title="Defined by the number of people who have a PR single under the timelimit">
                  <Box sx={{ px: 3, py: 1 }}>
                    <Typography>
                      Time Limit: {formatCentiseconds(round!.timeLimit.centiseconds)}
                    </Typography>
                    {personsShouldBeInRound.length > 0 && (
                      <Typography>
                        May make TimeLimit:{' '}
                        {mayMakeTimeLimit(eventId, round, personsShouldBeInRound)?.length}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              )}
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              {round!.cutoff && (
                <Tooltip title="Defined by the number of people who have a PR average under the cutoff">
                  <Box sx={{ px: 3, py: 1 }}>
                    <Typography>
                      Cutoff: {round!.cutoff.numberOfAttempts} attempts to get {'< '}
                      {renderResultByEventId(eventId, 'average', round!.cutoff.attemptResult)}
                    </Typography>
                    {personsShouldBeInRound.length > 0 && (
                      <Typography>
                        May make cutoff:{' '}
                        {mayMakeCutoff(eventId, round, personsShouldBeInRound)?.length}
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
          round={round!}
          activityCode={activityCode!}
          groups={groups}
        />
        <ConfigureGroupCountsDialog
          open={configureGroupCountsDialog}
          onClose={() => setConfigureGroupCountsDialog(false)}
          activityCode={activityCode!}
          round={round!}
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
          title={showPersonsDialog?.title}
          onClose={() =>
            setShowPersonsDialog({
              open: false as any,
              title: undefined,
              persons: [],
            })
          }
        />
        <PersonsAssignmentsDialog
          open={showPersonsAssignmentsDialog}
          persons={personsShouldBeInRound}
          roundId={round!.id}
          onClose={() => setShowPersonsAssignmentsDialog(false)}
        />
        <ConfigureGroupsDialog
          open={configureGroupsDialog}
          onClose={() => setConfigureGroupsDialog(false)}
          activityCode={activityCode!}
        />
        <RawRoundDataDialog
          open={rawRoundDataDialogOpen}
          onClose={() => setRawRoundDataDialogOpen(false)}
          roundId={roundId!}
        />
        <RawRoundActivitiesDataDialog
          open={rawRoundActivitiesDataDialogOpen}
          onClose={() => setRawRoundActivitiesDataDialogOpen(false)}
          activityCode={activityCode!}
        />
      </Grid>
    </>
  );
};

export default RoundPage;
