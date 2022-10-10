import { createGroupAssignment } from '../groups';
import { byPROrResult } from '../persons';
import { byName } from '../utils';
import { createArbitraryGroupAssignmentStrategy } from './helpers';

export const generateGroupAssignmentsForDelegatesAndOrganizers =
  createArbitraryGroupAssignmentStrategy({
    computePersons: ({
      state,
      event,
      round,
      roundNumber,
      queries: { personsShouldBeInRound, missingCompetitorAssignments },
    }) =>
      personsShouldBeInRound
        .filter(missingCompetitorAssignments)
        .filter((person) =>
          person.roles.some(
            (role) => role.indexOf('delegate') > -1 || role.indexOf('organizer') > -1
          )
        )
        .sort(byName)
        .sort(byPROrResult(event, roundNumber)),

    computeAssignments: ({ assignments, persons, groupsData, queries: { groupActivityIds } }) => {
      // eslint-disable-next-line
      console.log(
        `Generating Competing assignments for ${persons.length} organizers & delegates`,
        persons
      );

      let currentGroupPointer = groupActivityIds[0].length - 1; // start with the last group
      const assignOrganizersOrStaff = (person) => {
        const stagesInGroup = groupActivityIds
          .map((g) => g[currentGroupPointer])
          .map((activityId) => ({
            activityId: activityId,
            size: assignments.filter(
              ({ assignment }) =>
                assignment.activityId === activityId && assignment.assignmentCode === 'competitor'
            ).length,
          }));

        const min = Math.min(...stagesInGroup.map((i) => i.size));
        const smallestGroupActivityId = stagesInGroup.find((g) => g.size === min).activityId;

        assignments.push(
          createGroupAssignment(person.registrantId, smallestGroupActivityId, 'competitor')
        );

        // decrement and loop
        currentGroupPointer = (currentGroupPointer + groupsData.groups - 1) % groupsData.groups;
      };

      persons.forEach(assignOrganizersOrStaff);
      return assignments;
    },
  });
