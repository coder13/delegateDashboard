import {
  findActivityById,
  activityCodeIsChild,
  parseActivityCode,
  findRooms,
} from '../lib/activities';
import { acceptedRegistrations, personsShouldBeInRound } from '../lib/persons';
import { createSelector } from 'reselect';

const selectWcif = (state) => state.wcif;

export const selectWcifRooms = createSelector(selectWcif, (wcif) => findRooms(wcif));

/**
 * Return a filtered array of all persons who's registration is defined and status is `accepted`
 */
export const selectAcceptedPersons = createSelector(selectWcif, (wcif) =>
  acceptedRegistrations(wcif.persons)
);

/**
 * @example
 * ```
 * selectRoundById(state, activityCode)
 * ```
 */
export const selectRoundById = createSelector([selectWcif], (wcif) => (roundActivityId) => {
  const { eventId } = parseActivityCode(roundActivityId);
  const event = wcif.events.find((event) => event.id === eventId);
  return event.rounds.find((r) => r.id === roundActivityId);
});

/**
 * @example
 * ```
 * selectEventByActivityCode(state, activityCode)
 * ```
 */
export const selectEventByActivityCode = createSelector(
  [selectWcif, (_, activityCode) => activityCode],
  (wcif, activityCode) => {
    const { eventId } = parseActivityCode(activityCode);
    return wcif.events.find((event) => event.id === eventId);
  }
);

/**
 * Selected the activity by activityCode. Searches entire WCIF for it.
 * @example
 * ```
 * selectActivityById(state)(activityCode)
 * ```
 */
export const selectActivityById = createSelector(
  [selectWcif, (_, activityId) => activityId],
  (wcif) => (id) => findActivityById(wcif, id)
);

export const selectPersonsAssignedForRound = createSelector(
  [selectAcceptedPersons, selectActivityById, (_, roundId) => roundId],
  (acceptedPersons, _selectActivityById, roundId) => {
    return acceptedPersons.filter((p) =>
      p.assignments.find((a) => {
        const activity = _selectActivityById(a.activityId);

        if (!activity) {
          console.error(`Can't find activity for activityId ${a.activityId}`);
          return false;
        }

        return activityCodeIsChild(roundId, activity.activityCode);
      })
    );
  }
);

export const selectPersonsHavingCompetitorAssignmentsForRound = createSelector(
  [selectAcceptedPersons, selectActivityById, (_, roundId) => roundId],
  (acceptedPersons, _selectActivityById, roundId) => {
    return acceptedPersons.filter((p) =>
      p.assignments.find((a) => {
        const activity = _selectActivityById(a.activityId);

        if (!activity) {
          console.error(`Can't find activity for activityId ${a.activityId}`);
          return false;
        }

        return (
          a.assignmentCode === 'competitor' && activityCodeIsChild(roundId, activity.activityCode)
        );
      })
    );
  }
);

export const selectPersonsShouldBeInRound = createSelector(
  [selectAcceptedPersons],
  (acceptedPersons) => (round) => personsShouldBeInRound(round)(acceptedPersons)
);

/**
 * Return a list of persons who are assigned to the given activity
 */
export const selectPersonsAssignedToActivitiyId = createSelector(
  [selectAcceptedPersons, (_, activityId) => activityId],
  (persons, activityId) =>
    persons.filter(({ assignments }) => assignments.some((a) => a.activityId === activityId))
);
