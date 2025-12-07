import { getUpcomingManageableCompetitions, getWcif, patchWcif } from '../lib/api';
import { sortWcifEvents } from '../lib/domain/events';
import { BulkInProgressAssignments } from '../lib/types';
import { updateIn, pick } from '../lib/utils/utils';
import { validateWcif, ValidationError } from '../lib/wcif/validation';
import { AppState } from './initialState';
import { Competition, Activity, Assignment, Person, Round } from '@wca/helpers';
import type { Extension } from '@wca/helpers/lib/models/extension';
import { Dispatch } from 'redux';

interface CompetitionSearchResult {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  country_iso2: string;
}

export const ActionType = {
  FETCHING_COMPETITIONS: 'fetching_competitions',
  SET_ERROR_FETCHING_COMPS: 'set_error_fetching_comps',
  SET_COMPETITIONS: 'set_competitions',
  FETCHING_WCIF: 'fetching_wcif',
  FETCHED_WCIF: 'fetched_wcif',
  UPLOADING_WCIF: 'uploading_wcif',
  UPDATE_WCIF_ERRORS: 'update_wcif_errors',
  TOGGLE_PERSON_ROLE: 'toggle_person_role',
  ADD_PERSON_ASSIGNMENTS: 'add_person_assignments',
  REMOVE_PERSON_ASSIGNMENTS: 'remove_person_assignments',
  UPSERT_PERSON_ASSIGNMENTS: 'upsert_person_assignments',
  BULK_ADD_PERSON_ASSIGNMENTS: 'bulk_add_person_assignments',
  BULK_REMOVE_PERSON_ASSIGNMENTS: 'bulk_remove_person_assignment',
  BULK_UPSERT_PERSON_ASSIGNMENTS: 'bulk_upsert_person_assignments',
  UPDATE_GROUP_COUNT: 'update_group_count',
  UPDATE_ROUND_ACTIVITIES: 'update_round_activities',
  UPDATE_ROUND_CHILD_ACTIVITIES: 'update_round_child_activities',
  UPDATE_ROUND_EXTENSION_DATA: 'update_round_extension_data',
  UPDATE_ROUND: 'update_round',
  PARTIAL_UPDATE_WCIF: 'partial_update_wcif',
  RESET_ALL_GROUP_ASSIGNMENTS: 'reset_all_group_assignments',
  GENERATE_ASSIGNMENTS: 'generate_assignments',
  EDIT_ACTIVITY: 'edit_activity',
  UPDATE_GLOBAL_EXTENSION: 'update_global_extension',
  ADD_PERSON: 'add_person',
  UPDATE_RAW_OBJ: 'update_raw_obj',
} as const;

export type Action = (typeof ActionType)[keyof typeof ActionType];

export type ReduxAction<T extends Action, P extends object = object> = {
  type: T;
} & P;

const fetchingCompetitions = (): ReduxAction<typeof ActionType.FETCHING_COMPETITIONS> => ({
  type: ActionType.FETCHING_COMPETITIONS,
});

export type FetchingWcifPayload = { fetching: boolean };
const fetchingWCIF = (): ReduxAction<typeof ActionType.FETCHING_WCIF, FetchingWcifPayload> => ({
  type: ActionType.FETCHING_WCIF,
  fetching: true,
});

const updateFetching = (
  fetching: boolean
): ReduxAction<typeof ActionType.FETCHING_WCIF, FetchingWcifPayload> => ({
  type: ActionType.FETCHING_WCIF,
  fetching,
});

export type UpdateWcifPayload = { fetched: boolean; wcif: Competition };
const updateWCIF = (
  wcif: Competition
): ReduxAction<typeof ActionType.FETCHED_WCIF, UpdateWcifPayload> => ({
  type: ActionType.FETCHED_WCIF,
  fetched: false,
  wcif,
});

export type UpdateWcifErrorsPayload = { errors: ValidationError[]; replace: boolean };
const updateWcifErrors = (
  errors: ValidationError[],
  replace = false
): ReduxAction<typeof ActionType.UPDATE_WCIF_ERRORS, UpdateWcifErrorsPayload> => ({
  type: ActionType.UPDATE_WCIF_ERRORS,
  errors,
  replace,
});

export type UploadingWcifPayload = { uploading: boolean };
const updateUploading = (
  uploading: boolean
): ReduxAction<typeof ActionType.UPLOADING_WCIF, UploadingWcifPayload> => ({
  type: ActionType.UPLOADING_WCIF,
  uploading,
});

export type SetCompetitionsPayload = { competitions: CompetitionSearchResult[] };
const setCompetitions = (
  competitions: CompetitionSearchResult[]
): ReduxAction<typeof ActionType.SET_COMPETITIONS, SetCompetitionsPayload> => ({
  type: ActionType.SET_COMPETITIONS,
  competitions,
});

export const fetchCompetitions = () => (dispatch: Dispatch) => {
  dispatch(fetchingCompetitions());
  getUpcomingManageableCompetitions()
    .then((comps) => {
      dispatch(setCompetitions(comps));
    })
    .catch((error: Error) => {
      dispatch({
        type: ActionType.SET_ERROR_FETCHING_COMPS,
        error,
      });
    });
};

