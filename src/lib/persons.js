import { parseActivityCode } from './activities';
import { roundFormatById } from './events';

/**
 * @param {Person} person
 */
export const acceptedRegistration = (person) => person.registration?.status === 'accepted';

export const registeredForEvent =
  (eventId) =>
  ({ registration }) =>
    registration.eventIds.indexOf(eventId) > -1;

/**
 * Determines if a person is a delegate / trainee-delegate / organizer
 */
export const isOrganizerOrDelegate = (person) =>
  person.roles.some((role) => ['delegate', 'trainee-delegate', 'organizer'].includes(role));

/**
 * Returns a filtered list of people who's registration has been accepted
 */
export const acceptedRegistrations = (persons) => persons.filter(acceptedRegistration);

/**
 * Returns a list of people who's registration has been accepted and they registered for the specified event
 */
export const personsRegistered = (persons, eventId) => {
  return acceptedRegistrations(persons).filter(registeredForEvent(eventId));
};

/**
 * Returns the people that should be in the round based on either registration counts
 * or the actual people in the round
 * @returns {[Person]} - List of persons that should be in the round
 */
export const personsShouldBeInRound = (persons, round) => {
  // This is the single biggest souce of truth
  if (round.results.length) {
    return persons.filter((person) =>
      round.results.some((result) => person.registrantId === result.personId)
    );
  }

  const { eventId, roundNumber } = parseActivityCode(round.id);

  if (roundNumber === 1) {
    return personsRegistered(persons, eventId);
  } else {
    // Everything that follows is estimations
    // const event = wcif.events.find((i) => i.id === eventId);
    // const previousRound = event.rounds[roundNumber - 2];
    // const advancementCondition = previousRound?.advancementCondition;
    // if (previousRound.results.length === 0) {
    //   return null;
    // }
    // return advancingCompetitors(
    //   advancementCondition,
    //   previousRound.results.length || personsShouldBeInRound(wcif, previousRound).length
    // );

    // WCA Live will be the single source of truth for who's in the next round
    // until I care enough to compute the actual list of people who might make it
    return [];
  }
};

/**
 * To be used with wcif data
 * @param {[Activity]} groups - list of groups to filter person assignments to
 */
export const assignedInGroupsForRoles = (groups, test) => (person) =>
  person.assignments.some(
    (a) => groups.some((g) => g.id === a.activityId) && test(a.assignmentCode) > -1
  );

/**
 * Not to be used with wcif data
 * @param {[Assignment]} assignments - Returns true if a competitor has a competitor assignment
 */
export const hasCompetitorAssignment = (assignments) => (person) =>
  assignments.some(
    (a) => a.registrantId === person.registrantId && a.assignment.assignmentCode === 'competitor'
  );

/**
 * Not to be used with wcif data
 * @param {[Assignment]} assignments - Returns true if a competitor has a competitor assignment
 */
export const hasJudgingAssignment = (assignments) => (person) =>
  assignments.some(
    (a) => a.registrantId === person.registrantId && a.assignment.assignmentCode === 'staff-judge'
  );

export const findPR = (personalBests, eventId, type) =>
  personalBests.find((pr) => pr.eventId === eventId && pr.type === type);

/**
 * Comparator for array.sort
 * TODO: cleanup
 * @param {Result} result
 * @param {EventId} eventId
 * @param {'single' | 'average'} type
 * @returns {(a: Person, b: Person) => number}
 */
export const byPsychsheet = (eventId) => (a, b) => {
  if (!a.wcaId && b.wcaId) {
    return 1;
  } else if (a.wcaId && !b.wcaId) {
    return -1;
  } else if (!a.wcaId && !b.wcaId) {
    return 0;
  }

  const aPRs = a.personalBests.filter((pr) => pr.eventId === eventId);
  const bPRs = b.personalBests.filter((pr) => pr.eventId === eventId);

  if (!aPRs.length && bPRs.length) {
    return 1;
  } else if (aPRs.length && !bPRs.length) {
    return -1;
  } else if (!aPRs.length && !bPRs.length) {
    return 0;
  }

  const aSingle = findPR(aPRs, eventId, 'single');
  const bSingle = findPR(bPRs, eventId, 'single');
  const aAverage = findPR(aPRs, eventId, 'average');
  const bAverage = findPR(bPRs, eventId, 'average');

  if (!aAverage && bAverage) {
    return 1;
  } else if (aAverage && !bAverage) {
    return -1;
  } else if (aAverage && bAverage) {
    return aAverage.worldRanking - bAverage.worldRanking;
  }

  // If we get here, we know that both competitors have a single
  if (aSingle && bSingle) {
    return aSingle.worldRanking - bSingle.worldRanking;
  }
};

