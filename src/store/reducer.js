import { setExtensionData } from '../lib/wcif-extensions';
import {
  TOGGLE_PERSON_ROLE,
  FETCHING_WCIF,
  FETCHED_WCIF,
  UPDATE_STAGES,
  GENERATE_GROUP_ACTIVITIES,
} from './actions';

const INITIAL_STATE = {
  anythingChanged: false,
  fetchingUser: false,
  user: {

  },
  fetchingWCIF: false,
  uploadingWCIF: false,
  needToSave: false,
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
    fetchingWCIF: action.fetching,
    wcif: action.wcif,
  }),
  [TOGGLE_PERSON_ROLE]: (state, action) => ({
    ...state,
    needToSave: true,
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
  [UPDATE_STAGES]: (state, action) => ({
    ...state,
    needToSave: true,
    wcif: {
      ...state.wcif,
      schedule: {
        ...state.wcif.schedule,
        venues: state.wcif.schedule.venues.map((venue) => venue.id === action.venueId ? ({
          ...venue,
          rooms: venue.rooms.map((room) => room.id === action.roomId ?
              setExtensionData('stages', room, {
                stages: action.stages,
              }) : room
            )
        }) : venue)
      }
    }
  }),
  [GENERATE_GROUP_ACTIVITIES]: (state, action) => ({
    ...state,
    needToSave: true,
    wcif: {
      ...state.wcif,
      
    }
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
