import { mapIn, updateIn } from '../lib/utils';
import { removeExtensionData, setExtensionData } from '../lib/wcif-extensions';
import {
  TOGGLE_PERSON_ROLE,
  FETCHING_WCIF,
  FETCHED_WCIF,
  UPLOADING_WCIF,
  GENERATE_GROUP_ACTIVITIES,
  ADD_PERSON_ASSIGNMENT,
  REMOVE_PERSON_ASSIGNMENT,
  UPDATE_GROUP_COUNT
} from './actions';

const INITIAL_STATE = {
  anythingChanged: false,
  fetchingUser: false,
  user: {

  },
  fetchingWCIF: false,
  uploadingWCIF: false,
  needToSave: false,
  changedKeys: new Set(),
  wcif: {
    name: undefined,
    persons: [],
    events: [],
    schedule: {
      venues: [],
    },
  },
  errors: [],
}

const reducers = {
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
  [UPLOADING_WCIF]: (state, action) => ({
    ...state,
    fetchingWCIF: action.uploading,
    needToSave: action.uploading,
    changedKeys: action.uploading ? state.changedKeys : new Set(),
  }),
  [TOGGLE_PERSON_ROLE]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) =>
        person.registrantId === action.registrantId ? {
          ...person,
          roles: person.roles.indexOf(action.roleId) > -1 ?
            person.roles.filter((role) => role !== action.roleId)
            : person.roles.concat(action.roleId)
        } : person
      ),
    },
  }),
  [GENERATE_GROUP_ACTIVITIES]: (state, action) => ({
    ...state,
    needToSave: true,
    wcif: {
      ...state.wcif,

    }
  }),
  [ADD_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) => (
          person.registrantId === action.registrantId
        ? ({
          ...person,
          assignments: [...person.assignments, action.assignment],
        })
        : person
      )),
    },
  }),
  [REMOVE_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) => (
          person.registrantId === action.registrantId
        ? ({
          ...person,
          assignments: person.assignments.filter((a) => a.activityId !== action.activityId),
        })
        : person
      )),
    },
  }),
  [UPDATE_GROUP_COUNT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule']),
    wcif: mapIn(state.wcif, ['schedule', 'venues'], (venue) => mapIn(venue, ['rooms'], (room) => mapIn(room, ['activities'], (activity) => {
      if (activity.id === action.activityId) {
        return setExtensionData('activityConfig', activity, {
          groupCount: action.groupCount,
        });
      }

      return activity;
    }))),
  })
};

function reducer(state = INITIAL_STATE, action) {
  if (reducers[action.type]) {
    console.log(state);
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
