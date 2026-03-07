import { mapIn } from '../../lib/utils';
import type { UpdateRoundActivitiesPayload, UpdateRoundChildActivitiesPayload } from '../actions';
import type { AppState } from '../initialState';
import type { Assignment, Person } from '@wca/helpers';

/**
 * Updates the child activities of a round activity and also updates the assignments of the persons accordingly
 */
export const updateRoundChildActivities = (
  state: AppState,
  action: UpdateRoundChildActivitiesPayload
): AppState => {
  if (!('activityId' in action && 'childActivities' in action) || !state.wcif) return state;
  const existingParentActivity = state.wcif.schedule.venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .find((activity) => activity.id === action.activityId);

  const childActivityIdsByCode = new Map(
    action.childActivities.map((childActivity) => [childActivity.activityCode, childActivity.id])
  );
  const replacementChildActivityIdsByPreviousId = new Map(
    (existingParentActivity?.childActivities ?? [])
      .map((childActivity) => [
        childActivity.id,
        childActivityIdsByCode.get(childActivity.activityCode),
      ])
      .filter(([, nextChildActivityId]) => !!nextChildActivityId)
  );

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule']),
    wcif: state.wcif && {
      ...state.wcif,
      schedule: mapIn(state.wcif.schedule, 'venues', (venue) =>
        mapIn(venue, 'rooms', (room) =>
          mapIn(room, 'activities', (activity) =>
            activity.id === action.activityId
              ? {
                  ...activity,
                  childActivities: action.childActivities,
                }
              : activity
          )
        )
      ),
      persons: state.wcif.persons.map((person: Person) => ({
        ...person,
        assignments: person.assignments?.map((assignment: Assignment) => {
          const nextChildActivityId = replacementChildActivityIdsByPreviousId.get(
            assignment.activityId
          );
          return nextChildActivityId
            ? {
                ...assignment,
                activityId: nextChildActivityId,
              }
            : assignment;
        }),
      })),
    },
  };
};

export const updateRoundActivities = (
  state: AppState,
  action: UpdateRoundActivitiesPayload
): AppState => {
  if (!('activities' in action) || !state.wcif) return state;
  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule']),
    wcif: state.wcif && {
      ...state.wcif,
      schedule: {
        ...state.wcif.schedule,
        venues: state.wcif.schedule.venues.map((venue) => ({
          ...venue,
          rooms: venue.rooms.map((room) => ({
            ...room,
            activities: room.activities.map((activity) => {
              const updatedActivity = action.activities.find((a) => a.id === activity.id);
              return updatedActivity || activity;
            }),
          })),
        })),
      },
    },
  };
};