/**
 * Comparator for array.sort
 * Sorts people by their ranking in the round
 * @param {*} results
 * @returns
 */
export const byResult = (results) => (a, b) => {
  const aResult =
    results.find((r) => r.personId === a.registrantId)?.ranking || Number.MAX_SAFE_INTEGER;
  const bResult =
    results.find((r) => r.personId === b.registrantId)?.ranking || Number.MAX_SAFE_INTEGER;

  return aResult - bResult;
};

/**
 * "Scores" People's results or PRs and sorts differently depending on roundNumber.
 * People's scores
 * @param {Event} event
 * @param {ActivityCode} roundId
 * @param {Result[]} roundResults
 * @returns
 */
export const byPROrResult = (event, roundNumber) => (personA, personB) => {
  if (roundNumber === 1) {
    return byPsychsheet(event.id)(personA, personB);
  }

  const previousRound = event.rounds.find(
    (r) => parseActivityCode(r.id).roundNumber === roundNumber - 1
  );

  if (!previousRound.results?.length) {
    return 0;
  }

  return byResult(previousRound.results)(personA, personB);
};

export const findResultFromRound = (wcif, roundId, personId) => {
  const { eventId } = parseActivityCode(roundId);

  const event = wcif.events.find((e) => e.id === eventId);
  const round = event.rounds.find((r) => r.id === roundId);

  if (!round) {
    return;
  }

  const { format, results } = round;
  const roundFormat = roundFormatById(format);

  if (results.length === 0) {
    return;
  }

  const result = results.find((r) => r.personId === personId);

  if (!result) {
    return;
  }

  const rankingResult = (roundFormat.rankingResult === 'average' && result.average) || result.best;

  return {
    ...result,
    rankingResult: rankingResult,
  };
};

/**
 * Returns the seed result for a person based on the round
 * Will be an average if it exists if not a single
 * @param {*} wcif
 * @param {*} activityCode
 * @returns
 */
export const getSeedResult = (wcif, activityCode, person) => {
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const roundId = `${eventId}-r${roundNumber}`;
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event.rounds.find((r) => r.id === roundId);
  const roundFormat = roundFormatById(round.format);

  // if activity is round 1, then return pr result
  if (roundNumber === 1) {
    const pr =
      roundFormat.rankingResult === 'average'
        ? findPR(person.personalBests, eventId, 'average') ||
          findPR(person.personalBests, eventId, 'single')
        : findPR(person.personalBests, eventId, 'single');

    if (!pr) {
      return;
    }

    return {
      ...pr,
      ranking: pr.worldRanking,
      rankingResult: pr.best,
    };
  }

  return findResultFromRound(wcif, `${eventId}-r${roundNumber - 1}`, person.registrantId);
};

export const addAssignmentsToPerson = (person, assignments) => {
  return {
    ...person,
    assignments: [...person.assignments, ...assignments],
  };
};

export const removeAssignmentsFromPerson = (person, activityId) => {
  return {
    ...person,
    assignments: person.assignments.filter((a) => a.activityId !== activityId),
  };
};

/**
 * Upserts the list of assignments for a person
 * For each assignment passed in, it removes the existing assignments matching the activityId
 * and replaces them with the updated version of the assignment
 * @param {*} param0
 * @returns
 */
export const upsertAssignmentsOnPerson = (person, assignments) => {
  return {
    ...person,
    assignments: [
      ...person.assignments.filter(
        (a) => !assignments.some((a2) => a2.activityId === a.activityId)
      ),
      ...assignments,
    ],
  };
};
