import {
  allActivities,
  groupActivitiesByRound,
  parseActivityCode,
  roomByActivity,
} from '../../lib/activities';
import {
  computeGroupSizes,
  createGroupAssignment,
  nextGroupForActivity,
  previousGroupForActivity,
} from '../../lib/groups';
import { byResult, findPR, findResultFromRound, hasCompetitorAssignment } from '../../lib/persons';
import { byName } from '../../lib/utils';
import { getExtensionData } from '../../lib/wcif-extensions';
import { selectPersonsShouldBeInRound } from '../selectors';
import { bulkAddPersonAssignments } from './competitorAssignments';

/**
 * TODO: Create a setting for this
 * This is an *opinion*
 */
const SORT_ORGANIZATION_STAFF_IN_LAST_GROUPS = true;

export function generateAssignments(state, action) {
  return {
    ...state,
    ...bulkAddPersonAssignments(state, {
      assignments: generateGroupActitivites(state, action.roundId),
    }),
  };
}

/**
 * Fills in assignment gaps. Everyone should end up having a competitor assignment and staff assignment
 * 1. Start with giving out competitor assignments.
 *   1a Start with assigning competitor assignments to people who are already assigned to staff
 *   1b Assign organizers and delegates their competing assignments, don't assign  staff assignments
 *   1c Then hand out competitor assignments to people who are not assigned to staff
 *
 * 2. Then give out judging assignments to competitors without staff assignments
 */
const generateGroupActitivites = (state, activityCode) => {
  const { wcif } = state;
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event.rounds.find((r) => r.id === activityCode);

  const groupsData = getExtensionData('groups', round);

  const _allActivities = allActivities(wcif);

  // list of each stage's round activity
  const roundActivities = _allActivities
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

  const groups = groupActivitiesByRound(wcif, activityCode);

  const personsShouldBeInRound = selectPersonsShouldBeInRound(state, round);

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

    assignments.push(createGroupAssignment(person.registrantId, nextGroupActivityId, 'competitor'));
  };

  const hasNoSingleInRound = (person) => {
    if (roundNumber === 1) {
      return person.wcaId && !person.personalBests.find((pr) => pr.eventId === eventId);
    }

    const previousRound = event.rounds[roundNumber - 2];
    const previousRoundResults = previousRound.results.find(
      (i) => i.personId === person.registrantId
    );

    return !previousRoundResults;
  };

  const hasNoAverageInRound = (person) => {
    if (roundNumber === 1) {
      return (
        person.wcaId &&
        !findPR(person.personalBests, eventId, 'average') &&
        findPR(person.personalBests, eventId, 'single')
      );
    }

    const previousRound = event.rounds[roundNumber - 2];
    const previousRoundResults = previousRound.results.find(
      (i) => i.personId === person.registrantId
    );

    if (!previousRoundResults) {
      return true;
    }

    if (previousRoundResults.average <= -1) {
      return true;
    }
  };

  const hasAverageInRound = (person) => {
    if (roundNumber === 1) {
      return person.wcaId && findPR(person.personalBests, eventId, 'average');
    }

    const previousRound = event.rounds[roundNumber - 2];
    const previousRoundResults = previousRound.results.find(
      (i) => i.personId === person.registrantId
    );

    if (!previousRoundResults) {
      return false;
    }

    if (previousRoundResults.average > 0) {
      return false;
    }
  };

  // Assign competitors assignments to those missing competitor assignments

  if (roundNumber === 1) {
    const everyoneElse = personsShouldBeInRound.filter(missingCompetitorAssignments);

    const firstTimers = everyoneElse.filter((p) => !p.wcaId).sort(byName); // Everyone without a wca id
    const noSingleInEvent = everyoneElse.filter(hasNoSingleInRound).sort(byName); // everyone with no single
    const noAverageInEvent = everyoneElse
      .filter(hasNoAverageInRound)
      .sort(byName)
      .sort(byResult('single', eventId)); // everyone with no average
    const hasResults = everyoneElse
      .filter(hasAverageInRound)
      .sort(byName)
      .sort(byResult('average', eventId));

    console.log(firstTimers, noSingleInEvent, noAverageInEvent, hasResults);

    firstTimers.forEach(assignCompeting);
    noSingleInEvent.forEach(assignCompeting);
    noAverageInEvent.forEach(assignCompeting);
    hasResults.forEach(assignCompeting);
  } else {
    const everyoneElse = personsShouldBeInRound
      .filter(missingCompetitorAssignments)
      .sort((a, b) => {
        const aResults = findResultFromRound(
          wcif,
          `${eventId}-r${roundNumber - 1}`,
          a.registrantId
        );
        const bResults = findResultFromRound(
          wcif,
          `${eventId}-r${roundNumber - 1}`,
          b.registrantId
        );

        if (!aResults) {
          // b is better
          return 1;
        } else if (!bResults) {
          // a is better
          return -1;
        } else {
          return aResults.ranking - bResults.ranking;
        }
      });

    everyoneElse.forEach(assignCompeting);
  }

  // assign remaining judging assignments to those missing judging assignments

  personsShouldBeInRound
    .filter(hasCompetitorAssignment)
    .filter((p) => !hasStaffAssignment(p)) // should be similar to everyoneElse
    .forEach((person) => {
      if (
        person.roles.some((role) => role.indexOf('delegate') > -1 || role.indexOf('organizer') > -1)
      ) {
        return;
      }

      const competingAssignment = findAssignments(person, isCompetitorAssignment)[0];
      if (!competingAssignment) {
        console.error(
          'No competing assignment for competitor that should have competing assignment',
          person
        );
        return;
      }
      const competingAssignmentActivityId =
        competingAssignment?.assignment?.activityId || competingAssignment?.activityId;

      const groupActivity = groups.find((g) => competingAssignmentActivityId === g.id);

      const nextGroup = nextGroupForActivity(groupActivity);

      assignments.push(createGroupAssignment(person.registrantId, nextGroup.id, 'staff-judge'));
    });

  return assignments;
};
