import {
  addAssignmentsToPerson,
  removeAssignmentsFromPerson,
  upsertAssignmentsOnPerson,
} from '../../lib/domain/persons';
import { mapIn, updateIn } from '../../lib/utils/utils';
import { validateWcif } from '../../lib/wcif/validation';
import {
  AddPersonAssignmentsPayload,
  BulkAddPersonAssignmentsPayload,
  BulkRemovePersonAssignmentsPayload,
  BulkUpsertPersonAssignmentsPayload,
  RemovePersonAssignmentsPayload,
  UpsertPersonAssignmentsPayload,
} from '../actions';
import { AppState } from '../initialState';
import { Assignment } from '@wca/helpers';

const determineErrors = (state: AppState): AppState => {
  if (!state.wcif) return state;
  return {
    ...state,
    errors: validateWcif(state.wcif),
  };
};

export const addPersonAssignments = (
  state: AppState,
  action: AddPersonAssignmentsPayload
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) =>
      person.registrantId === action.registrantId
        ? addAssignmentsToPerson(person, action.assignments)
        : person
    ),
  });

export const removePersonAssignments = (
  state: AppState,
  action: RemovePersonAssignmentsPayload
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person: any) =>
      person.registrantId === action.registrantId
        ? removeAssignmentsFromPerson(person, action.activityId)
        : person
    ),
  });

export const upsertPersonAssignments = (
  state: AppState,
  action: UpsertPersonAssignmentsPayload
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person: any) =>
      person.registrantId === action.registrantId
        ? upsertAssignmentsOnPerson(person, action.assignments)
        : person
    ),
    ...state.wcif,
  });

/**
 * @param {*} state
 * @param {{assignments: InProgressAssignmment[]}} action
 * @returns
 */
export const bulkAddPersonAssignments = (
  state: AppState,
  action: BulkAddPersonAssignmentsPayload
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person: any) => {
      const personAssignments = action.assignments
        .filter((a) => a.registrantId === person.registrantId)
        .map((a) => ({
          ...a.assignment,
        }));

      if (personAssignments.length > 0) {
        return addAssignmentsToPerson(person, personAssignments);
      }

      return person;
    }),
  });

/**
 * Assume we're removing by default
 * Look for arguments to keep the assignment for the person
 */
export const bulkRemovePersonAssignments = (
  state: AppState,
  action: BulkRemovePersonAssignmentsPayload
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person: any) => {
      if (person.assignments?.length === 0 || !person.assignments) {
        return person;
      }

      // Find arguments to keep assignment: that is, return true
      return updateIn(person, ['assignments'], (assignments: any) =>
        assignments.filter((personAssignment: Assignment) => {
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
  });

export const bulkUpsertPersonAssignments = (
  state: AppState,
  action: BulkUpsertPersonAssignmentsPayload
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person: any) => {
      const personAssignments = action.assignments
        .filter((a) => a.registrantId === person.registrantId)
        .map((a) => ({
          ...a.assignment,
          activityId: a.assignment.activityId,
        }));

      if (personAssignments.length > 0) {
        return upsertAssignmentsOnPerson(person, personAssignments);
      }

      return person;
    }),
  });
