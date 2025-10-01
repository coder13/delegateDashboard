import { Assignment } from '@wca/helpers';
import {
  addAssignmentsToPerson,
  removeAssignmentsFromPerson,
  upsertAssignmentsOnPerson,
} from '../../lib/persons';
import { mapIn, updateIn } from '../../lib/utils';
import { validateWcif } from '../../lib/wcif-validation';
import { AppState } from '../initialState';

interface InProgressAssignment {
  registrantId: number;
  activityId?: number;
  assignmentCode?: string;
  assignment: Assignment;
}

interface AddPersonAssignmentsAction {
  registrantId: number;
  assignments: Assignment[];
}

interface RemovePersonAssignmentsAction {
  registrantId: number;
  activityId: number;
}

interface UpsertPersonAssignmentsAction {
  registrantId: number;
  assignments: Assignment[];
}

interface BulkAddPersonAssignmentsAction {
  assignments: InProgressAssignment[];
}

interface BulkRemovePersonAssignmentsAction {
  assignments: InProgressAssignment[];
}

interface BulkUpsertPersonAssignmentsAction {
  assignments: InProgressAssignment[];
}

const determineErrors = (state: AppState): AppState => ({
  ...state,
  errors: state.wcif ? validateWcif(state.wcif) : [],
});

export const addPersonAssignments = (
  state: AppState,
  action: AddPersonAssignmentsAction
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: state.wcif
      ? mapIn(state.wcif, ['persons'], (person) =>
          person.registrantId === action.registrantId
            ? addAssignmentsToPerson(person, action.assignments)
            : person
        )
      : null,
  });

export const removePersonAssignments = (
  state: AppState,
  action: RemovePersonAssignmentsAction
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: state.wcif
      ? mapIn(state.wcif, ['persons'], (person) =>
          person.registrantId === action.registrantId
            ? removeAssignmentsFromPerson(person, action.activityId)
            : person
        )
      : null,
  });

export const upsertPersonAssignments = (
  state: AppState,
  action: UpsertPersonAssignmentsAction
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: state.wcif
      ? mapIn(state.wcif, ['persons'], (person) =>
          person.registrantId === action.registrantId
            ? upsertAssignmentsOnPerson(person, action.assignments)
            : person
        )
      : null,
  });

export const bulkAddPersonAssignments = (
  state: AppState,
  action: BulkAddPersonAssignmentsAction
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: state.wcif
      ? mapIn(state.wcif, ['persons'], (person) => {
          const personAssignments = action.assignments
            .filter((a) => a.registrantId === person.registrantId)
            .map((a) => ({
              ...a.assignment,
            }));

          if (personAssignments.length > 0) {
            return addAssignmentsToPerson(person, personAssignments);
          }

          return person;
        })
      : null,
  });

/**
 * Assume we're removing by default
 * Look for arguments to keep the assignment for the person
 */
export const bulkRemovePersonAssignments = (
  state: AppState,
  action: BulkRemovePersonAssignmentsAction
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: state.wcif
      ? mapIn(state.wcif, ['persons'], (person) => {
          if (!person.assignments || person.assignments.length === 0) {
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
        })
      : null,
  });

export const bulkUpsertPersonAssignments = (
  state: AppState,
  action: BulkUpsertPersonAssignmentsAction
): AppState =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: state.wcif
      ? mapIn(state.wcif, ['persons'], (person) => {
          const personAssignments = action.assignments
            .filter((a) => a.registrantId === person.registrantId)
            .map((a) => ({
              ...a.assignment,
              activityId: a.activityId!,
            }));

          if (personAssignments.length > 0) {
            return upsertAssignmentsOnPerson(person, personAssignments);
          }

          return person;
        })
      : null,
  });
