import { Activity, Assignment, Competition, Person } from '@wca/helpers';
import { sortWcifEvents } from '../lib/events';
import { updateIn, pick } from '../lib/utils';
import { getUpcomingManageableCompetitions, getWcif, patchWcif } from '../lib/wcaAPI';
import { validateWcif } from '../lib/wcif-validation';
import { AppState } from './initialState';
import { ThunkAction } from 'redux-thunk';

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
export const UPDATE_RAW_OBJ = 'update_raw_obj';

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, any>;

const fetchingCompetitions = () => ({
  type: FETCHING_COMPETITIONS,
} as const);

const fetchingWCIF = () => ({
  type: FETCHING_WCIF,
  fetching: true,
} as const);

const updateFetching = (fetching: boolean) => ({
  type: FETCHING_WCIF,
  fetching,
} as const);

const updateWCIF = (wcif: Competition) => ({
  type: FETCHED_WCIF,
  fetched: false,
  wcif,
} as const);

const updateWcifErrors = (errors: any[], replace: boolean = false) => ({
  type: UPDATE_WCIF_ERRORS,
  errors,
  replace,
} as const);

const updateUploading = (uploading: boolean) => ({
  type: UPLOADING_WCIF,
  uploading,
} as const);

const setCompetitions = (competitions: any[]) => ({
  type: SET_COMPETITIONS,
  competitions,
} as const);

export const fetchCompetitions = (): AppThunk => (dispatch) => {
  dispatch(fetchingCompetitions());
  getUpcomingManageableCompetitions()
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

export const fetchWCIF = (competitionId: string): AppThunk => async (dispatch) => {
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

export const uploadCurrentWCIFChanges = (cb: (error?: any) => void): AppThunk => (dispatch, getState) => {
  const { wcif, changedKeys } = getState();
  
  if (!wcif) {
    console.error('No WCIF to upload');
    return;
  }

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

export const togglePersonRole = (registrantId: number, roleId: string) => ({
  type: TOGGLE_PERSON_ROLE,
  registrantId,
  roleId,
} as const);

/**
 * Adds assignments to a person
 */
export const addPersonAssignments = (registrantId: number, assignments: Assignment[]) => ({
  type: ADD_PERSON_ASSIGNMENTS,
  registrantId,
  assignments,
} as const);

/**
 * Removes assignments from a person matching the activityId
 */
export const removePersonAssignments = (registrantId: number, activityId: number) => ({
  type: REMOVE_PERSON_ASSIGNMENTS,
  registrantId,
  activityId,
} as const);

/**
 * For a given person, creates or updates the assignments
 */
export const upsertPersonAssignments = (registrantId: number, assignments: Assignment[]) => ({
  type: UPSERT_PERSON_ASSIGNMENTS,
  registrantId,
  assignments,
} as const);

/**
 * For whoever matches the passed assignments,
 * adds the respective assignments to each person
 */
export const bulkAddPersonAssignments = (assignments: any[]) => ({
  type: BULK_ADD_PERSON_ASSIGNMENTS,
  assignments,
} as const);

/**
 * Optionally remove person assignments by either any of activityId, registrantId, and/or assignmentCode
 * if only activityId is specified, then it removes all group assignments by that activityId.
 * if only registrantId is specified, then it removes all group assignments for the person.
 * if only assignmentCode is specified, then it removes all group assignments under that code.
 * if more than 1 is specified, then it will preform an *and*
 */
export const bulkRemovePersonAssignments = (assignments: any[]) => ({
  type: BULK_REMOVE_PERSON_ASSIGNMENTS,
  assignments,
} as const);

/**
 * For whoever matches the passed assignments, creates or updates the assignments
 */
export const bulkUpsertPersonAssignments = (assignments: any[]) => ({
  type: BULK_UPSERT_PERSON_ASSIGNMENTS,
  assignments,
} as const);

export const updateGroupCount = (activityId: number, groupCount: number) => ({
  type: UPDATE_GROUP_COUNT,
  activityId,
  groupCount,
} as const);

/**
 * Replaces the round activities specified in the wcif
 */
export const updateRoundActivities = (activities: Activity[]) => ({
  type: UPDATE_ROUND_ACTIVITIES,
  activities,
} as const);

export const updateRoundChildActivities = (activityId: number, childActivities: Activity[]) => ({
  type: UPDATE_ROUND_CHILD_ACTIVITIES,
  activityId,
  childActivities,
} as const);

export const updateRoundExtensionData = (activityCode: string, extensionData: any) => ({
  type: UPDATE_ROUND_EXTENSION_DATA,
  activityCode,
  extensionData,
} as const);

export const partialUpdateWCIF = (wcif: Partial<Competition>) => ({
  type: PARTIAL_UPDATE_WCIF,
  wcif,
} as const);

export const resetAllGroupAssignments = () => ({
  type: RESET_ALL_GROUP_ASSIGNMENTS,
} as const);

/**
 * Generate assignments for a round
 */
export const generateAssignments = (roundId: string, options?: any) => ({
  type: GENERATE_ASSIGNMENTS,
  roundId,
  options: {
    sortOrganizationStaffInLastGroups: true,
    ...options,
  },
} as const);

/**
 * Queries activity based on the where and replaces it with the what
 */
export const editActivity = (where: any, what: any) => ({
  type: EDIT_ACTIVITY,
  where,
  what,
} as const);

export const updateGlobalExtension = (extensionData: any) => ({
  type: UPDATE_GLOBAL_EXTENSION,
  extensionData,
} as const);

export const addPerson = (person: Person) => ({
  type: ADD_PERSON,
  person,
} as const);

export const updateRound = (roundId: string, roundData: any) => ({
  type: UPDATE_ROUND,
  roundId,
  roundData,
} as const);

export const updateRawObj = (key: string, value: any) => ({
  type: UPDATE_RAW_OBJ,
  key,
  value,
} as const);
