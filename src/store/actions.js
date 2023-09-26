import { sortWcifEvents } from '../lib/events';
import { updateIn, pick } from '../lib/utils';
import { getManageableCompetitions, getWcif, patchWcif } from '../lib/wcaAPI';
import { validateWcif } from '../lib/wcif-validation';

export const FETCHING_COMPETITIONS = 'fetching_competitions';
export const SET_ERROR_FETCHING_COMPS = 'set_error_fetching_comps';
export const SET_COMPETITIONS = 'set_competitions';
export const FETCHING_WCIF = 'fetching_wcif';
export const FETCH_WCIF = 'fetch_wcif';
export const FETCHED_WCIF = 'fetched_wcif';
export const UPLOADING_WCIF = 'uploading_wcif';
export const UPDATE_WCIF_ERRORS = 'update_wcif_errors';
export const TOGGLE_PERSON_ROLE = 'toggle_person_role';
export const ADD_PERSON_ASSIGNMENTS = 'add_person_assignments';
export const REMOVE_PERSON_ASSIGNMENTS = 'remove_person_assignments';
export const UPSERT_PERSON_ASSIGNMENTS = 'upsert_person_assignments';
export const BULK_ADD_PERSON_ASSIGNMENTS = 'bulk_add_person_assignments';
export const BULK_REMOVE_PERSON_ASSIGNMENTS = 'bulk_remove_person_assignment';
export const BULK_UPSERT_PERSON_ASSIGNMENTS = 'bulk_upsert_person_assignments';
export const UPDATE_GROUP_COUNT = 'update_group_count';
export const UPDATE_ROUND_ACTIVITIES = 'update_round_activities';
export const UPDATE_ROUND_CHILD_ACTIVITIES = 'update_round_child_activities';
export const UPDATE_ROUND_EXTENSION_DATA = 'update_round_extension_data';
export const UPDATE_ROUND = 'update_round';
export const PARTIAL_UPDATE_WCIF = 'partial_update_wcif';
export const RESET_ALL_GROUP_ASSIGNMENTS = 'reset_all_group_assignments';
export const GENERATE_ASSIGNMENTS = 'generate_assignments';
export const EDIT_ACTIVITY = 'edit_activity';
export const UPDATE_GLOBAL_EXTENSION = 'update_global_extension';
export const ADD_PERSON = 'add_person';

const fetchingCompetitions = () => ({
  type: FETCHING_COMPETITIONS,
});

const fetchingWCIF = () => ({
  type: FETCHING_WCIF,
  fetching: true,
});

const updateFetching = (fetching) => ({
  type: FETCHING_WCIF,
  fetching,
});

const updateWCIF = (wcif) => ({
  type: FETCHED_WCIF,
  fetched: false,
  wcif,
});

const updateWcifErrors = (errors, replace = false) => ({
  type: UPDATE_WCIF_ERRORS,
  errors,
  replace,
});

const updateUploading = (uploading) => ({
  type: UPLOADING_WCIF,
  uploading,
});

const setCompetitions = (competitions) => ({
  type: SET_COMPETITIONS,
  competitions,
});

export const fetchCompetitions = () => (dispatch) => {
  dispatch(fetchingCompetitions());
  getManageableCompetitions()
    .then((comps) => {
      dispatch(setCompetitions(comps));
    })
    .catch((error) => {
      dispatch({
        type: SET_ERROR_FETCHING_COMPS,
        error,
      });
    });
};

export const fetchWCIF = (competitionId) => async (dispatch) => {
  dispatch(fetchingWCIF());
  try {
    const wcif = await getWcif(competitionId);
    /* Sort events, so that we don't need to remember about this everywhere. */
    const updatedWcif = updateIn(wcif, ['events'], sortWcifEvents);

    dispatch(updateWCIF(updatedWcif));
    dispatch(updateWcifErrors(validateWcif(updatedWcif)));
  } catch (e) {
    dispatch(updateWcifErrors([e], true));
  }
  dispatch(updateFetching(false));
};

export const uploadCurrentWCIFChanges = (cb) => (dispatch, getState) => {
  const { wcif, changedKeys } = getState();
  const competitionId = wcif.id;

  if (changedKeys.size === 0) {
    console.error('Not pushing changes because changedKeys is empty');
    return;
  }

  const changes = pick(wcif, Array.from(changedKeys));

  dispatch(updateUploading(true));
  patchWcif(competitionId, changes)
    .then(() => {
      dispatch(updateUploading(false));
      cb();
    })
    .catch((e) => {
      console.error(e);
      dispatch(updateUploading(false));
      cb(e);
    });
};