export const fetchWCIF = (competitionId: string) => async (dispatch: Dispatch) => {
  dispatch(fetchingWCIF());
  try {
    const wcif = await getWcif(competitionId);
    /* Sort events, so that we don't need to remember about this everywhere. */
    const updatedWcif = updateIn(wcif, ['events'], sortWcifEvents);

    dispatch(updateWCIF(updatedWcif));
    dispatch(updateWcifErrors(validateWcif(updatedWcif)));
  } catch (e) {
    dispatch(updateWcifErrors([e as ValidationError], true));
  }
  dispatch(updateFetching(false));
};

export const uploadCurrentWCIFChanges =
  (cb: (error?: Error) => void) => (dispatch: Dispatch, getState: () => AppState) => {
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
      .catch((e: Error) => {
        console.error(e);
        dispatch(updateUploading(false));
        cb(e);
      });
  };

export type TogglePersonRolePayload = { registrantId: number; roleId: string };
export const togglePersonRole = (
  registrantId: number,
  roleId: string
): ReduxAction<typeof ActionType.TOGGLE_PERSON_ROLE, TogglePersonRolePayload> => ({
  type: ActionType.TOGGLE_PERSON_ROLE,
  registrantId,
  roleId,
});

export type AddPersonAssignmentsPayload = { registrantId: number; assignments: Assignment[] };
/**
 * Adds assignments to a person
 * @param {number} registrantId
 * @param {Assignment[]} assignments
 */
export const addPersonAssignments = (
  registrantId: number,
  assignments: Assignment[]
): ReduxAction<typeof ActionType.ADD_PERSON_ASSIGNMENTS, AddPersonAssignmentsPayload> => ({
  type: ActionType.ADD_PERSON_ASSIGNMENTS,
  registrantId,
  assignments,
});

export type RemovePersonAssignmentsPayload = { registrantId: number; activityId: number };
/**
 * Removes assignments from a person matching the activityId
 * @param {number} registrantId
 * @param {number} activityId
 */
export const removePersonAssignments = (
  registrantId: number,
  activityId: number
): ReduxAction<typeof ActionType.REMOVE_PERSON_ASSIGNMENTS, RemovePersonAssignmentsPayload> => ({
  type: ActionType.REMOVE_PERSON_ASSIGNMENTS,
  registrantId,
  activityId,
});

export type UpsertPersonAssignmentsPayload = { registrantId: number; assignments: Assignment[] };
/**
 * For a given person, creates or updates the assignments
 * @param {number} registrantId
 * @param {Assignment[]} assignments
 */
export const upsertPersonAssignments = (
  registrantId: number,
  assignments: Assignment[]
): ReduxAction<typeof ActionType.UPSERT_PERSON_ASSIGNMENTS, UpsertPersonAssignmentsPayload> => ({
  type: ActionType.UPSERT_PERSON_ASSIGNMENTS,
  registrantId,
  assignments,
});

export type BulkAddPersonAssignmentsPayload = {
  assignments: BulkInProgressAssignments;
};
/**
 * For whoever matches the passed assignments,
 * adds the respective assignments to each person
 * @param {array} assignments - [{activityId, registrantId, assignment: Assignment}]
 */
export const bulkAddPersonAssignments = (
  assignments: BulkInProgressAssignments
): ReduxAction<typeof ActionType.BULK_ADD_PERSON_ASSIGNMENTS, BulkAddPersonAssignmentsPayload> => ({
  type: ActionType.BULK_ADD_PERSON_ASSIGNMENTS,
  assignments,
});

export type BulkFindAssignments = Array<{
  activityId?: number;
  registrantId?: number;
  assignmentCode?: string;
}>;
export type BulkRemovePersonAssignmentsPayload = {
  assignments: BulkFindAssignments;
};

/**
 * Optionally remove person assignments by either any of activityId, registrantId, and/or assignmentCode
 * if only activityId is specified, then it removes all group assignments by that activityId.
 * if only registrantId is specified, then it removes all group assignments for the person.
 * if only assignmentCode is specified, then it removes all group assignments under that code.
 * if more than 1 is specified, then it will preform an *and*
 * @param {array} assignments - [{activityId?, registrantId?, assignmentCode?}]
 */
export const bulkRemovePersonAssignments = (
  assignments: BulkFindAssignments
): ReduxAction<
  typeof ActionType.BULK_REMOVE_PERSON_ASSIGNMENTS,
  BulkRemovePersonAssignmentsPayload
> => ({
  type: ActionType.BULK_REMOVE_PERSON_ASSIGNMENTS,
  assignments,
});

export type BulkUpsertPersonAssignmentsPayload = {
  assignments: BulkInProgressAssignments;
};
/**
 * For whoever matches the passed assignments, creates or updates the assignments
 * @param {array} assignments - [{activityId, registrantId, assignment}]
 */
export const bulkUpsertPersonAssignments = (
  assignments: BulkUpsertPersonAssignmentsPayload['assignments']
): ReduxAction<
  typeof ActionType.BULK_UPSERT_PERSON_ASSIGNMENTS,
  BulkUpsertPersonAssignmentsPayload
