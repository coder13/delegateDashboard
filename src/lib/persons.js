import { parseActivityCode } from './activities';

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
export const personsShouldBeInRound = (wcif, round) => {
  // This is the single biggest souce of truth
  if (round.results.length) {
    return wcif.persons.filter((person) =>
      round.results.some((result) => person.registrantId === result.personId)
    );
  }

  const { eventId, roundNumber } = parseActivityCode(round.id);

  if (roundNumber === 1) {
    return personsRegistered(wcif.persons, eventId);
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
 * @param {[Activity]} groups - list of groups to filter person assignments to
 */
export const assignedInGroupsForRoles = (groups, roles) => (person) =>
  person.assignments.some(
    (a) => groups.some((g) => g.id === a.activityId) && roles.indexOf(a.assignmentCode) > -1
  );

/**
 * @param {[Assignment]} assignments - List of assignments to check if a person is already assigned
 */
export const alreadyAssigned = (assignments) => (person) =>
  !assignments.find(
    (a) => a.registrantId === person.registrantId && a.assignment.assignmentCode === 'competitor'
  );
