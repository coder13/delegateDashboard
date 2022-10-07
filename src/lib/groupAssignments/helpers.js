import { selectEventByActivityCode, selectRoundById } from '../../store/selectors';
import {
  allActivities,
  groupActivitiesByRound,
  parseActivityCode,
  roomByActivity,
} from '../activities';
import { getExtensionData } from '../wcif-extensions';

/**
 * Given a state, computes
 * @param {*} computeContext
 * @returns
 */
export const createArbitraryGroupAssignmentStrategy =
  (computeContext) => (state, roundActivityCode, assignments, options) => {
    const round = selectRoundById(state, roundActivityCode);
    const event = selectEventByActivityCode(state, roundActivityCode);
    const groupsData = getExtensionData('groups', round);

    const { computePersons, computeAssignments, ...rest } = computeContext;

    const contextForContext = {
      state,
      round,
      event,
      groupsData,
      ...parseActivityCode(roundActivityCode),
      assignments,
      queries: createAssignmentQueries(state.wcif, roundActivityCode, assignments),
      options,
      ...rest,
    };

    const persons = computePersons(contextForContext);

    if (persons.length === 0) {
      return assignments;
    }

    // We fully intend to return the new assignments in the end
    // Despite this, most assignment strategies require the array
    // to be manipulated in place.
    return computeAssignments({
      ...contextForContext,
      persons,
    });
  };

/**
 * Creates query functions to operate on a working array of assignments and the groups
 * @param {*} assignments
 * @param {Activity[]} groupActivities
 * @returns
 */
export const createAssignmentQueries = (wcif, activityCode, assignments) => {
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
