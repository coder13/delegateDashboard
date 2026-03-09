import { parseActivityCode } from './activities';
import {
  type Activity,
  type Assignment,
  type Event,
  type EventId,
  type Person,
  type PersonalBest,
  type RankingType,
  type Result,
  type Round,
} from '@wca/helpers';

/**
 * @param {Person} person
 */
export const acceptedRegistration = (person: Person) => person.registration?.status === 'accepted';

export const registeredForEvent =
  (eventId: EventId) =>
  ({ registration }: Person) =>
    !!registration?.eventIds?.length && registration.eventIds.indexOf(eventId) > -1;

/**
 * Determines if a person is a delegate / trainee-delegate / organizer
 */
export const isOrganizerOrDelegate = (person: Person) =>
  person.roles?.some((role) => ['delegate', 'trainee-delegate', 'organizer'].includes(role));

/**
 * Returns a filtered list of people who's registration has been accepted
 */
export const acceptedRegistrations = (persons: Person[]) => persons.filter(acceptedRegistration);

/**
 * Returns a list of people who's registration has been accepted and they registered for the specified event
 */
export const personsRegistered = (persons: Person[], eventId: EventId) => {
  return acceptedRegistrations(persons).filter(registeredForEvent(eventId));
};

export const shouldBeInRound = (round: Round) => {
  // This is the single biggest souce of truth
  if (round.results?.length) {
    return (person: Person) =>
      round.results?.some((result) => person.registrantId === result.personId);
  }

  const { eventId, roundNumber } = parseActivityCode(round.id);

  if (roundNumber === 1) {
    return (person: Person) => acceptedRegistration(person) && registeredForEvent(eventId)(person);
  } else {
    // WCA Live will be the single source of truth for who's in the next round
    // until I care enough to compute the actual list of people who might make it
    return () => false;
  }
};

/**
 * Returns the people that should be in the round based on either registration counts
 * or the actual people in the round
 * @returns {[Person]} - List of persons that should be in the round
 */
export const personsShouldBeInRound = (round: Round) => (persons: Person[]) =>
  persons.filter(shouldBeInRound(round));

/**
 * To be used with wcif data
 * @param {[Activity]} groups - list of groups to filter person assignments to
 */
export const assignedInGroupsForRoles =
  (groups: Activity[], test: (assignment: Assignment) => boolean) => (person: Person) =>
    person.assignments?.some((a) => groups.some((g) => g.id === +a.activityId) && test(a));

export const findPR = (personalBests: PersonalBest[], eventId: EventId, type: RankingType) =>
  personalBests.find((pr) => pr.eventId === eventId && pr.type === type);

/**
 * Comparator for array.sort
 * TODO: cleanup
 * @param {Result} result
 * @param {EventId} eventId
 * @param {'single' | 'average'} type
 * @returns {(a: Person, b: Person) => number}
 */
export const byPsychsheet =
  (eventId: EventId) =>
  (a: Person, b: Person): number => {
    if (!a.wcaId && b.wcaId) {
      return 1;
    } else if (a.wcaId && !b.wcaId) {
      return -1;
    } else if (!a.wcaId && !b.wcaId) {
      return 0;
    }

    const aPRs = a.personalBests?.filter((pr) => pr.eventId === eventId) || [];
    const bPRs = b.personalBests?.filter((pr) => pr.eventId === eventId) || [];

    if (!aPRs?.length && bPRs?.length) {
      return 1;
    } else if (aPRs?.length && !bPRs?.length) {
      return -1;
    } else if (!aPRs?.length && !bPRs?.length) {
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

    return 0;
  };

/**
 * Comparator for array.sort
 * Sorts people by their ranking in the round
 * @param {*} results
 * @returns
 */
export const byResult = (results: Result[]) => (a: Person, b: Person) => {
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
export const byPROrResult =
  (event: Event, roundNumber: number) => (personA: Person, personB: Person) => {
    if (roundNumber === 1) {
      return byPsychsheet(event.id)(personA, personB);
    }

    // previousRound *will* be defined because we're not in round 1
    const previousRound = event.rounds?.find(
      (r) => parseActivityCode(r.id).roundNumber === roundNumber - 1
    ) as Round;

    if (!previousRound.results?.length) {
      return 0;
    }

    return byResult(previousRound.results)(personA, personB);
  };

export const addAssignmentsToPerson = (person: Person, assignments: Assignment[]) => {
  return {
    ...person,
    assignments: [...(person.assignments || []), ...assignments],
  };
};

export const removeAssignmentsFromPerson = (person: Person, activityId: number) => {
  return {
    ...person,
    assignments: person.assignments?.filter((a) => +a.activityId !== activityId) || [],
  };
};

/**
 * Upserts the list of assignments for a person
 * For each assignment passed in, it removes the existing assignments matching the activityId
 * and replaces them with the updated version of the assignment
 * @param {*} param0
 * @returns
 */
export const upsertAssignmentsOnPerson = (person: Person, assignments: Assignment[]): Person => {
  return {
    ...person,
    assignments: [
      ...(person.assignments?.filter(
        (a) => !assignments.some((a2) => a2.activityId === a.activityId)
      ) || []),
      ...assignments,
    ],
  };
};

export const mayMakeTimeLimit = (eventId: EventId, round?: Round, persons?: Person[]): Person[] => {
  const timeLimit = round?.timeLimit;
  if (!timeLimit) {
    return [];
  }

  return (
    persons?.filter((person) => {
      const PR = findPR(person.personalBests || [], eventId, 'single');
      if (!PR) {
        return false;
      }

      return PR.best <= timeLimit.centiseconds;
    }) || []
  );
};

export const mayMakeCutoff = (eventId: EventId, round?: Round, persons?: Person[]): Person[] => {
  const cutoff = round?.cutoff;
  if (!cutoff) {
    return [];
  }

  return (
    persons?.filter((person) => {
      const PR = findPR(person.personalBests || [], eventId, 'average');
      if (!PR) {
        return false;
      }

      return PR.best <= cutoff.attemptResult;
    }) || []
  );
};

// Re-export WCIF person functions for backward compatibility
export { findResultFromRound, getSeedResult, type SeedResult } from '../wcif/persons';
