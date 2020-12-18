import {
  TOGGLE_PERSON_ROLE,
  FETCHING_WCIF,
  FETCHED_WCIF,
} from './actions';

const INITIAL_STATE = {
  anythingChanged: false,
  fetchingUser: false,
  user: {

  },
  fetchingWCIF: false,
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
    fetchingWCIF: action.fetching,
    wcif: action.wcif,
  }),
  [TOGGLE_PERSON_ROLE]: (state, action) => ({
    ...state,
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
};

function reducer(state = INITIAL_STATE, action) {
  if (reducers[action.type]) {
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
