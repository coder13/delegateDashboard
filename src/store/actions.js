import { sortWcifEvents } from '../lib/events';
import { updateIn, pick } from '../lib/utils';
import { getWcif, updateWcif } from '../lib/wcaAPI';
import { validateWcif } from '../lib/wcif-validation';

export const FETCH_MANAGED_COMPS = 'fetch_managed_comps';
export const FETCHING_WCIF = 'fetching_wcif';
export const FETCH_WCIF = 'fetch_wcif';
export const FETCHED_WCIF = 'fetched_wcif';
export const UPLOADING_WCIF = 'uploading_wcif';
export const UPDATE_WCIF_ERRORS = 'update_wcif_errors';
export const TOGGLE_PERSON_ROLE = 'toggle_person_role';
export const ADD_PERSON_ASSIGNMENT = 'add_person_assignment';
export const BULK_ADD_PERSON_ASSIGNMENT = 'bulk_add_person_assignment';
export const REMOVE_PERSON_ASSIGNMENT = 'remove_person_assignment';
export const BULK_REMOVE_PERSON_ASSIGNMENT = 'bulk_remove_person_assignment';
export const UPDATE_GROUP_COUNT = 'update_group_count';
export const UPDATE_ROUND_ACTIVITIES = 'update_round_activities';
export const UPDATE_ROUND_CHILD_ACTIVITIES = 'update_round_child_activities';
export const UPDATE_ROUND_EXTENSION_DATA = 'update_round_extension_data';

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

const updateWcifErrors = (errors) => ({
  type: UPDATE_WCIF_ERRORS,
  errors,
});

const updateUploading = (uploading) => ({
  type: UPLOADING_WCIF,
  uploading,
});

export const fetchWCIF = (competitionId) => (dispatch) => {
  dispatch(fetchingWCIF());
  getWcif(competitionId)
    /* Sort events, so that we don't need to remember about this everywhere. */
    .then((wcif) => updateIn(wcif, ['events'], sortWcifEvents))
    .then((wcif) => {
      dispatch(updateWCIF(wcif));
      updateWcifErrors(validateWcif(wcif));
    })
    .catch((error) => updateWcifErrors([error.message]))
    .finally(() => updateFetching(false));
};

export const uploadCurrentWCIFChanges = () => (dispatch, getState) => {
  const { wcif, changedKeys } = getState();
  const competitionId = wcif.id;

  if (changedKeys.size === 0) {
    console.error('Not pushing changes because changedKeys is empty');
    return;
  }

  const changes = pick(wcif, Array.from(changedKeys));

  dispatch(updateUploading(true));
  updateWcif(competitionId, changes)
    .then(() => {
      console.log('finished');
      dispatch(updateUploading(false));
    })
    .catch((e) => {
      console.error(e);
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

export const updateRoundExtensionData = (activityCode, extensionData) => ({
  type: UPDATE_ROUND_EXTENSION_DATA,
  activityCode,
  extensionData,
});
