import { selectPersonsShouldBeInRound } from '../../store/selectors';
import { createGroupAssignment, nextGroupForActivity } from '../groups';
import { hasCompetitorAssignment } from '../persons';
import { createArbitraryGroupAssignmentStrategy } from './helpers';

export const generateJudgeAssignmentsFromCompetingAssignments =
  createArbitraryGroupAssignmentStrategy({
    computePersons: ({ state, round, queries: { hasStaffAssignment } }) =>
      selectPersonsShouldBeInRound(state, round)
        .filter(hasCompetitorAssignment)
        .filter((p) => !hasStaffAssignment(p)), // should be similar to everyoneElse

    computeAssignments: ({
      persons,
      assignments,
      queries: { groups, findAssignments, isCompetitorAssignment },
    }) => {
      persons.forEach((person) => {
        if (
          person.roles.some(
            (role) => role.indexOf('delegate') > -1 || role.indexOf('organizer') > -1
          )
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
    },
  });
