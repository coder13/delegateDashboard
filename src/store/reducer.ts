import { findAndReplaceActivity } from '../lib/domain/activities';
import { type ValidationError } from '../lib/wcif';
import {
  setActivityConfigExtensionData,
  setRoundConfigExtensionData,
} from '../lib/wcif/extensions';
import type { Extension } from '../lib/wcif/extensions/types';
import { ActionType } from './actions';
import type {
  Action,
  AddPersonPayload,
  EditActivityPayload,
  FetchingWcifPayload,
  PartialUpdateWcifPayload,
  ReduxAction,
  SetCompetitionsPayload,
  TogglePersonRolePayload,
  UpdateGlobalExtensionPayload,
  UpdateGroupCountPayload,
  UpdateRawObjPayload,
  UpdateRoundActivitiesPayload,
  UpdateRoundChildActivitiesPayload,
  UpdateRoundExtensionDataPayload,
  UpdateRoundPayload,
  UpdateWcifPayload,
  UploadingWcifPayload,
} from './actions';
import INITIAL_STATE, { type AppState } from './initialState';
import * as Reducers from './reducers';
import type {
  Activity,
  Room,
  Venue,
  Competition,
  Person,
  Assignment,
  Round,
  Event,
} from '@wca/helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReducerFunction = (state: AppState, action: any) => AppState;

