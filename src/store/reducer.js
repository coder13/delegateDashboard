import { mapIn, updateIn } from '../lib/utils';
import { setExtensionData } from '../lib/wcif-extensions';
import {
  SET_COMPETITIONS,
  TOGGLE_PERSON_ROLE,
  FETCHING_WCIF,
  FETCHED_WCIF,
  UPLOADING_WCIF,
  ADD_PERSON_ASSIGNMENT,
  UPSERT_PERSON_ASSIGNMENT,
  BULK_ADD_PERSON_ASSIGNMENT,
  REMOVE_PERSON_ASSIGNMENT,
  BULK_REMOVE_PERSON_ASSIGNMENT,
  UPDATE_WCIF_ERRORS,
  UPDATE_GROUP_COUNT,
  UPDATE_ROUND_ACTIVITIES,
  UPDATE_ROUND_CHILD_ACTIVITIES,
  UPDATE_ROUND_EXTENSION_DATA,
  PARTIAL_UPDATE_WCIF,
  FETCHING_COMPETITIONS,
  SET_ERROR_FETCHING_COMPS,
} from './actions';

const INITIAL_STATE = {
  anythingChanged: false,
  fetchingUser: false,
  user: {},
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
  competitions: [],
  errors: [],
};

const reducers = {
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
    fetchingWCIF: (console.log(43, state), action.fetching),
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
  [ADD_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) =>
        person.registrantId === action.registrantId
          ? {
            ...person,
            assignments: [...person.assignments, action.assignment],
          }
          : person
      ),
    },
  }),
  [UPSERT_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) =>
        person.registrantId === action.registrantId
          ? {
            ...person,
            assignments: [
              ...person.assignments.filter((a) => a.id !== action.assignment.activityId),
              action.assignment,
            ],
          }
          : person
      ),
    },
  }),
  [REMOVE_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) =>
        person.registrantId === action.registrantId
          ? {
            ...person,
            assignments: person.assignments.filter((a) => a.activityId !== action.activityId),
          }
          : person
      ),
    },
  }),
  [BULK_ADD_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) => {
      const personAssignments = action.assignments.filter(
        (a) => a.registrantId === person.registrantId
      );
      if (personAssignments.length) {
        return updateIn(person, ['assignments'], (assignments) => [
          ...assignments,
          ...personAssignments.map((a) => ({
            activityId: a.activityId,
            ...a.assignment,
          })),
        ]);
      }

      return person;
    }),
  }),
  /**
   * Assume we're removing by default
   * Look for arguments to keep the assignment for the person
   */
  [BULK_REMOVE_PERSON_ASSIGNMENT]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) => {
      if (person.assignments.length === 0) {
        return person;
      }

      // Find arguments to keep assignment: that is, return true
      return updateIn(person, ['assignments'], (assignments) =>
        assignments.filter((personAssignment) => {
          const filtersApplicable = action.assignments.filter((a) => {
            const filterByRegistrantId = a.registrantId
              ? a.registrantId === person.registrantId
              : null;
            const filterByActivityId = a.activityId
              ? a.activityId === personAssignment.activityId
              : null;
            const filterByAssignmentCode = a.assignmentCode
              ? a.assignmentCode === personAssignment.assignmentCode
              : null;

            // return true if any filter is applicable
            // We are looking for at least 1 false. If so, return no applicable filters
            return !(
              filterByRegistrantId === false ||
              filterByActivityId === false ||
              filterByAssignmentCode === false
            ); // note do actually want these values to be "false" and not "null"
          });

          // At least 1 filter is filtering them out
          return filtersApplicable.length === 0;
        })
      );
    }),
  }),
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
  [PARTIAL_UPDATE_WCIF]: (state, action) => ({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, ...Object.keys(action.wcif)]),
    wcif: {
      ...state.wcif,
      ...action.wcif,
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
};

function reducer(state = INITIAL_STATE, action) {
  if (reducers[action.type]) {
    return reducers[action.type](state, action);
  }
  return state;
}

export default reducer;
