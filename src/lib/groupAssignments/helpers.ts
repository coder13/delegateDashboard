import { Assignment, Competition, Person } from '@wca/helpers';
import {
  allActivities,
  groupActivitiesByRound,
  parseActivityCode,
  roomByActivity,
} from '../activities';
import { personsShouldBeInRound } from '../persons';
import { getExtensionData } from '../wcif-extensions';

/**
 * Given a state, computes
 * @param {*} computeContext
 * @returns
 */
export const createArbitraryGroupAssignmentStrategy =
  (computeContext) => (state, roundActivityCode, assignments, options) => {
    const { wcif } = state;
    const { eventId } = parseActivityCode(roundActivityCode);
    const event = wcif.events.find((e) => e.id === eventId);
    const round = event.rounds.find((r) => r.id === roundActivityCode);
    const groupsData = getExtensionData('groups', round);

    const { computePersons, computeAssignments, ...rest } = computeContext;

    const contextForContext = {
      state,
      round,
      event,
      groupsData,
      ...parseActivityCode(roundActivityCode),
      assignments,
      queries: createAssignmentQueries(state, roundActivityCode, assignments),
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
export const createAssignmentQueries = (
  state: { wcif: Competition },
  activityCode,
  assignments: { registrantId: number; assignment: Assignment }[]
) => {
  const { wcif } = state;
  const _allActivities = allActivities(wcif);
  const { eventId } = parseActivityCode(activityCode);

  const groups = groupActivitiesByRound(wcif, activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode);

  // list of each stage's round activity
  const roundActivities = _allActivities
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

  // This creates a list of groupActivityIds by stage sorted by group number
  const groupActivityIds: number[][] = roundActivities.map((roundActivity) =>
    roundActivity.childActivities.map((_, index) => {
      const group = groups.find(
        (g) =>
          g.parent.room.name === roundActivity.room.name &&
          parseActivityCode(g.activityCode)?.groupNumber === index + 1
      );

      return group.id;
    })
  );

  const isCurrentGroupActivity = (groupActivityId: number) =>
    groupActivityIds.some((g) => g.includes(groupActivityId));

  type HasAssignmentTest = (assignment: Assignment) => boolean;

  // Checks both already computed assignments and evolving set if any match the test
  const hasAssignments = (p: Person, test: HasAssignmentTest) =>
    Boolean(
      assignments.some((a) => a.registrantId === p.registrantId && test(a.assignment)) ||
        p.assignments?.some((a) => isCurrentGroupActivity(+a.activityId) && test(a))
    );

  // Checks both already computed assignments and evolving set
  const findAssignments = (p: Person, test) => [
    ...assignments.filter((a) => a.registrantId === p.registrantId && test(a.assignment)),
    ...(p.assignments?.filter((a) => isCurrentGroupActivity(+a.activityId) && test(a)) || []),
  ];

  const isCompetitorAssignment: HasAssignmentTest = (assignment) =>
    assignment.assignmentCode === 'competitor';

  const isStaffAssignment: HasAssignmentTest = (assignment) =>
    assignment.assignmentCode.startsWith('staff');

  const missingCompetitorAssignments = (p: Person) => !hasAssignments(p, isCompetitorAssignment);
  const hasStaffAssignment = (p: Person) => hasAssignments(p, isStaffAssignment);

  return {
    personsShouldBeInRound: personsShouldBeInRound(wcif.persons, round),
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
