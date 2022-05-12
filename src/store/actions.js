import { getWcif, updateWcif } from '../lib/wcaAPI'
import { updateIn, pick } from '../lib/utils';
import { sortWcifEvents } from '../lib/events';
import { validateWcif } from '../lib/wcif-validation';

export const FETCH_MANAGED_COMPS = 'fetch_managed_comps';
export const FETCHING_WCIF = 'fetching_wcif';
export const FETCH_WCIF = 'fetch_wcif';
export const FETCHED_WCIF = 'fetched_wcif';
export const UPLOADING_WCIF = 'uploading_wcif';
export const UPDATE_WCIF_ERRORS = 'update_wcif_errors';
export const TOGGLE_PERSON_ROLE = 'toggle_person_role';
export const GENERATE_GROUP_ACTIVITIES = 'generate_group_activities';
export const ADD_PERSON_ASSIGNMENT = 'add_person_assignment';
export const REMOVE_PERSON_ASSIGNMENT = 'remove_person_assignment';
export const UPDATE_GROUP_COUNT = 'update_group_count';

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
})

export const fetchWCIF = (competitionId) =>
  (dispatch) => {
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

export const uploadCurrentWCIFChanges = () =>
  (dispatch, getState) => {
    const { wcif, changedKeys } = getState();
    const competitionId = wcif.id;

    if (changedKeys.size === 0) {
      console.error('Not pushing changes because changedKeys is empty');
      return;
    }

    const changes = pick(wcif, Array.from(changedKeys));

    console.log(changes);

    dispatch(updateUploading(true));
    updateWcif(competitionId, changes)
      .then(() => {
        console.log('finished');
        dispatch(updateUploading(false));
      })
      .catch((e) => {
        console.error(e);
      })
  };

export const togglePersonRole = (registrantId, roleId) => ({
  type: TOGGLE_PERSON_ROLE,
  registrantId,
  roleId,
});

export const generateGroupActitivites = (activityCode, groups) => ({
  type: GENERATE_GROUP_ACTIVITIES,
  activityCode,
  groups,
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
 * @param {number} activityId
 */
export const removePersonAssignment = (registrantId, activityId) => ({
  type: REMOVE_PERSON_ASSIGNMENT,
  registrantId,
  activityId,
});

export const updateGroupCount = (activityId, groupCount) => ({
  type: UPDATE_GROUP_COUNT,
  activityId,
  groupCount,
});
