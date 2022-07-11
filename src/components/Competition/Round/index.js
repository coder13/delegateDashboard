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
import {
  activityById,
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
import {
  alreadyAssigned,
  assignedToScrambleInGroups,
  personsShouldBeInRound,
} from '../../../lib/persons';
import { byName } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import {
  bulkAddPersonAssignment,
  bulkRemovePersonAssignment,
  updateRoundChildActivities,
} from '../../../store/actions';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import PersonsAssignmentsDialog from '../../shared/PersonsAssignmentsDialog';
import PersonsDialog from '../../shared/PersonsDialog';
import ConfigureGroupCountsDialog from './ConfigureGroupCountsDialog';
import ConfigureScramblersDialog from './ConfigureScramblersDialog';
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
  const [configureScramblersDialog, setConfigureScramblersDialog] = useState(false);
  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] = useState(false);
  const [showPersonsDialog, setShowPersonsDialog] = useState({
    open: false,
    title: undefined,
    persons: [],
  });
  const [showPersonsAssignmentsDialog, setShowPersonsAssignmentsDialog] = useState(false);
  const activityCode = `${eventId}-r${roundNumber}`;
  const wcif = useSelector((state) => state.wcif);
  const round = wcif.events.find((event) => event.id === eventId)?.rounds[roundNumber - 1];

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

  /**
   * This determines if the group counts have been determined.
   * This must be done first prior to all assignments
   */

  // TODO: Switch to storing group data in round extension
  //const groupsData = roundActivities?.map(getGroupData);
  const groupsData = getExtensionData('groups', round);

  const groups = groupActivitiesByRound(wcif, activityCode);

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        return (
          byGroupNumber(groupA, groupB) ||
          groupA.parent.room.name.localeCompare(groupB.parent.room.name)
        );
      }),
    [groups]
  );

  const registeredPersonsForEvent = wcif.persons.filter(
    ({ registration }) =>
      registration?.status === 'accepted' && registration.eventIds.indexOf(eventId) > -1
  );

  const personsAssigned = useMemo(
    () =>
      wcif.persons.filter((p) =>
        p.assignments.find((a) => {
          const activity = activityById(wcif, a.activityId);
          if (!activity) {
            console.error("Can't find activity for activityId ", a.activityId);
          }
          return (
            activity.activityCode.split('-')[0] === activityCode.split('-')[0] &&
            activity.activityCode.split('-')[1] === activityCode.split('-')[1]
          ); // TODO IMPROVE
        })
      ),
    [activityCode, wcif]
  );

  const personsAssignedToCompeteOrJudge = useMemo(
    () =>
      wcif.persons.filter((p) =>
        p.assignments.find((a) => {
          const activity = activityById(wcif, a.activityId);
          if (!activity) {
            console.error("Can't find activity for activityId ", a.activityId);
            return false;
          }
          return (
            activity.activityCode.split('-')[0] === activityCode.split('-')[0] &&
            activity.activityCode.split('-')[1] === activityCode.split('-')[1] &&
            ['competitor', 'staff-judge'].indexOf(a.assignmentCode) > -1
          );
        })
      ).length,
    [activityCode, wcif]
  );

  const onGenerateGroupActitivites = () => {
    // determine who needs assignments
    // pick groups for them
    // assign their judging assignment to be the group after

    // This creates a *sorted* list of groupActivityIds by stage
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

    const assignments = [];

    // start with scramblers
    const scramblers = personsAssigned
      // Filter to persons with scrambling assignments in this round
      .filter(assignedToScrambleInGroups(groups))
      .map((p) => {
        // determine scrambling assignment
        const assignedScramblingActivities = p.assignments
          .filter(
            (a) =>
              groups.some((g) => g.id === a.activityId) && a.assignmentCode === 'staff-scrambler'
          )
          .map(({ activityId }) => groups.find((g) => activityId === g.id));
        const assignedScramblingActivityGroupNumbers = assignedScramblingActivities.map(
          ({ activityCode }) => parseActivityCode(activityCode).groupNumber
        );

        const minGroupNumber = Math.min(...assignedScramblingActivityGroupNumbers);
        const minGroupIndex = assignedScramblingActivityGroupNumbers.indexOf(minGroupNumber);

        return {
          registrantId: p.registrantId,
          activity: assignedScramblingActivities[minGroupIndex],
        };
      });

    assignments.push(
      ...scramblers.map((s) =>
        createGroupAssignment(s.registrantId, previousGroupForActivity(s.activity).id, 'competitor')
      )
    );

    // Now for other non-scrambler staff
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

      registeredPersonsForEvent
        .filter((person) => person.roles.some((role) => role.indexOf('delegate') > -1))
        .filter(alreadyAssigned(assignments))
        .forEach(assignOrganizersOrStaff);

      registeredPersonsForEvent
        .filter((person) => person.roles.some((role) => role.indexOf('organizer') > -1))
        .filter(alreadyAssigned(assignments))
        .forEach(assignOrganizersOrStaff);
    }

    const nextGroupToAssign = () => {
      // determine smallest group
      const groupSizes = groups.map(computeGroupSizes(assignments));
      const min = Math.min(...groupSizes.map((i) => i.size));
      const smallestGroupActivity = groupSizes.find((g) => g.size === min).activity;
      const nextGroup = nextGroupForActivity(smallestGroupActivity);

      return {
        competing: smallestGroupActivity.id,
        judging: nextGroup.id,
      };
    };

    const assignPerson = (person) => {
      const nextGroupActivity = nextGroupToAssign();

      assignments.push({
        registrantId: person.registrantId,
        assignment: {
          assignmentCode: 'competitor',
          activityId: nextGroupActivity.competing,
          stationNumber: null,
        },
      });

      assignments.push({
        registrantId: person.registrantId,
        assignment: {
          assignmentCode: 'staff-judge',
          activityId: nextGroupActivity.judging,
          stationNumber: null,
        },
      });
    };

    const findPR = (personalBests, type) =>
      personalBests.find((pr) => pr.eventId === eventId && pr.type === type);

    const byResult = (result) => (a, b) =>
      findPR(b.personalBests, result).best - findPR(a.personalBests, result).best;

    const everyoneElse = personsShouldBeInRound(wcif, round).filter(alreadyAssigned(assignments));

    const firstTimers = everyoneElse.filter((p) => !p.wcaId).sort(byName); // Everyone without a wca id
    const noSingleInEvent = everyoneElse
      .filter((p) => p.wcaId && !p.personalBests.find((pr) => pr.eventId === eventId))
      .sort(byName); // everyone with no single
    const noAverageInEvent = everyoneElse
      .filter(
        (p) => p.wcaId && !findPR(p.personalBests, 'average') && findPR(p.personalBests, 'single')
      )
      .sort(byName)
      .sort(byResult('single')); // everyone with no average
    const hasResults = everyoneElse
      .filter((p) => p.wcaId && findPR(p.personalBests, 'average'))
      .sort(byName)
      .sort(byResult('average'));

    firstTimers.forEach(assignPerson);
    noSingleInEvent.forEach(assignPerson);
    noAverageInEvent.forEach(assignPerson);
    hasResults.forEach(assignPerson);

    dispatch(bulkAddPersonAssignment(assignments));
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
          bulkRemovePersonAssignment([
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
          bulkRemovePersonAssignment([
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

  const onAssignStaff = () => {
    setConfigureScramblersDialog(true);
  };

  if (roundActivities.length === 0) {
    return <div>No Activities found</div>;
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
    } else if (groups.length > 0 && personsAssignedToCompeteOrJudge === 0) {
      return (
        <>
          <Button onClick={onAssignStaff}>Pick Scramblers</Button>
          <Button onClick={onGenerateGroupActitivites}>
            Assign Competitor and Judging Assignments
          </Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetGroupActitivites}>
            Reset Group Activities
          </Button>
        </>
      );
    } else if (personsAssignedToCompeteOrJudge > 0) {
      return (
        <Button onClick={onResetGroupNonScramblingActitivites}>
          Reset Non-scrambling Assignments
        </Button>
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
                      persons: personsShouldBeInRound(wcif, round)?.sort(byName) || [],
                      title: 'People who should be in the round',
                    })
                  }>
                  {personsShouldBeInRound(wcif, round)?.length || '???'}
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
      <ConfigureScramblersDialog
        open={configureScramblersDialog}
        onClose={() => setConfigureScramblersDialog(false)}
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
        persons={personsShouldBeInRound(wcif, round)}
        roundId={round.id}
        onClose={() => setShowPersonsAssignmentsDialog(false)}
      />
    </Grid>
  );
};

export default RoundPage;
