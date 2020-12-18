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
export const UPDATE_STAGES = 'update_stages';

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

export const uploadCurrentWCIFChanges = (keys) =>
  (dispatch, getState) => {
    if (keys.length === 0) {
      return;
    }

    const { wcif } = getState();
    const competitionId = wcif.id;

    const changes = pick(wcif, keys);

    dispatch(updateUploading(true));
    updateWcif(competitionId, changes)
      .then(() => {
        updateUploading(false);
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
export const updateStages = (venueId, roomId, stages) => ({
  type: UPDATE_STAGES,
  venueId,
  roomId,
  stages,
});
