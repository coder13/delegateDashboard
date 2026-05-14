import { byPROrResult, findRoundActivitiesById, parseActivityCode } from '../domain';
import { isCompetitorAssignment, missingCompetitorAssignments } from '../domain';
import { personsShouldBeInRound } from '../domain';
import { type InProgressAssignmment } from '../types';
import { byName } from '../utils';
import { createGroupAssignment } from '../wcif';
import { type Competition } from '@wca/helpers';

/**
 * Assigns all persons in a round directly to the attempt-level activity,
 * without creating sub-groups. Used for 333fm and 333mbf events where
 * Groupifier expects competitor assignments at the attempt level
 * (e.g., 333fm-r1-a1) rather than at a sub-group level (e.g., 333fm-r1-a1-g1).
 */
export const generateAssignmentsForRoundAttempt = (
  wcif: Competition,
  attemptActivityCode: string
) => {
  const { eventId, roundNumber } = parseActivityCode(attemptActivityCode);
  if (!eventId || !roundNumber) {
    console.error('Unable to parse attempt activity code:', attemptActivityCode);
    return;
  }

  const roundId = `${eventId}-r${roundNumber}`;

  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === roundId);

  if (!event || !round) {
    console.error('Unable to find event or round for attempt activity code:', attemptActivityCode);
    return;
  }

  const attemptActivities = findRoundActivitiesById(wcif, attemptActivityCode);
  const attemptActivityIds = attemptActivities.map((a) => a.id);

  if (!attemptActivityIds.length) {
    console.error(
      'No attempt activities found in schedule for attempt activity code:',
      attemptActivityCode
    );
    return;
  }

  const allExistingCompetitorAssignments: Record<number, number> = {};
  for (const id of attemptActivityIds) {
    allExistingCompetitorAssignments[id] = 0;
  }

  const nextAttemptActivityId = (assignments: InProgressAssignmment[]): number => {
    const counts: Record<number, number> = assignments
      .filter(
        (a) =>
          isCompetitorAssignment(a.assignment) &&
          attemptActivityIds.includes(a.assignment.activityId)
      )
      .reduce(
        (sizes, { assignment }) => ({
          ...sizes,
          [assignment.activityId]: (sizes[assignment.activityId] || 0) + 1,
        }),
        { ...allExistingCompetitorAssignments }
      );

    const sorted = Object.keys(counts)
      .map((id) => ({ id, size: counts[+id] }))
      .sort((a, b) => +a.id - +b.id)
      .sort((a, b) => a.size - b.size);

    return +sorted[0].id;
  };

  return (assignments: InProgressAssignmment[]): InProgressAssignmment[] => {
    const persons = personsShouldBeInRound(round)(wcif.persons)
      .filter(missingCompetitorAssignments({ assignments, groupIds: attemptActivityIds }))
      .sort(byName)
      .sort(byPROrResult(event, roundNumber));

    return persons.reduce(
      (acc, person) => [
        ...acc,
        createGroupAssignment(
          person.registrantId,
          nextAttemptActivityId([...acc, ...assignments]),
          'competitor'
        ),
      ],
      [] as InProgressAssignmment[]
    );
  };
};
