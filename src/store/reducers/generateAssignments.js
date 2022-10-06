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
import { byPROrResult, hasCompetitorAssignment } from '../../lib/persons';
import { byName } from '../../lib/utils';
import { getExtensionData } from '../../lib/wcif-extensions';
import {
  selectEventByActivityCode,
  selectPersonsShouldBeInRound,
  selectRoundById,
} from '../selectors';
import { bulkAddPersonAssignments } from './competitorAssignments';

/**
 * Fills in assignment gaps. Everyone should end up having a competitor assignment and staff assignment
 * 1. Start with giving out competitor assignments.
 *   1a Start with assigning competitor assignments to people who are already assigned to staff
 *   1b Assign organizers and delegates their competing assignments, don't assign  staff assignments
 *   1c Then hand out competitor assignments to people who are not assigned to staff
 *
 * 2. Then give out judging assignments to competitors without staff assignments
 */
export function generateAssignments(state, action) {
  return {
    ...state,
    ...bulkAddPersonAssignments(state, {
      assignments: [
        generateCompetingAssignmentsForStaff,
        generateGroupAssignmentsForDelegatesAndOrganizers,
        generateCompetingGroupActitivitesForEveryone,
        generateJudgeAssignmentsFromCompetingAssignments,
      ].reduce((acc, generateFn) => generateFn(state, action.roundId, acc, action.options), []),
    }),
  };
}

/**
 * Creates query functions to operate on a working array of assignments and the groups
 * @param {*} assignments
 * @param {Activity[]} groupActivities
 * @returns
 */
const createAssignmentQueries = (wcif, activityCode, assignments) => {
  const _allActivities = allActivities(wcif);

  const groups = groupActivitiesByRound(wcif, activityCode);

  // list of each stage's round activity
  const roundActivities = _allActivities
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

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

  return {
    isCurrentGroupActivity,
    hasAssignments,
    findAssignments,
    isCompetitorAssignment,
    isStaffAssignment,
    missingCompetitorAssignments,
    hasStaffAssignment,
    groups,
    groupActivityIds,
    roundActivities,
  };
};

const generateCompetingGroupActitivitesForEveryone = (state, roundActivityCode, assignments) => {
  const round = selectRoundById(state, roundActivityCode);
  const { roundNumber } = parseActivityCode(roundActivityCode);

  const event = selectEventByActivityCode(state, roundActivityCode);
  const personsShouldBeInRound = selectPersonsShouldBeInRound(state, round);

  const { groups, missingCompetitorAssignments } = createAssignmentQueries(
    state.wcif,
    roundActivityCode,
    assignments
  );

  /**
   * Determines the next smallest group that this person can be assigned to
   * @returns {number} activityId
   */
  const nextGroupActivityIdToAssign = () => {
    const groupSizes = groups.map(computeGroupSizes(assignments));
    const min = Math.min(...groupSizes.map((i) => i.size));
    const smallestGroupActivity = groupSizes.find((g) => g.size === min).activity;

    return smallestGroupActivity.id;
  };

  personsShouldBeInRound
    .filter(missingCompetitorAssignments)
    .sort(byName)
    .sort(byPROrResult(event, roundNumber))
    .forEach((person) => {
      debugger;
      assignments.push(
        createGroupAssignment(person.registrantId, nextGroupActivityIdToAssign(), 'competitor')
      );
    });

  return assignments;
};

const generateCompetingAssignmentsForStaff = (state, roundActivityCode, assignments) => {
  const round = selectRoundById(state, roundActivityCode);

  const {
    groups,
    findAssignments,
    isStaffAssignment,
    missingCompetitorAssignments,
    hasStaffAssignment,
  } = createAssignmentQueries(state.wcif, roundActivityCode, assignments);

  /**
   * Determines the soonest group that this person is assigned
   * @param {Person} person
   * @return {Activity}
   */
  const getSoonestAssignedActivity = (person) => {
    const assignedStaffActivities = findAssignments(person, isStaffAssignment);
    if (assignedStaffActivities.length === 0) {
      return;
    }

    // Determine the first group number
    let minGroupNumber = Number.MAX_SAFE_INTEGER;
    let minGroupIndex = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < assignedStaffActivities.length; i++) {
      const assignedStaffActivityId = assignedStaffActivities[i].activityId;
      const assignedStaffActivity = groups.find((g) => g.id === assignedStaffActivityId);
      const groupNumber = parseActivityCode(assignedStaffActivity.activityCode).groupNumber;

      if (groupNumber < minGroupNumber) {
        minGroupNumber = groupNumber;
        minGroupIndex = i;
      }
    }

    const activityId = assignedStaffActivities[minGroupIndex]?.activityId;
    if (!activityId) {
      return;
    }

    return groups.find((g) => activityId === g.id);
  };

  // Step 1
  // start with competitors who have no competitor assignments but have staffing assignments
  selectPersonsShouldBeInRound(state, round)
    .filter((p) => missingCompetitorAssignments(p) && hasStaffAssignment(p))
    // Filter to persons with staff assignments in this round
    .forEach((person) => {
      const soonestActivity = getSoonestAssignedActivity(person);
      if (!soonestActivity) {
        return;
      }

      const competingActivity = previousGroupForActivity(getSoonestAssignedActivity(person));
      assignments.push(
        createGroupAssignment(person.registrantId, competingActivity.id, 'competitor')
      );
    });

  return assignments;
};

const generateGroupAssignmentsForDelegatesAndOrganizers = (
  state,
  roundActivityCode,
  assignments,
  options
) => {
  const { roundNumber } = parseActivityCode(roundActivityCode);
  const event = selectEventByActivityCode(state, roundActivityCode);
  const round = selectRoundById(state, roundActivityCode);
  const { groupActivityIds, missingCompetitorAssignments } = createAssignmentQueries(
    state.wcif,
    roundActivityCode,
    assignments
  );

  const groupsData = getExtensionData('groups', round);

  if (options.sortOrganizationStaffInLastGroups) {
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

    const round = selectRoundById(state, roundActivityCode);
    selectPersonsShouldBeInRound(state, round)
      .filter(missingCompetitorAssignments)
      .filter((person) =>
        person.roles.some((role) => role.indexOf('delegate') > -1 || role.indexOf('organizer') > -1)
      )
      .sort(byName)
      .sort(byPROrResult(event, roundNumber))
      .forEach(assignOrganizersOrStaff);
  }

  return assignments;
};

const generateJudgeAssignmentsFromCompetingAssignments = (
  state,
  roundActivityCode,
  assignments
) => {
  const { findAssignments, groups, isCompetitorAssignment, hasStaffAssignment } =
    createAssignmentQueries(state.wcif, roundActivityCode, assignments);

  const round = selectRoundById(state, roundActivityCode);
  selectPersonsShouldBeInRound(state, round)
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
