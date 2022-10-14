import { Event } from '@wca/helpers';
import { findGroupActivitiesByRound, parseActivityCode } from '../activities';
import {
  findCompetingAssignment,
  hasCompetitorAssignment,
  InProgressAssignment,
  missingStaffAssignments,
} from '../assignments';
import { createGroupAssignment, nextGroupForActivity } from '../groups';
import { isOrganizerOrDelegate, personsShouldBeInRound } from '../persons';
import { GroupGenerator } from './GroupGenerator';

const JudgeAssignmentsFromCompetingAssignments: GroupGenerator = {
  id: 'JudgeAssignmentsFromCompetingAssignments',
  name: 'Judge Assignments From Competing Assignments',
  description:
    "Generates judging assignments for competitors, who don't have any staff assignments, that follow directly after their competing assignments.",

  validate: () => true,
  generate: (wcif, roundActivityCode) => {
    const { roundNumber } = parseActivityCode(roundActivityCode);
    const event = wcif.events.find((e) => roundActivityCode.startsWith(e.id)) as Event;
    const round = event.rounds?.find((r) => r.id === roundActivityCode);
    const groups = findGroupActivitiesByRound(wcif, roundActivityCode);
    const groupIds = groups.map((g) => g.id);

    if (!event || !round || !roundNumber) {
      // Likely shouldn't popup but need this check to make typescript happy
      return;
    }

    return (assignments) => {
      const personFilterContext = { assignments, groupIds };

      const persons = personsShouldBeInRound(round)(wcif.persons)
        .filter(hasCompetitorAssignment(personFilterContext))
        .filter(missingStaffAssignments(personFilterContext))
        .filter((p) => !isOrganizerOrDelegate(p));

      // eslint-disable-next-line
      console.log(`Generating judging assignments for ${persons.length} competitors`, persons);

      return persons
        .map((person) => {
          const competingAssignment = findCompetingAssignment(personFilterContext)(person)?.[0];
          if (!competingAssignment) {
            throw new Error(
              `No competing assignment for competitor that should have competing assignment: ${person.name}`
            );
          }

          // Get competing group activity Id
          const competingAssignmentActivityId = competingAssignment?.activityId;

          // Get groupActivity from the id
          const groupActivity = groups.find((g) => +competingAssignmentActivityId === g.id);

          if (!groupActivity) {
            console.error(
              `No group activity found for competing assignment activity id: ${competingAssignmentActivityId}`
            );
            return null;
          }

          // simply compute the next group based on the activity
          const nextGroup = nextGroupForActivity(groupActivity);

          if (!nextGroup) {
            console.error('Could not compute group activity for person', person);
            return null;
          }

          return createGroupAssignment(person.registrantId, nextGroup.id, 'staff-judge');
        })
        .filter(Boolean) as InProgressAssignment[];
    };
  },
};

export default JudgeAssignmentsFromCompetingAssignments;
