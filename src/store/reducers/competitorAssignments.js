import {
  addAssignmentsToPerson,
  removeAssignmentsFromPerson,
  upsertAssignmentsOnPerson,
} from '../../lib/persons';
import { mapIn, updateIn } from '../../lib/utils';
import { validateWcif } from '../../lib/wcif-validation';

const determineErrors = (state) => ({
  ...state,
  errors: validateWcif(state.wcif),
});

export const addPersonAssignments = (state, action) =>
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

export const removePersonAssignments = (state, action) =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) =>
      person.registrantId === action.registrantId
        ? removeAssignmentsFromPerson(person, action.activityId)
        : person
    ),
  });

export const upsertPersonAssignments = (state, action) =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) =>
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
export const bulkAddPersonAssignments = (state, action) =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) => {
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
export const bulkRemovePersonAssignments = (state, action) =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) => {
      if (person.assignments.length === 0) {
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
    }),
  });

export const bulkUpsertPersonAssignments = (state, action) =>
  determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: mapIn(state.wcif, ['persons'], (person) => {
      const personAssignments = action.assignments
        .filter((a) => a.registrantId === person.registrantId)
        .map((a) => ({
          activityId: a.activityId,
          ...a.assignment,
        }));

      if (personAssignments.length > 0) {
        return upsertAssignmentsOnPerson(person, personAssignments);
      }

      return person;
    }),
  });
