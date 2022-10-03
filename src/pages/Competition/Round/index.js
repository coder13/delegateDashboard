import { useConfirm } from 'material-ui-confirm';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
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
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import PersonsAssignmentsDialog from '../../../components/PersonsAssignmentsDialog';
import PersonsDialog from '../../../components/PersonsDialog';
import {
  activityCodeToName,
  allActivities,
  byGroupNumber,
  groupActivitiesByRound,
  parseActivityCode,
  roomByActivity,
} from '../../../lib/activities';
import {
  computeGroupSizes,
  createGroupAssignment,
  nextGroupForActivity,
  previousGroupForActivity,
} from '../../../lib/groups';
import { byResult, findPR, hasCompetitorAssignment } from '../../../lib/persons';
import { byName } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import {
  bulkAddPersonAssignments,
  bulkRemovePersonAssignments,
  updateRoundChildActivities,
} from '../../../store/actions';
import {
  selectPersonsAssignedForRound,
  selectPersonsShouldBeInRound,
  selectRoundById,
} from '../../../store/selectors';
import ConfigureAssignmentsDialog from './ConfigureAssignmentsDialog';
import ConfigureGroupCountsDialog from './ConfigureGroupCountsDialog';
import ConfigureStationNumbersDialog from './ConfigureStationNumbersDialog';
import GroupCard from './GroupCard';

/**
 * TODO: Create a setting for this
 * This is an *opinion*
 */
