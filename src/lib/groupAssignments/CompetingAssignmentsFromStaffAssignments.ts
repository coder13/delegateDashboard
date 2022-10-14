import { Event } from '@wca/helpers';
import { findGroupActivitiesByRound } from '../activities';
import {
  hasStaffAssignment,
  InProgressAssignment,
  missingCompetitorAssignments,
} from '../assignments';
import { createGroupAssignment } from '../groups';
import { personsShouldBeInRound } from '../persons';
import { GroupGenerator } from './GroupGenerator';
import { getSoonestAvailableActivity } from './helpers';

const CompetingAssignmentsForStaffGenerator: GroupGenerator = {
  id: 'CompetingAssignmentsFromStaffAssignments',
  name: 'Competing Assignments From Staff Assignments',
  description: 'Generates competing assignments from pre-existing staff assignments',

  validate: () => true,
  generate: (wcif, roundActivityCode) => {
    const event = wcif.events.find((e) => roundActivityCode.startsWith(e.id)) as Event;
    const round = event.rounds?.find((r) => r.id === roundActivityCode);

    if (!round) {
      return;
    }

    const groups = findGroupActivitiesByRound(wcif, roundActivityCode);
    const groupIds = groups.map((g) => g.id);

    const persons = personsShouldBeInRound(round)(wcif.persons)
      .filter(hasStaffAssignment({ groupIds }))
      .filter(missingCompetitorAssignments({ groupIds }));

    if (!persons.length) {
      return;
    }

    // eslint-disable-next-line
    console.log(`Generating Competing assignments for ${persons.length} staff`, persons);

    return (): InProgressAssignment[] =>
      persons
        .map((person) => {
          const soonestActivity = getSoonestAvailableActivity(groups)(person);

          if (!soonestActivity) {
            console.error('Could not find soonest available activity for person', person);
            return null;
          }

          return createGroupAssignment(person.registrantId, soonestActivity.id, 'competitor');
        })
        .filter(Boolean) as InProgressAssignment[];
  },
};

export default CompetingAssignmentsForStaffGenerator;