export const togglePersonRole = (registrantId, roleId) => ({
  type: TOGGLE_PERSON_ROLE,
  registrantId,
  roleId,
});

/**
 * Adds assignments to a person
 * @param {number} registrantId
 * @param {Assignment[]} assignments
 */
export const addPersonAssignments = (registrantId, assignments) => ({
  type: ADD_PERSON_ASSIGNMENTS,
  registrantId,
  assignments,
});

/**
 * Removes assignments from a person matching the activityId
 * @param {number} registrantId
 * @param {number} activityId
 */
export const removePersonAssignments = (registrantId, activityId) => ({
  type: REMOVE_PERSON_ASSIGNMENTS,
  registrantId,
  activityId,
});

/**
 * For a given person, creates or updates the assignments
 * @param {number} registrantId
 * @param {Assignment[]} assignments
 */
export const upsertPersonAssignments = (registrantId, assignments) => ({
  type: UPSERT_PERSON_ASSIGNMENTS,
  registrantId,
  assignments,
});

/**
 * For whoever matches the passed assignments,
 * adds the respective assignments to each person
 * @param {array} assignments - [{activityId, registrantId, assignment: Assignment}]
 */
export const bulkAddPersonAssignments = (assignments) => ({
  type: BULK_ADD_PERSON_ASSIGNMENTS,
  assignments,
});

/**
 * Optionally remove person assignments by either any of activityId, registrantId, and/or assignmentCode
 * if only activityId is specified, then it removes all group assignments by that activityId.
 * if only registrantId is specified, then it removes all group assignments for the person.
 * if only assignmentCode is specified, then it removes all group assignments under that code.
 * if more than 1 is specified, then it will preform an *and*
 * @param {array} assignments - [{activityId?, registrantId?, assignmentCode?}]
 */
export const bulkRemovePersonAssignments = (assignments) => ({
  type: BULK_REMOVE_PERSON_ASSIGNMENTS,
  assignments,
});

/**
 * For whoever matches the passed assignments, creates or updates the assignments
 * @param {array} assignments - [{activityId, registrantId, assignment}]
 */
export const bulkUpsertPersonAssignments = (assignments) => ({
  type: BULK_UPSERT_PERSON_ASSIGNMENTS,
  assignments,
});

export const updateGroupCount = (activityId, groupCount) => ({
  type: UPDATE_GROUP_COUNT,
  activityId,
  groupCount,
});

/**
 * Replaces the round activities specified in the wcif
 */
export const updateRoundActivities = (activities) => ({
  type: UPDATE_ROUND_ACTIVITIES,
  activities,
});

export const updateRoundChildActivities = (activityId, childActivities) => ({
  type: UPDATE_ROUND_CHILD_ACTIVITIES,
  activityId,
  childActivities,
});

export const updateRoundExtensionData = (activityCode, extensionData) => ({
  type: UPDATE_ROUND_EXTENSION_DATA,
  activityCode,
  extensionData,
});

export const partialUpdateWCIF = (wcif) => ({
  type: PARTIAL_UPDATE_WCIF,
  wcif,
});

export const resetAllGroupAssignments = () => ({
  type: RESET_ALL_GROUP_ASSIGNMENTS,
});

/**
 *
 * @param {ActivityCode} roundId
 * @returns
 */
export const generateAssignments = (roundId, options) => ({
  type: GENERATE_ASSIGNMENTS,
  roundId,
  options: {
    sortOrganizationStaffInLastGroups: true,
    ...options,
  },
});

/**
 * Queries activity based on the what and replaces it with the what
 * @param {*} where
 * @param {*} what
 * @returns
 */
export const editActivity = (where, what) => ({
  type: EDIT_ACTIVITY,
  where,
  what,
});

export const updateGlobalExtension = (extensionData) => ({
  type: UPDATE_GLOBAL_EXTENSION,
  extensionData,
});

export const addPerson = (person) => ({
  type: ADD_PERSON,
  person,
})

export const updateRound = (roundId, roundData) => ({
  type: UPDATE_ROUND,
  roundId,
  roundData
})