const SORT_ORGANIZATION_STAFF_IN_LAST_GROUPS = true;

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
const RoundPage = () => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { eventId, roundNumber } = useParams();
  const activityCode = `${eventId}-r${roundNumber}`;
  const [configureAssignmentsDialog, setConfigureAssignmentsDialog] = useState(false);
  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] = useState(false);
  const [configureStationNumbersDialog, setConfigureStationNumbersDialog] = useState(false);
  const [showPersonsDialog, setShowPersonsDialog] = useState({
    open: false,
    title: undefined,
    persons: [],
  });
  const [showPersonsAssignmentsDialog, setShowPersonsAssignmentsDialog] = useState(false);

  const wcif = useSelector((state) => state.wcif);
  const round = useSelector((state) => selectRoundById(state, activityCode));
  const personsShouldBeInRound = useSelector((state) => selectPersonsShouldBeInRound(state, round));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: round.id,
      },
    ]);
  }, [setBreadcrumbs, round.id]);

  const _allActivities = allActivities(wcif);

  // list of each stage's round activity
  const roundActivities = _allActivities
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

  const groupsData = getExtensionData('groups', round);

  const groups = groupActivitiesByRound(wcif, activityCode);

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        return (
          byGroupNumber(groupA, groupB) ||
          groupA?.parent?.room?.name?.localeCompare(groupB?.parent?.room?.name)
        );
      }),
    [groups]
  );

  const personsAssigned = useSelector((state) => selectPersonsAssignedForRound(state, round.id));

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned.filter((p) => p.assignments.some((a) => a.assignmentCode === 'competitor')),
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
    // This creates a list of groupActivityIds by stage sorted by group number
    const groupActivityIds = roundActivities.map((roundActivity) =>
      roundActivity.childActivities.map((g, index) => {
        const group = groups.find(
          (g) =>
            g.parent.room.name === roundActivity.room.name &&
            parseActivityCode(g.activityCode)?.groupNumber === index + 1
        );

        return group.id;
      })
    );

    const isCurrentGroupActivity = (groupActivityId) =>
      groupActivityIds.some((g) => g.includes(groupActivityId));

    console.log(groupActivityIds);

    // Evolving set of assignments to manipulate before doing a bulk update to redux;
    const assignments = [];

    // Checks both already computed assignments and evolving set if any match the test
    const hasAssignments = (p, test) =>
      assignments.some((a) => a.registrantId === p.registrantId && test(a.assignment)) ||
      p.assignments.some((a) => isCurrentGroupActivity(a.activityId) && test(a));

    // Checks both already computed assignments and evolving set
    const findAssignments = (p, test) => [
      ...assignments.filter((a) => a.registrantId === p.registrantId && test(a.assignment)),
      ...p.assignments.filter((a) => isCurrentGroupActivity(a.activityId) && test(a)),
    ];

    const isCompetitorAssignment = (assignment) => assignment.assignmentCode === 'competitor';
    const isStaffAssignment = (assignment) => assignment.assignmentCode.startsWith('staff');

    const missingCompetitorAssignments = (p) => !hasAssignments(p, isCompetitorAssignment);
    const hasStaffAssignment = (p) => hasAssignments(p, isStaffAssignment);

    // Step 1
    // start with competitors who have no competitor assignments but have staffing assignments
    const personsWithStaffAssignments = personsShouldBeInRound
      .filter((p) => missingCompetitorAssignments(p) && hasStaffAssignment(p))
      // Filter to persons with staff assignments in this round
      .map((person) => {
        // Determines the soonest group that this person can be assigned to

        // determine staff assignment
        const assignedStaffActivities = findAssignments(person, isStaffAssignment).map(
          ({ activityId }) => groups.find((g) => activityId === g.id)
        );

        // Figure out the group numbers
        const assignedStaffActivityGroupNumbers = assignedStaffActivities.map(
          ({ activityCode }) => parseActivityCode(activityCode).groupNumber
        );

        const minGroupNumber = Math.min(...assignedStaffActivityGroupNumbers);
        const minGroupIndex = assignedStaffActivityGroupNumbers.indexOf(minGroupNumber);

        const activity = assignedStaffActivities[minGroupIndex];
        const competingActivity = previousGroupForActivity(activity);

        return createGroupAssignment(person.registrantId, competingActivity.id, 'competitor');
      });

    assignments.push(...personsWithStaffAssignments);

    // Now for other non-scrambler staff

    // Generate competing assignments for organizers and delegates
    if (SORT_ORGANIZATION_STAFF_IN_LAST_GROUPS) {
      let currentGroupPointer = groupActivityIds[0].length - 1; // start with the last group

      const assignOrganizersOrStaff = (person) => {
        const stagesInGroup = groupActivityIds
          .map((g) => g[currentGroupPointer])
          .map((activityId) => ({
            activityId: activityId,
            size: assignments.filter(
              ({ assignment }) =>
                assignment.activityId === activityId && assignment.assignmentCode === 'competitor'
            ).length,
          }));

        const min = Math.min(...stagesInGroup.map((i) => i.size));
        const smallestGroupActivityId = stagesInGroup.find((g) => g.size === min).activityId;

        assignments.push(
          createGroupAssignment(person.registrantId, smallestGroupActivityId, 'competitor')
        );

        // decrement and loop
        currentGroupPointer = (currentGroupPointer + groupsData.groups - 1) % groupsData.groups;
      };

      personsShouldBeInRound
        .filter(missingCompetitorAssignments)
        .filter((person) => person.roles.some((role) => role.indexOf('delegate') > -1))
        .forEach(assignOrganizersOrStaff);

      personsShouldBeInRound
        .filter(missingCompetitorAssignments)
        .filter((person) => person.roles.some((role) => role.indexOf('organizer') > -1))
        .forEach(assignOrganizersOrStaff);
    }

    /**
     * Determines the next smallest group that this person can be assigned to
     * @returns
     */
    const nextGroupToAssign = () => {
      const groupSizes = groups.map(computeGroupSizes(assignments));
      const min = Math.min(...groupSizes.map((i) => i.size));
      const smallestGroupActivity = groupSizes.find((g) => g.size === min).activity;

      return smallestGroupActivity.id;
    };

    const assignCompeting = (person) => {
      const nextGroupActivityId = nextGroupToAssign();

      assignments.push(
        createGroupAssignment(person.registrantId, nextGroupActivityId, 'competitor')
      );
    };

    // Assign competitors assignments to those missing competitor assignments

    const everyoneElse = personsShouldBeInRound.filter(missingCompetitorAssignments);

    const firstTimers = everyoneElse.filter((p) => !p.wcaId).sort(byName); // Everyone without a wca id
    const noSingleInEvent = everyoneElse
      .filter((p) => p.wcaId && !p.personalBests.find((pr) => pr.eventId === eventId))
      .sort(byName); // everyone with no single
    const noAverageInEvent = everyoneElse
      .filter(
        (p) =>
          p.wcaId &&
          !findPR(p.personalBests, eventId, 'average') &&
          findPR(p.personalBests, eventId, 'single')
      )
      .sort(byName)
      .sort(byResult('single', eventId)); // everyone with no average
    const hasResults = everyoneElse
      .filter((p) => p.wcaId && findPR(p.personalBests, eventId, 'average'))
      .sort(byName)
      .sort(byResult('average', eventId));

    firstTimers.forEach(assignCompeting);
    noSingleInEvent.forEach(assignCompeting);
    noAverageInEvent.forEach(assignCompeting);
    hasResults.forEach(assignCompeting);

    // assign remaining judging assignments to those missing judging assignments

    personsShouldBeInRound
      .filter(hasCompetitorAssignment)
      .filter((p) => !hasStaffAssignment(p)) // should be similar to everyoneElse
      .forEach((person) => {
        if (
          person.roles.some(
            (role) => role.indexOf('delegate') > -1 || role.indexOf('organizer') > -1
          )
        ) {
          return;
        }

        const competingAssignment = findAssignments(person, isCompetitorAssignment)[0].assignment;

        const groupActivity = groups.find((g) => competingAssignment.activityId === g.id);
        const nextGroup = nextGroupForActivity(groupActivity);

        return assignments.push(
          createGroupAssignment(person.registrantId, nextGroup.id, 'staff-judge')
        );
      });

    dispatch(bulkAddPersonAssignments(assignments));
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

  if (roundActivities.length === 0) {
    return (
      <div>
        No Group Activities found. <br />
        If you're viewing 3x3 fewest moves, there's likely not much to do here yet.
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
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <Card>
          <CardHeader title={activityCodeToName(activityCode)} />
          <List dense subheader={<ListSubheader id="stages">Stages</ListSubheader>}>
            {roundActivities.map(({ id, startTime, endTime, room }) => (
              <ListItemButton key={id}>
                {room.name}: {new Date(startTime).toLocaleDateString()}{' '}
                {new Date(startTime).toLocaleTimeString()} -{' '}
                {new Date(endTime).toLocaleTimeString()} (
                {(new Date(endTime) - new Date(startTime)) / 1000 / 60} Minutes)
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
                <TableCell sx={{ textAlign: 'center' }}>Assigned Persons</TableCell>
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
                            wcif.persons.find(({ registrantId }) => registrantId === personId)
                          )
                          .sort(byName) || [],
                      title: 'People in the round according to wca-live',
                    })
                  }>
                  {round.results.length}
                </TableCell>
                <TableCell
                  className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
                  sx={{ textAlign: 'center' }}
                  onClick={() => setShowPersonsAssignmentsDialog(true)}>
                  {personsAssigned.length}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{groupsData.groups}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <CardActions>{actionButtons()}</CardActions>
        </Card>
      </Grid>

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
        title={showPersonsDialog?.title}
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
    </Grid>
  );
};

export default RoundPage;
