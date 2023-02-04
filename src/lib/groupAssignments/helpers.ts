import { Activity, Person } from '@wca/helpers';
import { ActivityWithParent, parseActivityCode } from '../activities';
import { isStaffAssignment } from '../assignments';

const groupNumberFromActivityCode = (activityCode: string) => {
  const { groupNumber } = parseActivityCode(activityCode);
  return groupNumber as number;
};

/**
 * Determines the soonest group that this person is assigned
 * @param {Person} person
 * @return {Activity}
 */
export const getSoonestAvailableActivity = (groups: ActivityWithParent[]) => (person: Person) => {
  const assignedStaffAssignments = person.assignments?.filter(isStaffAssignment) || []; // By definition, should have at least one
  const assignedStaffActivities = assignedStaffAssignments
    .map(({ activityId }) => groups.find((g) => g.id === +activityId))
    .filter(Boolean) as Activity[] & { at: (index: number) => Activity };

  const assignedInGroup = new Map<number, Activity>();
  assignedStaffActivities.forEach((a) => {
    const groupNumber = groupNumberFromActivityCode(a.activityCode);
    assignedInGroup.set(groupNumber, a);
  });

  // 1 based number incrementor
  const inc = (x: number) => ((x - 1 - 1 + groups.length) % groups.length) + 1;
  const lastGroupNumber = Math.max(
    ...assignedStaffActivities.map((a) => groupNumberFromActivityCode(a.activityCode))
  );

  let groupNumber = inc(lastGroupNumber);
  let groupsTried = 1;
  while (groupsTried < groups.length) {
    // if they are already assigned
    if (!assignedInGroup.has(groupNumber)) {
      break;
    }
    groupNumber = inc(groupNumber);
    groupsTried++;
  }

  if (groupsTried === groups.length) {
    return null;
  }

  return groups.find((g) => groupNumberFromActivityCode(g.activityCode) === groupNumber);
};
