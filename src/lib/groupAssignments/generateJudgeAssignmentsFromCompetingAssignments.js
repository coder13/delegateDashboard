import { selectPersonsShouldBeInRound } from '../../store/selectors';
import { createGroupAssignment, nextGroupForActivity } from '../groups';
import { hasCompetitorAssignment, isOrganizerOrDelegate } from '../persons';
import { createArbitraryGroupAssignmentStrategy } from './helpers';

export const generateJudgeAssignmentsFromCompetingAssignments =
  createArbitraryGroupAssignmentStrategy({
    computePersons: ({ state, round, queries: { hasStaffAssignment } }) =>
      selectPersonsShouldBeInRound(state, round)
        .filter(hasCompetitorAssignment)
        .filter((p) => !hasStaffAssignment(p))
        .filter((p) => !isOrganizerOrDelegate(p)),

    computeAssignments: ({
      persons,
      assignments,
      queries: { groups, findAssignments, isCompetitorAssignment },
    }) => {
      // eslint-disable-next-line
      console.log(`Generating judging assignments for ${persons.length} compettors`, persons);

      persons.forEach((person) => {
        const competingAssignment = findAssignments(person, isCompetitorAssignment)[0];
        if (!competingAssignment) {
          console.error(
            'No competing assignment for competitor that should have competing assignment',
            person
          );
          return;
        }

        // Get competing group activity Id
        const competingAssignmentActivityId =
          competingAssignment?.assignment?.activityId || competingAssignment?.activityId;

        // Get groupActivity from the id
        const groupActivity = groups.find((g) => competingAssignmentActivityId === g.id);

        // simply compute the next group based on the activity
        const nextGroup = nextGroupForActivity(groupActivity);

        assignments.push(createGroupAssignment(person.registrantId, nextGroup.id, 'staff-judge'));
      });
      return assignments;
    },
  });
