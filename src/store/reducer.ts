import { findAndReplaceActivity } from '../lib/activities';
import { mapIn } from '../lib/utils';
import { setExtensionData } from '../lib/wcif-extensions';
import { Activity, Person, Venue, Room, Event, Round } from '@wca/helpers';
import {
  SET_COMPETITIONS,
  TOGGLE_PERSON_ROLE,
  FETCHING_WCIF,
  FETCHED_WCIF,
  UPLOADING_WCIF,
  ADD_PERSON_ASSIGNMENTS,
  REMOVE_PERSON_ASSIGNMENTS,
  UPSERT_PERSON_ASSIGNMENTS,
  BULK_ADD_PERSON_ASSIGNMENTS,
  BULK_REMOVE_PERSON_ASSIGNMENTS,
  BULK_UPSERT_PERSON_ASSIGNMENTS,
  UPDATE_WCIF_ERRORS,
  UPDATE_GROUP_COUNT,
  UPDATE_ROUND_ACTIVITIES,
  UPDATE_ROUND_CHILD_ACTIVITIES,
  UPDATE_ROUND_EXTENSION_DATA,
  PARTIAL_UPDATE_WCIF,
  FETCHING_COMPETITIONS,
  SET_ERROR_FETCHING_COMPS,
  RESET_ALL_GROUP_ASSIGNMENTS,
  GENERATE_ASSIGNMENTS,
  EDIT_ACTIVITY,
  UPDATE_GLOBAL_EXTENSION,
  ADD_PERSON,
  UPDATE_ROUND,
  UPDATE_RAW_OBJ,
} from './actions';
import INITIAL_STATE, { AppState } from './initialState';
import * as Reducers from './reducers';

type Action = {
  type: string;
  [key: string]: unknown;
};

type ReducerFunction = (state: AppState, action: Action) => AppState;

