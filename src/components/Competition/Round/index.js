import { useConfirm } from 'material-ui-confirm';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardActions,
  CardContent,
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
} from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
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
  isOrganizerOrDelegate,
  personsShouldBeInRound,
} from '../../../lib/persons';
import { getExtensionData } from '../../../lib/wcif-extensions';
import {
  bulkAddPersonAssignment,
  bulkRemovePersonAssignment,
  updateRoundChildActivities,
} from '../../../store/actions';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
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
  const [configureScramblersDialog, setConfigureScramblersDialog] =
    useState(false);
  const [configureGroupCountsDialog, setConfigureGroupCountsDialog] =
    useState(false);
  const activityCode = `${eventId}-r${roundNumber}`;
  const wcif = useSelector((state) => state.wcif);
  const round = wcif.events.find((event) => event.id === eventId)?.rounds[
    roundNumber - 1
  ];

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
        const roomDiff = groupA.parent.room.name.localeCompare(
          groupB.parent.room.name
        );
        if (roomDiff === 0) {
          return byGroupNumber(groupA, groupB);
        } else {
          return roomDiff;
        }
      }),
    [groups]
  );

  const registeredPersonsForEvent = wcif.persons.filter(
    ({ registration }) =>
      registration.status === 'accepted' &&
      registration.eventIds.indexOf(eventId) > -1
  );

  const unassignedRegisteredPersons = registeredPersonsForEvent.filter(
    ({ assignments }) =>
      !assignments.some((assignment) =>
        _allActivities.find(({ id }) => id === assignment.activityId)
      )
  );

  const personsAssigned = useMemo(
    () =>
      wcif.persons.filter((p) =>
        p.assignments.find((a) => {
          const activity = activityById(wcif, a.activityId);
          if (!activity) {
            console.error("Can't find activity for activityId ", a.activityId);
            return false;
          }
          return (
            activity.activityCode.split('-')[0] ===
              activityCode.split('-')[0] &&
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
            activity.activityCode.split('-')[0] ===
              activityCode.split('-')[0] &&
            activity.activityCode.split('-')[1] ===
              activityCode.split('-')[1] &&
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

    const previousGroupForActivity = (activity) => {
      const groupCount = activity.parent.childActivities.length;
      const previousGroupNumber =
        ((parseActivityCode(activity.activityCode).groupNumber -
          2 +
          groupCount) %
          groupCount) +
        1;
      const previousGroup = activity.parent.childActivities.find(
        (g) =>
          parseActivityCode(g.activityCode).groupNumber === previousGroupNumber
      );
      return previousGroup;
    };

    const assignments = [];

    // start with scramblers
    const scramblers = personsAssigned
      // Filter to persons with scrambling assignments in this round
      .filter((p) =>
        p.assignments.some(
          (a) =>
            groups.some((g) => g.id === a.activityId) &&
            a.assignmentCode === 'staff-scrambler'
        )
      )
      .map((p) => {
        // determine scrambling assignment
        const assignedScramblingActivities = p.assignments
          .filter(
            (a) =>
              groups.some((g) => g.id === a.activityId) &&
              a.assignmentCode === 'staff-scrambler'
          )
          .map(({ activityId }) => groups.find((g) => activityId === g.id));
        const assignedScramblingActivityGroupNumbers =
          assignedScramblingActivities.map(
            ({ activityCode }) => parseActivityCode(activityCode).groupNumber
          );

        const minGroupNumber = Math.min(
          ...assignedScramblingActivityGroupNumbers
        );
        const minGroupIndex =
          assignedScramblingActivityGroupNumbers.indexOf(minGroupNumber);

        return {
          registrantId: p.registrantId,
          activity: assignedScramblingActivities[minGroupIndex],
        };
      });

    assignments.push(
      ...scramblers.map((s) => ({
        registrantId: s.registrantId,
        assignment: {
          assignmentCode: 'competitor',
          activityId: previousGroupForActivity(s.activity).id,
          stationNumber: null,
        },
      }))
    );

    const isAlreadyAssigned = (person) =>
      !assignments.find(
        (a) =>
          a.registrantId === person.registrantId &&
          a.assignment.assignmentCode === 'competitor'
      );

    // Now for other non-scrambler staff
    if (SORT_ORGANIZATION_STAFF_IN_LAST_GROUPS) {
      let currentGroupPointer = groupActivityIds[0].length - 1; // start with the last group

      const assignOrganizersOrStaff = (person) => {
        const stagesInGroup = groupActivityIds
          .map((g) => g[currentGroupPointer])
          .map((activity) => ({
            activity: activity,
            size: assignments.filter(
              ({ assignment }) =>
                assignment.activityId === activity.id &&
                assignment.assignmentCode === 'competitor'
            ).length,
          }));

        const min = Math.min(...stagesInGroup.map((i) => i.size));
        const smallestGroupActivity = stagesInGroup.find(
          (g) => g.size === min
        ).activity;

        debugger;

        assignments.push({
          registrantId: person.registrantId,
          assignment: {
            assignmentCode: 'competitor',
            activityId: smallestGroupActivity,
            stationNumber: null,
          },
        });

        // decrement and loop
        currentGroupPointer =
          (currentGroupPointer + groupActivityIds.length - 1) %
          groupActivityIds.length;
      };

      registeredPersonsForEvent
        .filter((person) =>
          person.roles.some((role) => role.indexOf('delegate') > -1)
        )
        .filter(isAlreadyAssigned)
        .forEach(assignOrganizersOrStaff);

      registeredPersonsForEvent
        .filter((person) =>
          person.roles.some((role) => role.indexOf('organizer') > -1)
        )
        .filter(isAlreadyAssigned)
        .forEach(assignOrganizersOrStaff);
    }

    const everyoneElse = personsShouldBeInRound(
      wcif.persons,
      activityCode
    ).filter(isAlreadyAssigned);

    const nextGroupToAssign = () => {
      // determine smallest group
      const groupSizes = groups.map((activity) => ({
        activity: activity,
        size: assignments.filter(
          ({ assignment }) =>
            assignment.activityId === activity.id &&
            assignment.assignmentCode === 'competitor'
        ).length,
      }));
      const min = Math.min(...groupSizes.map((i) => i.size));
      const smallestGroupActivity = groupSizes.find(
        (g) => g.size === min
      ).activity;
      const { groupNumber } = parseActivityCode(
        smallestGroupActivity.activityCode
      );
      const nextGroupNumber =
        (groupNumber % smallestGroupActivity.parent.childActivities.length) + 1;
      const nextGroup = smallestGroupActivity.parent.childActivities.find(
        (g) => parseActivityCode(g.activityCode).groupNumber === nextGroupNumber
      );

      return {
        competing: smallestGroupActivity.id,
        judging: nextGroup.id,
      };
    };

    everyoneElse.forEach((person) => {
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
    });

    dispatch(bulkAddPersonAssignment(assignments));
  };

  const onResetGroupActitivites = () => {
    confirm({
      description:
        'Do you really want to reset all group activities in this round?',
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
      description:
        'Do you really want to reset all group activities in this round?',
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
          {/* <Button onClick={onCreateGroupActivities}>Create Group Activities from Config</Button> */}
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
          <List
            dense
            subheader={<ListSubheader id="stages">Stages</ListSubheader>}
          >
            {roundActivities.map(({ startTime, endTime, room }) => (
              <ListItemButton>
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
                <TableCell>Round Size</TableCell>
                <TableCell>Persons In Round</TableCell>
                <TableCell>Assigned Persons</TableCell>
                <TableCell>
                  Groups Configured <br />
                  (per stage)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {personsShouldBeInRound(wcif.persons, activityCode).length}
                </TableCell>
                <TableCell>{round.results.length}</TableCell>
                <TableCell>{personsAssigned.length}</TableCell>
                <TableCell>{groupsData.groups}</TableCell>
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
    </Grid>
  );
};

export default RoundPage;
