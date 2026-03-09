import {
  addAssignmentsToPerson,
  removeAssignmentsFromPerson,
  upsertAssignmentsOnPerson,
} from '../../lib/domain/persons';
import { mapIn, updateIn } from '../../lib/utils/utils';
import {
  getGroupifierActivityConfig,
  setGroupifierActivityConfig,
} from '../../lib/wcif/extensions/groupifier';
import { validateWcif } from '../../lib/wcif/validation';
import {
  type AddPersonAssignmentsPayload,
  type BulkAddPersonAssignmentsPayload,
  type BulkRemovePersonAssignmentsPayload,
  type BulkUpsertPersonAssignmentsPayload,
  type RemovePersonAssignmentsPayload,
  type UpsertPersonAssignmentsPayload,
} from '../actions';
import { type AppState } from '../initialState';
import type { Activity, Assignment, Competition, Person } from '@wca/helpers';

const determineErrors = (state: AppState): AppState => {
  if (!state.wcif) return state;
  return {
    ...state,
    errors: validateWcif(state.wcif),
  };
};

/**
 * Removes a person from featuredCompetitors for all activities where they don't have
 * a competitor assignment. This ensures featuredCompetitors stays in sync with actual
 * competitor assignments.
 *
 * @param wcif - The WCIF object to clean up
 * @param registrantId - The registrant ID of the person to clean up
 * @returns Updated WCIF with cleaned featuredCompetitors
 */
const fixFeaturedCompetitors = (wcif: Competition, registrantId: number): Competition => {
  const person = wcif.persons.find((p) => p.registrantId === registrantId);
  if (!person?.wcaUserId) {
    return wcif;
  }

  const wcaUserId = person.wcaUserId;

  // Get all activity IDs where this person has a competitor assignment
  const competitorActivityIds = new Set(
    person.assignments?.filter((a) => a.assignmentCode === 'competitor').map((a) => a.activityId) ||
      []
  );

  const updateFeaturedCompetitors = (activity: Activity): Activity => {
    const config = getGroupifierActivityConfig(activity);
    if (!config?.featuredCompetitorWcaUserIds) {
      return activity;
    }

    // Check if person should be removed from this activity's featuredCompetitors
    const isFeatured = config.featuredCompetitorWcaUserIds.includes(wcaUserId);
    const hasCompetitorAssignment = competitorActivityIds.has(activity.id);

    // Remove from featured if they're listed but don't have a competitor assignment
    if (isFeatured && !hasCompetitorAssignment) {
      const updatedIds = config.featuredCompetitorWcaUserIds.filter((id) => id !== wcaUserId);

      return setGroupifierActivityConfig(activity, {
        ...config,
        featuredCompetitorWcaUserIds: updatedIds,
      });
    }

    return activity;
  };

  const newSchedule = updateIn(wcif.schedule, 'venues', (venues) =>
    venues.map((venue) =>
      updateIn(venue, 'rooms', (rooms) =>
        rooms.map((room) =>
          updateIn(room, 'activities', (activities) =>
            activities.map((activity) => {
              return {
                ...updateFeaturedCompetitors(activity),
                childActivities: activity.childActivities.map((childActivity) =>
                  updateFeaturedCompetitors(childActivity)
                ),
              };
            })
          )
        )
      )
    )
  );

  return {
    ...wcif,
    schedule: newSchedule,
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
    wcif: state.wcif
      ? mapIn(state.wcif, 'persons', (person) =>
          person.registrantId === action.registrantId
            ? addAssignmentsToPerson(person, action.assignments)
            : person
        )
      : state.wcif,
  });

export const removePersonAssignments = (
  state: AppState,
  action: RemovePersonAssignmentsPayload
): AppState => {
  if (!state.wcif) return state;

  let updatedWcif: Competition = mapIn(state.wcif, 'persons', (p) =>
    p.registrantId === action.registrantId ? removeAssignmentsFromPerson(p, action.activityId) : p
  );

  updatedWcif = fixFeaturedCompetitors(updatedWcif, action.registrantId);

  return determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: updatedWcif,
  });
};

export const upsertPersonAssignments = (
  state: AppState,
  action: UpsertPersonAssignmentsPayload
): AppState => {
  if (!state.wcif) return determineErrors(state);

  let updatedWcif: Competition = mapIn(state.wcif, 'persons', (person) =>
    person.registrantId === action.registrantId
      ? upsertAssignmentsOnPerson(person, action.assignments)
      : person
  );

  updatedWcif = fixFeaturedCompetitors(updatedWcif, action.registrantId);

  return determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: updatedWcif,
  });
};

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
    wcif:
      state.wcif &&
      mapIn(state.wcif, 'persons', (person) => {
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
): AppState => {
  if (!state.wcif) return state;

  // Track registrant IDs that had assignments removed
  const affectedRegistrantIds = new Set<number>();

  let updatedWcif: Competition = mapIn(state.wcif, 'persons', (person) => {
    if (person.assignments?.length === 0 || !person.assignments) {
      return person;
    }

    // Find arguments to keep assignment: that is, return true
    return updateIn(person, 'assignments', (assignments) =>
      assignments?.filter((personAssignment: Assignment) => {
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

        const isBeingRemoved = filtersApplicable.length > 0;

        if (isBeingRemoved) {
          affectedRegistrantIds.add(person.registrantId);
        }

        // At least 1 filter is filtering them out
        return !isBeingRemoved;
      })
    );
  });

  // Clean up featuredCompetitors for all affected persons
  for (const registrantId of affectedRegistrantIds) {
    updatedWcif = fixFeaturedCompetitors(updatedWcif, registrantId);
  }

  return determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: updatedWcif,
  });
};

export const bulkUpsertPersonAssignments = (
  state: AppState,
  action: BulkUpsertPersonAssignmentsPayload
): AppState => {
  if (!state.wcif) return determineErrors(state);

  // Track registrant IDs that had assignments updated
  const affectedRegistrantIds = new Set<number>();

  let updatedWcif: Competition = mapIn(state.wcif, 'persons', (person: Person) => {
    const personAssignments = action.assignments
      .filter((a) => a.registrantId === person.registrantId)
      .map((a) => ({
        ...a.assignment,
        activityId: a.assignment.activityId,
      }));

    if (personAssignments.length > 0) {
      affectedRegistrantIds.add(person.registrantId);
      return upsertAssignmentsOnPerson(person, personAssignments);
    }

    return person;
  });

  // Clean up featuredCompetitors for all affected persons
  for (const registrantId of affectedRegistrantIds) {
    updatedWcif = fixFeaturedCompetitors(updatedWcif, registrantId);
  }

  return determineErrors({
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: updatedWcif,
  });
};
