import { getWcif } from '../lib/wcaAPI'
import { updateIn } from '../lib/utils';
import { sortWcifEvents } from '../lib/events';
import { validateWcif } from '../lib/wcif-validation';

export const FETCH_MANAGED_COMPS = 'fetch_managed_comps';
export const FETCHING_WCIF = 'fetching_wcif';
export const FETCH_WCIF = 'fetch_wcif';
export const FETCHED_WCIF = 'fetched_wcif';
export const UPDATE_WCIF_ERRORS = 'update_wcif_errors';
export const TOGGLE_PERSON_ROLE = 'toggle_person_role';

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

export const togglePersonRole = (registrantId, roleId) => ({
  type: TOGGLE_PERSON_ROLE,
  registrantId,
  roleId,
});
