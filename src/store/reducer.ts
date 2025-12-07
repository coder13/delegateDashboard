import { findAndReplaceActivity } from '../lib/domain/activities';
import { mapIn } from '../lib/utils/utils';
import { ValidationError } from '../lib/wcif';
import { setExtensionData } from '../lib/wcif/extensions/wcif-extensions';
import {
  Action,
  ActionType,
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
import INITIAL_STATE, { AppState } from './initialState';
import * as Reducers from './reducers';
import { Competition } from '@wca/helpers';

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
      wcif: mapIn(state.wcif, ['schedule', 'venues'], (venue: any) =>
        mapIn(venue, ['rooms'], (room: any) =>
          mapIn(room, ['activities'], (activity: any) => {
            if (activity.id === action.activityId) {
              return setExtensionData('activityConfig', activity, {
                groupCount: action.groupCount,
              });
            }

            return activity;
          })
        )
      ),
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
      wcif: mapIn(state.wcif, ['schedule', 'venues'], (venue) =>
        mapIn(venue, ['rooms'], (room) =>
          mapIn(room, ['activities'], (activity) =>
            activity.id === action.activityId
              ? {
                  ...activity,
                  childActivities: action.childActivities,
                }
              : activity
          )
        )
      ),
    };
  },
  [ActionType.UPDATE_ROUND_ACTIVITIES]: (state, action: UpdateRoundActivitiesPayload) => {
    if (!('activities' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'schedule']),
      wcif: mapIn(state.wcif, ['schedule', 'venues'], (venue: any) =>
        mapIn(venue, ['rooms'], (room: any) =>
          mapIn(
            room,
            ['activities'],
            (activity: any) => action.activities.find((a) => a.id === activity.id) || activity
          )
        )
      ),
    };
  },
  [ActionType.UPDATE_ROUND]: (state, action: UpdateRoundPayload) => {
    if (!('roundId' in action && 'roundData' in action) || !state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'events']),
      wcif: mapIn(state.wcif, ['events'], (event) =>
        mapIn(event, ['rounds'], (round) =>
          round.id === action.roundId ? action.roundData : round
        )
      ),
    };
  },
  [ActionType.RESET_ALL_GROUP_ASSIGNMENTS]: (state) => {
    if (!state.wcif) return state;
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons']),
      wcif: mapIn(state.wcif, ['persons'], (person: any) => ({
        ...person,
        assignments: [],
      })),
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
      wcif: {
        ...state.wcif,
        schedule: mapIn(state.wcif.schedule, ['venues'], (venue: any) =>
          mapIn(venue, ['rooms'], (room: any) => ({
            ...room,
            activities: room.activities.map(findAndReplaceActivity(where, what)),
          }))
        ),
        persons:
          what.id !== undefined && where.id !== undefined && what.id !== where.id
            ? state.wcif.persons.map((person: any) => ({
                ...person,
                assignments: person.assignments?.map((assignment: any) => {
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
      wcif: mapIn(state.wcif, ['events'], (event: any) =>
        mapIn(event, ['rounds'], (round: any) => {
          if (round.id === action.activityCode) {
            return setExtensionData('groups', round, action.extensionData);
          }

          return round;
        })
      ),
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
          ...state.wcif.extensions.filter((e) => e.id === extensionData.id),
          extensionData,
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