const reducers: Record<string, ReducerFunction> = {
  // Fetching and updating wcif
  [FETCHING_COMPETITIONS]: (state) => ({
    ...state,
    fetchingCompetitions: true,
  }),
  [SET_ERROR_FETCHING_COMPS]: (state, { error }) => ({
    ...state,
    fetchingCompetitions: false,
    fetchingCompetitionsError: error,
  }),
  [SET_COMPETITIONS]: (state, action) => ({
    ...state,
    fetchingCompetitions: false,
    competitions: action.competitions,
  }),
  [FETCHING_WCIF]: (state, action) => ({
    ...state,
    fetchingWCIF: action.fetching,
  }),
  [FETCHED_WCIF]: (state, action) => ({
    ...state,
    needToSave: false,
    changedKeys: new Set(),
    fetchingWCIF: action.fetching,
    wcif: action.wcif,
  }),
  [UPDATE_WCIF_ERRORS]: (state, action) => ({
    ...state,
    errors: action.replace ? action.errors : [...state.errors, ...action.errors],
  }),
  [UPLOADING_WCIF]: (state, action) => ({
    ...state,
    fetchingWCIF: action.uploading,
    needToSave: action.uploading,
    changedKeys: action.uploading ? state.changedKeys : new Set(),
  }),
  [PARTIAL_UPDATE_WCIF]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, ...Object.keys(action.wcif)] as any),
    wcif: {
      ...state.wcif,
      ...action.wcif,
    },
  }),
  // Editing person data
  [TOGGLE_PERSON_ROLE]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons'] as any),
    wcif: state.wcif ? {
      ...state.wcif,
      persons: state.wcif.persons.map((person) =>
        person.registrantId === action.registrantId
          ? {
              ...person,
              roles:
                person.roles && person.roles.indexOf(action.roleId) > -1
                  ? person.roles.filter((role) => role !== action.roleId)
                  : [...(person.roles || []), action.roleId],
            }
          : person
      ),
    } : null,
  }),
  [ADD_PERSON]: (state, { person }) => {
    if (!state.wcif) return state;

    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons'] as any),
      wcif: {
        ...state.wcif,
        persons: [...state.wcif.persons.filter((i) => i.wcaUserId !== person.wcaUserId), person],
      },
    };
  },
  // Editing assignments
  [ADD_PERSON_ASSIGNMENTS]: Reducers.addPersonAssignments,
  [REMOVE_PERSON_ASSIGNMENTS]: Reducers.removePersonAssignments,
  [UPSERT_PERSON_ASSIGNMENTS]: Reducers.upsertPersonAssignments,
  [BULK_ADD_PERSON_ASSIGNMENTS]: Reducers.bulkAddPersonAssignments,
  [BULK_REMOVE_PERSON_ASSIGNMENTS]: Reducers.bulkRemovePersonAssignments,
  [BULK_UPSERT_PERSON_ASSIGNMENTS]: Reducers.bulkUpsertPersonAssignments,
  // Editing group information
  [UPDATE_GROUP_COUNT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
    wcif: state.wcif ? mapIn(state.wcif, ['schedule', 'venues'], (venue: Venue) =>
      mapIn(venue, ['rooms'], (room: Room) =>
        mapIn(room, ['activities'], (activity: Activity) => {
          if (activity.id === (action.activityId as number)) {
            return setExtensionData('activityConfig', activity, {
              groupCount: action.groupCount,
            });
          }

          return activity;
        })
      )
    ) : null,
  }),
  [UPDATE_ROUND_CHILD_ACTIVITIES]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
    wcif: state.wcif ? mapIn(state.wcif, ['schedule', 'venues'], (venue: Venue) =>
      mapIn(venue, ['rooms'], (room: Room) =>
        mapIn(room, ['activities'], (activity: Activity) =>
          activity.id === (action.activityId as number)
            ? {
                ...activity,
                childActivities: action.childActivities as Activity[],
              }
            : activity
        )
      )
    ) : null,
  }),
  [UPDATE_ROUND_ACTIVITIES]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
    wcif: state.wcif ? mapIn(state.wcif, ['schedule', 'venues'], (venue: Venue) =>
      mapIn(venue, ['rooms'], (room: Room) =>
        mapIn(
          room,
          ['activities'],
          (activity: Activity) => (action.activities as Activity[]).find((a) => a.id === activity.id) || activity
        )
      )
    ) : null,
  }),
  [UPDATE_ROUND]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'events'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
    wcif: state.wcif ? mapIn(state.wcif, ['events'], (event: Event) =>
      mapIn(event, ['rounds'], (round: Round) => (round.id === (action.roundId as string) ? action.roundData : round))
    ) : null,
  }),
  [RESET_ALL_GROUP_ASSIGNMENTS]: (state) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
    wcif: state.wcif ? mapIn(state.wcif, ['persons'], (person: Person) => ({
      ...person,
      assignments: [],
    })) : null,
  }),
  [GENERATE_ASSIGNMENTS]: Reducers.generateAssignments,
  [EDIT_ACTIVITY]: (state, { where, what }) => {
    if (!state.wcif) return state;

    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'persons', 'schedule'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
      wcif: {
        ...state.wcif,
        schedule: mapIn(state.wcif.schedule, ['venues'], (venue: Venue) =>
          mapIn(venue, ['rooms'], (room: Room) => ({
            ...room,
            activities: room.activities.map(findAndReplaceActivity(where, what)),
          }))
        ),
        persons:
          what.id !== undefined && where.id !== undefined && what.id !== where.id
            ? state.wcif.persons.map((person) => ({
                ...person,
                assignments: person.assignments?.map((assignment) => {
                  if (assignment.activityId === where.id) {
                    return {
                      ...assignment,
                      activityId: what.id,
                    };
                  }

                  return assignment;
                }),
              }))
            : state.wcif.persons,
      },
    };
  },
  [UPDATE_ROUND_EXTENSION_DATA]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'events'] as unknown as Iterable<keyof import('@wca/helpers').Competition>),
    wcif: state.wcif ? mapIn(state.wcif, ['events'], (event: Event) =>
      mapIn(event, ['rounds'], (round: Round) => {
        if (round.id === (action.activityCode as string)) {
          return setExtensionData('groups', round, action.extensionData);
        }

        return round;
      })
    ) : null,
  }),
  [UPDATE_GLOBAL_EXTENSION]: (state, { extensionData }) => {
    if (!state.wcif) return state;

    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'extensions'] as any),
      wcif: {
        ...state.wcif,
        extensions: [...state.wcif.extensions.filter((e) => e.id === extensionData), extensionData],
      },
    };
  },
  [UPDATE_RAW_OBJ]: (state, { key, value }) => {
    if (!state.wcif) return state;

    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, key] as any),
      wcif: {
        ...state.wcif,
        [key]: value,
      },
    };
  },
};

function reducer(state: AppState = INITIAL_STATE, action: Action): AppState {
  if (reducers[action.type]) {
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
