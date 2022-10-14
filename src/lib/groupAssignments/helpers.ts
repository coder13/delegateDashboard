import { Activity, Person } from '@wca/helpers';
import { ActivityWithParent, byGroupNumber, parseActivityCode } from '../activities';
import { isStaffAssignment } from '../assignments';

/**
 * Determines the soonest group that this person is assigned
 * @param {Person} person
 * @return {Activity}
 */
export const getSoonestAvailableActivity = (groups: ActivityWithParent[]) => (person: Person) => {
  const assignedStaffAssignments = person.assignments?.filter(isStaffAssignment) || []; // By definition, should have at least one
  const assignedStaffActivities = assignedStaffAssignments
    .map(({ activityId }) => groups.find((g) => g.id === +activityId))
    .filter(Boolean) as Activity[];

  // Filter to groups where the person does not have a staff assignment for the given group number
  return groups
    .filter(
      (g) =>
        !assignedStaffActivities.some(
          (a) =>
            parseActivityCode(g.activityCode).groupNumber ===
            parseActivityCode(a.activityCode).groupNumber
        )
    )
    .sort(byGroupNumber)[0];
};
