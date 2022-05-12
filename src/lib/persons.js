import { parseActivityCode } from "./activities";

/**
 * @param {Person} person
 */
export const acceptedRegistration = (person) => person.registration.status === 'accepted';

export const registeredForEvent = (eventId) => ({ registration }) => registration.eventIds.indexOf(eventId) > -1

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
  return acceptedRegistrations(persons)
    .filter(registeredForEvent(eventId));
};

/**
 * Returns the people that should be in the round
 */
export const personsShouldBeInRound = (wcif, activityCode) => {
  const parsedActivity = parseActivityCode(activityCode);
  if (parsedActivity.roundNumber === 1) {
    return personsRegistered(wcif, parsedActivity.eventId);
  }

  return [];
};