const reducers: Record<string, ReducerFunction> = {
  // Fetching and updating wcif
  [ActionType.FETCHING_COMPETITIONS]: (state) => ({
    ...state,
    fetchingCompetitions: true,
  }),
  [ActionType.SET_ERROR_FETCHING_COMPS]: (state, action: { error?: Error }) => ({
    ...state,
    fetchingCompetitions: false,
    fetchingCompetitionsError: 'error' in action ? action.error : undefined,
  }),
  [ActionType.SET_COMPETITIONS]: (state, action: SetCompetitionsPayload) => ({
    ...state,
    fetchingCompetitions: false,
    competitions: 'competitions' in action ? action.competitions : state.competitions,
  }),
  [ActionType.FETCHING_WCIF]: (state, action: FetchingWcifPayload) => ({
    ...state,
    fetchingWCIF: 'fetching' in action ? action.fetching : state.fetchingWCIF,
  }),
  [ActionType.FETCHED_WCIF]: (state, action: UpdateWcifPayload) => ({
    ...state,
    needToSave: false,
    changedKeys: new Set(),
    fetchingWCIF: false,
    wcif: 'wcif' in action ? action.wcif : state.wcif,
  }),
  [ActionType.UPDATE_WCIF_ERRORS]: (
    state,
    action: { errors: ValidationError[]; replace?: boolean }
  ) => ({
    ...state,
    errors:
      'errors' in action && 'replace' in action
        ? action.replace
          ? action.errors
          : [...state.errors, ...action.errors]
        : state.errors,
  }),
  [ActionType.UPLOADING_WCIF]: (state, action: UploadingWcifPayload) => ({
    ...state,
    fetchingWCIF: 'uploading' in action ? action.uploading : state.fetchingWCIF,
    needToSave: 'uploading' in action ? action.uploading : state.needToSave,
    changedKeys: 'uploading' in action && action.uploading ? state.changedKeys : new Set(),
  }),
  [ActionType.PARTIAL_UPDATE_WCIF]: (state, action: PartialUpdateWcifPayload) => {
    if (!('wcif' in action)) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([
        ...state.changedKeys,
        ...(Object.keys(action.wcif) as Array<keyof Competition>),
      ]),
      wcif: state.wcif
        ? {
            ...state.wcif,
            ...action.wcif,
          }
        : null,
    };
  },
  // Editing person data
  [ActionType.TOGGLE_PERSON_ROLE]: (state, action: TogglePersonRolePayload) => {
    if (!('registrantId' in action && 'roleId' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons']),
      wcif: {
        ...state.wcif,
        persons: state.wcif.persons.map((person) => {
          if (person.registrantId === action.registrantId) {
            const currentRoles = person.roles || [];
            return {
              ...person,
              roles:
                currentRoles.indexOf(action.roleId) > -1
                  ? currentRoles.filter((role) => role !== action.roleId)
                  : [...currentRoles, action.roleId],
            };
          }
          return person;
        }),
      },
    };
  },
  [ActionType.ADD_PERSON]: (state, action: AddPersonPayload) => {
    if (!('person' in action) || !state.wcif) return state;
    const { person } = action;

    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons']),
      wcif: {
        ...state.wcif,
        persons: [...state.wcif.persons.filter((i) => i.wcaUserId !== person.wcaUserId), person],
      },
    };
  },
  // Editing assignments
  [ActionType.ADD_PERSON_ASSIGNMENTS]: Reducers.addPersonAssignments,
  [ActionType.REMOVE_PERSON_ASSIGNMENTS]: Reducers.removePersonAssignments,
  [ActionType.UPSERT_PERSON_ASSIGNMENTS]: Reducers.upsertPersonAssignments,
  [ActionType.BULK_ADD_PERSON_ASSIGNMENTS]: Reducers.bulkAddPersonAssignments,
  [ActionType.BULK_REMOVE_PERSON_ASSIGNMENTS]: Reducers.bulkRemovePersonAssignments,
  [ActionType.BULK_UPSERT_PERSON_ASSIGNMENTS]: Reducers.bulkUpsertPersonAssignments,
  // Editing group information
  [ActionType.UPDATE_GROUP_COUNT]: (state, action: UpdateGroupCountPayload) => {
    if (!('activityId' in action && 'groupCount' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'schedule']),
      wcif: state.wcif && {
        ...state.wcif,
        venues: state.wcif.schedule.venues.map((venue: Venue) => ({
          ...venue,
          rooms: venue.rooms.map((room: Room) => ({
            ...room,
            activities: room.activities.map((activity: Activity) => {
              if (activity.id === action.activityId) {
                return setActivityConfigExtensionData(activity, {
                  groupCount: action.groupCount,
                });
              }

              return activity;
            }),
          })),
        })),
      },
    };
  },
  [ActionType.UPDATE_ROUND_CHILD_ACTIVITIES]: (
    state,
    action: UpdateRoundChildActivitiesPayload
  ) => {
    if (!('activityId' in action && 'childActivities' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'schedule']),
      wcif: state.wcif && {
        ...state.wcif,
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
  },
  [ActionType.UPDATE_ROUND_ACTIVITIES]: (state, action: UpdateRoundActivitiesPayload) => {
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
  },
  [ActionType.UPDATE_ROUND]: (state, action: UpdateRoundPayload) => {
    if (!('roundId' in action && 'roundData' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'events']),
      wcif: state.wcif && {
        ...state.wcif,
        events: state.wcif.events.map((event: Event) => ({
          ...event,
          rounds: event.rounds.map((round: Round) =>
            round.id === action.roundId ? action.roundData : round
          ),
        })),
      },
    };
  },
  [ActionType.RESET_ALL_GROUP_ASSIGNMENTS]: (state) => {
    if (!state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons']),
      wcif: {
        ...state.wcif,
        persons: state.wcif.persons.map((person: Person) => ({
          ...person,
          assignments: [],
        })),
      },
    };
  },
  [ActionType.GENERATE_ASSIGNMENTS]: Reducers.generateAssignments,
  [ActionType.EDIT_ACTIVITY]: (state, action: EditActivityPayload) => {
    if (!('where' in action && 'what' in action) || !state.wcif) return state;
    const { where, what } = action;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons', 'schedule']),
      wcif: state.wcif && {
        ...state.wcif,
        schedule: {
          ...state.wcif.schedule,
          venues: state.wcif.schedule.venues.map((venue) => ({
            ...venue,
            rooms: venue.rooms.map((room) => ({
              ...room,
              activities: room.activities.map(findAndReplaceActivity(where, what)),
            })),
          })),
        },
        persons:
          what.id !== undefined && where.id !== undefined && what.id !== where.id
            ? state.wcif.persons.map((person: Person) => ({
                ...person,
                assignments: person.assignments?.map((assignment: Assignment) => {
                  if (assignment.activityId === where.id) {
                    return {
                      ...assignment,
                      activityId:
                        typeof what.id === 'number' ? what.id : parseInt(String(what.id), 10),
                    };
                  }

                  return assignment;
                }),
              }))
            : state.wcif.persons,
      },
    };
  },
  [ActionType.UPDATE_ROUND_EXTENSION_DATA]: (state, action: UpdateRoundExtensionDataPayload) => {
    if (!('activityCode' in action && 'extensionData' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'events']),
      wcif: state.wcif && {
        ...state.wcif,
        events: state.wcif.events.map((event) => ({
          ...event,
          rounds: event.rounds.map((round) => {
            if (round.id === action.activityCode) {
              return setRoundConfigExtensionData(round, action.extensionData);
            }

            return round;
          }),
        })),
      },
    };
  },
  [ActionType.UPDATE_GLOBAL_EXTENSION]: (state, action: UpdateGlobalExtensionPayload) => {
    if (!('extensionData' in action) || !state.wcif) return state;
    const { extensionData } = action;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'extensions']),
      wcif: {
        ...state.wcif,
        extensions: [
          ...state.wcif.extensions.filter(
            (e) => (e as Extension).id !== (extensionData as Extension).id
          ),
          extensionData as Extension,
        ],
      },
    };
  },
  [ActionType.UPDATE_RAW_OBJ]: (state, action: UpdateRawObjPayload) => {
    if (!('key' in action && 'value' in action) || !state.wcif) return state;
    const { key, value } = action;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, key]),
      wcif: {
        ...state.wcif,
        [key]: value,
      },
    };
  },
};

function reducer<T extends Action, P extends object>(
  state: AppState = INITIAL_STATE,
  action: ReduxAction<T, P>
): AppState {
  if (reducers[action.type]) {
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
