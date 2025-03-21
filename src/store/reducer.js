import { findAndReplaceActivity } from '../lib/activities';
import { mapIn } from '../lib/utils';
import { setExtensionData } from '../lib/wcif-extensions';
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
import INITIAL_STATE from './initialState';
import * as Reducers from './reducers';

const reducers = {
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
    changedKeys: new Set([...state.changedKeys, ...Object.keys(action.wcif)]),
    wcif: {
      ...state.wcif,
      ...action.wcif,
    },
  }),
  // Editing person data
  [TOGGLE_PERSON_ROLE]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) =>
        person.registrantId === action.registrantId
          ? {
              ...person,
              roles:
                person.roles.indexOf(action.roleId) > -1
                  ? person.roles.filter((role) => role !== action.roleId)
                  : person.roles.concat(action.roleId),
            }
          : person
      ),
    },
  }),
  [ADD_PERSON]: (state, { person }) => {
    // if (state.wcif.persons.some((p) => p.registrantId === person.registrantId || p.wcaUserId === person.wcaUserId)) {
    //   throw new Error('duplicate person', person);
    // }

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
    changedKeys: new Set([...state.changedKeys, 'schedule']),
    wcif: mapIn(state.wcif, ['schedule', 'venues'], (venue) =>
      mapIn(venue, ['rooms'], (room) =>
        mapIn(room, ['activities'], (activity) => {
          if (activity.id === action.activityId) {
            return setExtensionData('activityConfig', activity, {
              groupCount: action.groupCount,
            });
          }

          return activity;
        })
      )
    ),
  }),
  [UPDATE_ROUND_CHILD_ACTIVITIES]: (state, action) => ({
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
  }),
  [UPDATE_ROUND_ACTIVITIES]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule']),
    wcif: mapIn(state.wcif, ['schedule', 'venues'], (venue) =>
      mapIn(venue, ['rooms'], (room) =>
        mapIn(
          room,
          ['activities'],
          (activity) => action.activities.find((a) => a.id === activity.id) || activity
        )
      )
    ),
  }),
  [UPDATE_ROUND]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'events']),
    wcif: mapIn(state.wcif, ['events'], (event) =>
      mapIn(event, ['rounds'], (round) => (round.id === action.roundId ? action.roundData : round))
    ),
  }),
  [RESET_ALL_GROUP_ASSIGNMENTS]: (state) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) => ({
      ...person,
      assignments: [],
    })),
  }),
  [GENERATE_ASSIGNMENTS]: Reducers.generateAssignments,
  [EDIT_ACTIVITY]: (state, { where, what }) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons', 'schedule']),
    wcif: {
      ...state.wcif,
      schedule: mapIn(state.wcif.schedule, ['venues'], (venue) =>
        mapIn(venue, ['rooms'], (room) => ({
          ...room,
          activities: room.activities.map(findAndReplaceActivity(where, what)),
        }))
      ),
      persons:
        what.id !== undefined && where.id !== undefined && what.id !== where.id
          ? state.wcif.persons.map((person) => ({
              ...person,
              assignments: person.assignments.map((assignment) => {
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
  }),
  [UPDATE_ROUND_EXTENSION_DATA]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'events']),
    wcif: mapIn(state.wcif, ['events'], (event) =>
      mapIn(event, ['rounds'], (round) => {
        if (round.id === action.activityCode) {
          return setExtensionData('groups', round, action.extensionData);
        }

        return round;
      })
    ),
  }),
  [UPDATE_GLOBAL_EXTENSION]: (state, { extensionData }) => {
    return {
      ...state,
      needToSave: true,
      changedKeys: new Set([...state.changedKeys, 'extensions']),
      wcif: {
        ...state.wcif,
        extensions: [...state.wcif.extensions.filter((e) => e.id === extensionData), extensionData],
      },
    };
  },
  [UPDATE_RAW_OBJ]: (state, { key, value }) => {
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

function reducer(state = INITIAL_STATE, action) {
  if (reducers[action.type]) {
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
