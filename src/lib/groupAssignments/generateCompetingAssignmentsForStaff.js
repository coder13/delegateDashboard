import { parseActivityCode } from '../activities';
import { createGroupAssignment, previousGroupForActivity } from '../groups';
import { createArbitraryGroupAssignmentStrategy } from './helpers';

export const generateCompetingAssignmentsForStaff = createArbitraryGroupAssignmentStrategy({
  computePersons: ({
    state,
    round,
    queries: { personsShouldBeInRound, hasStaffAssignment, missingCompetitorAssignments },
  }) => personsShouldBeInRound.filter(hasStaffAssignment).filter(missingCompetitorAssignments),

  /**
   * Determines the soonest group that this person is assigned
   * @param {Person} person
   * @return {Activity}
   */
  getSoonestAssignedActivity: ({ person, groups, findAssignments, isStaffAssignment }) => {
    const assignedStaffActivities = findAssignments(person, isStaffAssignment);
    if (assignedStaffActivities.length === 0) {
      return;
    }
    // XXX: Observed bug where competitor assignments may not be created for some competitors
    // Where this is the case, the competitor has a staff assignments in group 1

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
  },

  computeAssignments: ({
    persons,
    assignments,
    getSoonestAssignedActivity,
    queries: { groups, findAssignments, isStaffAssignment },
  }) => {
    // eslint-disable-next-line
    console.log(`Generating Competing assignments for ${persons.length} staff`, persons);

    persons.forEach((person) => {
      const soonestActivity = getSoonestAssignedActivity({
        person,
        groups,
        findAssignments,
        isStaffAssignment,
      });
      if (!soonestActivity) {
        return;
      }

      const competingActivity = previousGroupForActivity(soonestActivity);
      assignments.push(
        createGroupAssignment(person.registrantId, competingActivity.id, 'competitor')
      );
    });

    return assignments;
  },
});
