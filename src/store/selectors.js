import { createSelector } from 'reselect';
import { activityById, parseActivityCode, rooms } from '../lib/activities';
import { acceptedRegistrations, personsShouldBeInRound } from '../lib/persons';

const selectWcif = (state) => state.wcif;

export const selectWcifRooms = createSelector(selectWcif, (wcif) => rooms(wcif));

/**
 * Return a filtered array of all persons who's registration is defined and status is `accepted`
 */
export const selectAcceptedPersons = createSelector(selectWcif, (wcif) =>
  acceptedRegistrations(wcif.persons)
);

export const selectRoundById = createSelector(
  [selectWcif, (_, roundId) => parseActivityCode(roundId)],
  (wcif, parsedRoundId) =>
    wcif.events
      .find((event) => event.id === parsedRoundId.eventId)
      .rounds.find((r) => {
        const { roundNumber } = parseActivityCode(r.id);
        return parsedRoundId.roundNumber === roundNumber;
      })
);

export const selectActivityById = createSelector(
  [selectWcif, (_, activityId) => activityId],
  (wcif) => (id) => activityById(wcif, id)
);

export const selectPersonsAssignedForRound = createSelector(
  [selectAcceptedPersons, selectActivityById, (_, roundId) => roundId],
  (acceptedPersons, selectActivityById, roundId) => {
    const parsedRoundId = parseActivityCode(roundId);
    return acceptedPersons.filter((p) =>
      p.assignments.find((a) => {
        const activity = selectActivityById(a.activityId);

        if (!activity) {
          console.error(`Can't find activity for activityId ${a.activityId}`);
          return false;
        }

        const parsedActivityCode = parseActivityCode(activity.activityCode);

        return (
          parsedActivityCode.eventId === parsedRoundId.eventId &&
          parsedActivityCode.roundNumber === parsedRoundId.roundNumber
        );
      })
    );
  }
);

export const selectPersonsShouldBeInRound = createSelector(
  [selectAcceptedPersons, (_, round) => round],
  (acceptedPersons, round) => personsShouldBeInRound(acceptedPersons, round)
);

/**
 * Return a list of persons who are assigned to the given activity
 */
export const selectPersonsAssignedToActivitiyId = createSelector(
  [selectAcceptedPersons, (_, activityId) => activityId],
  (persons, activityId) =>
    persons.filter(({ assignments }) => assignments.some((a) => a.activityId === activityId))
);
