import {
  findActivityById,
  activityCodeIsChild,
  parseActivityCode,
  findRooms,
} from '../lib/domain/activities';
import { acceptedRegistrations, personsShouldBeInRound } from '../lib/domain/persons';
import { type AppState } from './initialState';
import { type Activity, type Event, type Person, type Round, type Room } from '@wca/helpers';
import { createSelector } from 'reselect';

const selectWcif = (state: AppState) => state.wcif;

export const selectWcifRooms = createSelector(selectWcif, (wcif): Room[] =>
  wcif ? findRooms(wcif) : []
);

/**
 * Return a filtered array of all persons who's registration is defined and status is `accepted`
 */
export const selectAcceptedPersons = createSelector(selectWcif, (wcif): Person[] =>
  acceptedRegistrations(wcif?.persons || [])
);

/**
 * @example
 * ```
 * selectRoundById(state, activityCode)
 * ```
 */
export const selectRoundById = createSelector(
  [selectWcif],
  (wcif) =>
    (roundActivityId: string): Round | undefined => {
      const { eventId } = parseActivityCode(roundActivityId);
      const event = wcif?.events.find((event) => event.id === eventId);
      return event?.rounds.find((r) => r.id === roundActivityId);
    }
);

/**
 * @example
 * ```
 * selectEventByActivityCode(state, activityCode)
 * ```
 */
export const selectEventByActivityCode = createSelector(
  [selectWcif, (_: AppState, activityCode: string) => activityCode],
  (wcif, activityCode): Event | undefined => {
    const { eventId } = parseActivityCode(activityCode);
    return wcif?.events.find((event) => event.id === eventId);
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
  [selectWcif, (_: AppState, activityId: number) => activityId],
  (wcif) =>
    (id: number): Activity | null =>
      wcif ? findActivityById(wcif, id) : null
);

export const selectPersonsAssignedForRound = createSelector(
  [selectWcif, selectAcceptedPersons, (_: AppState, roundId: string) => roundId],
  (wcif, acceptedPersons, roundId: string): Person[] => {
    return acceptedPersons.filter((p) =>
      p.assignments?.find((a) => {
        const activity = wcif ? findActivityById(wcif, a.activityId) : null;

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
  [selectWcif, selectAcceptedPersons, (_: AppState, roundId: string) => roundId],
  (wcif, acceptedPersons, roundId: string): Person[] => {
    return acceptedPersons.filter((p) =>
      p.assignments?.find((a) => {
        const activity = wcif ? findActivityById(wcif, a.activityId) : null;

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
  (acceptedPersons) =>
    (round: Round): Person[] =>
      personsShouldBeInRound(round)(acceptedPersons)
);

/**
 * Return a list of persons who are assigned to the given activity
 */
export const selectPersonsAssignedToActivitiyId = createSelector(
  [selectAcceptedPersons, (_: AppState, activityId: number) => activityId],
  (persons, activityId): Person[] =>
    persons.filter(({ assignments }) => assignments?.some((a) => a.activityId === activityId))
);

/**
 * Return a filtered array of persons who are first-timers (no WCA ID)
 */
export const selectFirstTimers = createSelector(
  selectAcceptedPersons,
  (acceptedPersons): Person[] => acceptedPersons.filter((p) => !p.wcaId)
);

/**
 * Return group activities for a specific round
 * @example
 * ```
 * selectGroupActivitiesByRound(state, '333-r1')
 * ```
 */
export const selectGroupActivitiesByRound = createSelector(
  [selectWcif, (_: AppState, roundId: string) => roundId],
  (wcif, roundId): Activity[] => {
    if (!wcif) return [];

    const findGroupActivities = (activities: Activity[]): Activity[] => {
      return activities.flatMap((activity) => {
        if (activity.activityCode === roundId && activity.childActivities) {
          return activity.childActivities;
        }
        if (activity.childActivities) {
          return findGroupActivities(activity.childActivities);
        }
        return [];
      });
    };

    const rooms = findRooms(wcif);
    return rooms.flatMap((room) => findGroupActivities(room.activities));
  }
);
