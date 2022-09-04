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
export const ADD_PERSON_ASSIGNMENT = 'add_person_assignment';
export const UPSERT_PERSON_ASSIGNMENT = 'upsert_person_assignment';
export const BULK_ADD_PERSON_ASSIGNMENT = 'bulk_add_person_assignment';
export const REMOVE_PERSON_ASSIGNMENT = 'remove_person_assignment';
export const BULK_REMOVE_PERSON_ASSIGNMENT = 'bulk_remove_person_assignment';
export const UPDATE_GROUP_COUNT = 'update_group_count';
export const UPDATE_ROUND_ACTIVITIES = 'update_round_activities';
export const UPDATE_ROUND_CHILD_ACTIVITIES = 'update_round_child_activities';
export const UPSERT_ROUND_CHILD_ACTIVITIES = 'upsert_round_child_activities';
export const UPDATE_ROUND_EXTENSION_DATA = 'update_round_extension_data';
export const PARTIAL_UPDATE_WCIF = 'partial_update_wcif';
export const RESET_ALL_GROUP_ASSIGNMENTS = 'reset_all_group_assignments';

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

export const fetchWCIF = (competitionId) => (dispatch) => {
  dispatch(fetchingWCIF());
  getWcif(competitionId)
    /* Sort events, so that we don't need to remember about this everywhere. */
    .then((wcif) => updateIn(wcif, ['events'], sortWcifEvents))
    .then((wcif) => {
      console.log(54);
      dispatch(updateWCIF(wcif));
      dispatch(updateWcifErrors(validateWcif(wcif)));
    })
    .catch((error) => updateWcifErrors([error.message]))
    .finally(() => updateFetching(false));
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
 * @param {number} registrantId
 * @param {Assignment} assignment
 */
export const addPersonAssignment = (registrantId, assignment) => ({
  type: ADD_PERSON_ASSIGNMENT,
  registrantId,
  assignment,
});

/**
 * @param {number} registrantId
 * @param {Assignment} assignment
 */
export const upsertPersonAssignment = (registrantId, assignment) => ({
  type: UPSERT_PERSON_ASSIGNMENT,
  registrantId,
  assignment,
});

/**
 * @param {array} assignments - [{activityId, registrantId, assignment: Assignment}]
 */
export const bulkAddPersonAssignment = (assignments) => ({
  type: BULK_ADD_PERSON_ASSIGNMENT,
  assignments,
});

/**
 * @param {number} registrantId
 * @param {number} activityId
 */
export const removePersonAssignment = (registrantId, activityId) => ({
  type: REMOVE_PERSON_ASSIGNMENT,
  registrantId,
  activityId,
});

/**
 * Optionally remove person assignments by either any of activityId, registrantId, and/or assignmentCode
 * if only activityId is specified, then it removes all group assignments by that activityId.
 * if only registrantId is specified, then it removes all group assignments for the person.
 * if only assignmentCode is specified, then it removes all group assignments under that code.
 * if more than 1 is specified, then it will preform an *and*
 * @param {array} assignments - [{activityId?, registrantId?, assignmentCode?}]
 */
export const bulkRemovePersonAssignment = (assignments) => ({
  type: BULK_REMOVE_PERSON_ASSIGNMENT,
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

export const upsertRoundChildActivities = (activityCode, childActivities) => ({
  type: UPDATE_ROUND_EXTENSION_DATA,
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
