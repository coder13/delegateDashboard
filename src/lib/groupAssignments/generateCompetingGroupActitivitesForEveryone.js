import { computeGroupSizes, createGroupAssignment } from '../groups';
import { byPROrResult } from '../persons';
import { byName } from '../utils';
import { createArbitraryGroupAssignmentStrategy } from './helpers';

export const generateCompetingGroupActitivitesForEveryone = createArbitraryGroupAssignmentStrategy({
  computePersons: ({
    state,
    event,
    round,
    roundNumber,
    queries: { personsShouldBeInRound, missingCompetitorAssignments },
  }) =>
    personsShouldBeInRound
      .filter(missingCompetitorAssignments)
      .sort(byName)
      .sort(byPROrResult(event, roundNumber)),

  nextGroupActivityIdToAssign: ({ groups, assignments }) => {
    const groupSizes = groups.map(computeGroupSizes(assignments));
    const min = Math.min(...groupSizes.map((i) => i.size));
    const smallestGroupActivity = groupSizes.find((g) => g.size === min).activity;

    return smallestGroupActivity.id;
  },

  computeAssignments: ({
    persons,
    assignments,
    nextGroupActivityIdToAssign,
    queries: { groups },
  }) => {
    // eslint-disable-next-line
    console.log(`Generating Competing assignments for ${persons.length} competitors`, persons);

    persons.forEach((person) => {
      assignments.push(
        createGroupAssignment(
          person.registrantId,
          nextGroupActivityIdToAssign({ groups, assignments }),
          'competitor'
        )
      );
    });

    return assignments;
  },
});