> => ({
  type: ActionType.BULK_UPSERT_PERSON_ASSIGNMENTS,
  assignments,
});

export type UpdateGroupCountPayload = { activityId: number; groupCount: number };
export const updateGroupCount = (
  activityId: number,
  groupCount: number
): ReduxAction<typeof ActionType.UPDATE_GROUP_COUNT, UpdateGroupCountPayload> => ({
  type: ActionType.UPDATE_GROUP_COUNT,
  activityId,
  groupCount,
});

export type UpdateRoundActivitiesPayload = {
  activities: Activity[];
};
/**
 * Replaces the round activities specified in the wcif
 */
export const updateRoundActivities = (
  activities: Activity[]
): ReduxAction<typeof ActionType.UPDATE_ROUND_ACTIVITIES, UpdateRoundActivitiesPayload> => ({
  type: ActionType.UPDATE_ROUND_ACTIVITIES,
  activities,
});

export type UpdateRoundChildActivitiesPayload = {
  activityId: number;
  childActivities: Activity[];
};
export const updateRoundChildActivities = (
  activityId: number,
  childActivities: Activity[]
): ReduxAction<
  typeof ActionType.UPDATE_ROUND_CHILD_ACTIVITIES,
  UpdateRoundChildActivitiesPayload
> => ({
  type: ActionType.UPDATE_ROUND_CHILD_ACTIVITIES,
  activityId,
  childActivities,
});

export type UpdateRoundExtensionDataPayload = {
  activityCode: string;
  extensionData: Record<string, unknown>;
};
export const updateRoundExtensionData = (
  activityCode: string,
  extensionData: Record<string, unknown>
): ReduxAction<typeof ActionType.UPDATE_ROUND_EXTENSION_DATA, UpdateRoundExtensionDataPayload> => ({
  type: ActionType.UPDATE_ROUND_EXTENSION_DATA,
  activityCode,
  extensionData,
});

export type PartialUpdateWcifPayload = { wcif: Partial<Competition> };
export const partialUpdateWCIF = (
  wcif: Partial<Competition>
): ReduxAction<typeof ActionType.PARTIAL_UPDATE_WCIF, PartialUpdateWcifPayload> => ({
  type: ActionType.PARTIAL_UPDATE_WCIF,
  wcif,
});

export const resetAllGroupAssignments = (): ReduxAction<
  typeof ActionType.RESET_ALL_GROUP_ASSIGNMENTS
> => ({
  type: ActionType.RESET_ALL_GROUP_ASSIGNMENTS,
});

export type GenerateAssignmentsPayload = {
  roundId: string;
  options: {
    sortOrganizationStaffInLastGroups: boolean;
  };
};
/**
 *
 * @param {ActivityCode} roundId
 * @returns
 */
export const generateAssignments = (
  roundId: string,
  options?: Partial<GenerateAssignmentsPayload['options']>
): ReduxAction<typeof ActionType.GENERATE_ASSIGNMENTS, GenerateAssignmentsPayload> => ({
  type: ActionType.GENERATE_ASSIGNMENTS,
  roundId,
  options: {
    sortOrganizationStaffInLastGroups: true,
    ...options,
  },
});

export type EditActivityPayload = {
  where: Partial<Activity> & Pick<Activity, 'id'>;
  what: Partial<Activity> & Partial<Pick<Activity, 'id'>>;
};
/**
 * Queries activity based on the where and replaces it with the what
 * @param {*} where
 * @param {*} what
 * @returns
 */
export const editActivity = (
  where: EditActivityPayload['where'],
  what: EditActivityPayload['what']
): ReduxAction<typeof ActionType.EDIT_ACTIVITY, EditActivityPayload> => ({
  type: ActionType.EDIT_ACTIVITY,
  where,
  what,
});

export type UpdateGlobalExtensionPayload = { extensionData: Extension };
export const updateGlobalExtension = (
  extensionData: Extension
): ReduxAction<typeof ActionType.UPDATE_GLOBAL_EXTENSION, UpdateGlobalExtensionPayload> => ({
  type: ActionType.UPDATE_GLOBAL_EXTENSION,
  extensionData,
});

export type AddPersonPayload = { person: Person };
export const addPerson = (
  person: Person
): ReduxAction<typeof ActionType.ADD_PERSON, AddPersonPayload> => ({
  type: ActionType.ADD_PERSON,
  person,
});

export type UpdateRoundPayload = {
  roundId: string;
  roundData: Round;
};
export const updateRound = (
  roundId: string,
  roundData: Round
): ReduxAction<typeof ActionType.UPDATE_ROUND, UpdateRoundPayload> => ({
  type: ActionType.UPDATE_ROUND,
  roundId,
  roundData,
});

export type UpdateRawObjPayload = { key: keyof Competition; value: unknown };
export const updateRawObj = (
  key: keyof Competition,
  value: unknown
): ReduxAction<typeof ActionType.UPDATE_RAW_OBJ, UpdateRawObjPayload> => ({
  type: ActionType.UPDATE_RAW_OBJ,
  key,
  value,
});
