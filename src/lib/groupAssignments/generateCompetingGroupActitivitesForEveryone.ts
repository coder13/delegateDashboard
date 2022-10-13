import { Competition, Event } from '@wca/helpers';
import { findGroupActivitiesByRound, parseActivityCode } from '../activities';
import {
  InProgressAssignment,
  isCompetitorAssignment,
  missingCompetitorAssignments,
} from '../assignments';
import { createGroupAssignment } from '../groups';
import { byPROrResult, personsShouldBeInRound } from '../persons';
import { byName } from '../utils';

export const generateCompetingGroupActitivitesForEveryone = (
  wcif: Competition,
  roundActivityCode: string
) => {
  const { roundNumber } = parseActivityCode(roundActivityCode);
  const event = wcif.events.find((e) => roundActivityCode.startsWith(e.id)) as Event;
  const round = event.rounds?.find((r) => r.id === roundActivityCode);
  const groups = findGroupActivitiesByRound(wcif, roundActivityCode);
  const groupIds = groups.map((g) => g.id);

  if (!event || !round || !roundNumber) {
    // Likely shouldn't popup but need this check to make typescript happy
    return;
  }
  const personsInRound = personsShouldBeInRound(round)(wcif.persons);

  const allExistingCompetiorAssignments = {};

  for (const group of groups) {
    allExistingCompetiorAssignments[group.id] = 0;
  }

  personsInRound.reduce((sizes, person) => {
    const competingAssignment = person.assignments?.find(
      (a) => groupIds.includes(+a.activityId) && isCompetitorAssignment(a)
    );

    return {
      ...sizes,
      ...(competingAssignment
        ? { [competingAssignment.activityId]: sizes[+competingAssignment.activityId] + 1 }
        : {}),
    };
  }, {});

  const nextGroupActivityIdToAssign = (assignments: InProgressAssignment[]) => {
    const groupSizes = assignments
      .filter((a) => isCompetitorAssignment(a.assignment))
      .reduce((sizes, { assignment }) => {
        return {
          ...sizes,
          [assignment.activityId]: (sizes[assignment.activityId] || 0) + 1,
        };
      }, allExistingCompetiorAssignments);

    const sortedGroups = Object.keys(groupSizes)
      .map((activityId) => ({
        activityId,
        size: groupSizes[activityId],
      }))
      .sort((a, b) => +a.activityId - +b.activityId)
      .sort((a, b) => a.size - b.size);

    if (!sortedGroups.length) {
      throw new Error('No groups found!');
    }

    return +sortedGroups[0].activityId;
  };

  return (assignments: InProgressAssignment[]): InProgressAssignment[] => {
    const persons = personsShouldBeInRound(round)(wcif.persons)
      .filter(missingCompetitorAssignments({ assignments, groupIds }))
      .sort(byName)
      .sort(byPROrResult(event, roundNumber));

    // eslint-disable-next-line
    console.log(`Generating Competing assignments for ${persons.length} competitors`, persons);

    return persons.reduce(
      (acc, person) => [
        ...acc,
        createGroupAssignment(
          person.registrantId,
          nextGroupActivityIdToAssign([...acc, ...assignments]),
          'competitor'
        ),
      ],
      [] as InProgressAssignment[]
    );
  };
};
