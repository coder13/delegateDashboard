import { mapIn } from '../../lib/utils';
import type { UpdateRoundActivitiesPayload, UpdateRoundChildActivitiesPayload } from '../actions';
import type { AppState } from '../initialState';
import type { Assignment, Person } from '@wca/helpers';

export const updateRoundChildActivities = (
  state: AppState,
  action: UpdateRoundChildActivitiesPayload
): AppState => {
  if (!('activityId' in action && 'childActivities' in action) || !state.wcif) return state;
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
          if (
            assignment.activityId === action.activityId &&
            action.childActivities.find((ca) => ca.id === assignment.activityId)
          ) {
            const childActivity = action.childActivities.find(
              (ca) => ca.id === assignment.activityId
            );

            if (!childActivity) {
              throw new Error('No child activity found for assignment ' + assignment.activityId);
            }

            return {
              ...assignment,
              activityId: childActivity.id,
            };
          }

          return assignment;
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
