import { Activity, Competition, Event, Person } from '@wca/helpers';
import {
  ActivityWithParent,
  byGroupNumber,
  findGroupActivitiesByRound,
  parseActivityCode,
} from '../activities';
import {
  hasStaffAssignment,
  InProgressAssignmment,
  isStaffAssignment,
  missingCompetitorAssignments,
} from '../assignments';
import { createGroupAssignment } from '../groups';
import { personsShouldBeInRound } from '../persons';

/**
 * Determines the soonest group that this person is assigned
 * @param {Person} person
 * @return {Activity}
 */
const getSoonestAvailableActivity = (groups: ActivityWithParent[]) => (person: Person) => {
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

export const generateCompetingAssignmentsForStaff = (
  wcif: Competition,
  roundActivityCode: string
) => {
  const { eventId } = parseActivityCode(roundActivityCode);
  const event = wcif.events.find((e) => e.id === eventId) as Event;
  const round = event.rounds?.find((r) => r.id === roundActivityCode);

  if (!round) {
    console.error('Error finding round', roundActivityCode);
    return;
  }

  const groups = findGroupActivitiesByRound(wcif, roundActivityCode);
  const groupIds = groups.map((g) => g.id);

  const persons = personsShouldBeInRound(round)(wcif.persons)
    .filter(hasStaffAssignment({ groupIds }))
    .filter(missingCompetitorAssignments({ groupIds }));

  if (!persons.length) {
    console.error('No staff to assign competing assignments to');
    return;
  }

  // eslint-disable-next-line
  console.log(`Generating Competing assignments for ${persons.length} staff`, persons);

  return (): InProgressAssignmment[] =>
    persons
      .map((person) => {
        const soonestActivity = getSoonestAvailableActivity(groups)(person);

        if (!soonestActivity) {
          console.error('Could not find soonest available activity for person', person);
          return null;
        }

        return createGroupAssignment(person.registrantId, soonestActivity.id, 'competitor');
      })
      .filter(Boolean) as InProgressAssignmment[];
};
