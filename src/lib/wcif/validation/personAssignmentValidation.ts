import {
  activitiesOverlap,
  findActivityById,
  findAllActivities,
  roomByActivity,
} from '../../domain';
import { acceptedRegistrations } from '../../domain';
import {
  MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
  PERSON_ASSIGNMENT_SCHEDULE_CONFLICT,
  type ConflictingAssignment,
  type ValidationError,
} from './types';
import type { Competition, Person } from '@wca/helpers';

const pluralizeWord = (count: number, singular: string, plural?: string) =>
  count === 1 ? singular : plural || singular + 's';

/**
 * Validates that all person assignments reference existing activities
 */
export const validatePersonAssignmentActivitiesExist = (wcif: Competition): ValidationError[] => {
  const errors: ValidationError[] = [];
  const allActivityIds = findAllActivities(wcif).map((activity) => activity.id);

  acceptedRegistrations(wcif.persons).forEach((person) => {
    person.assignments?.forEach((assignment) => {
      if (allActivityIds.includes(assignment.activityId)) {
        return;
      }

      errors.push({
        type: MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
        key: [
          MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
          person.registrantId,
          assignment.activityId,
        ].join('-'),
        message: `${person.name} (id: ${person.registrantId}) has assignment for activity that does not exist`,
        data: {
          person,
          assignment,
        },
      });
    });
  });

  return errors;
};

/**
 * Finds all conflicting assignments for a person
 */
const findConflictingAssignmentsForPerson = (
  wcif: Competition,
  person: Person
): ConflictingAssignment[] => {
  const conflictingAssignments: ConflictingAssignment[] = [];

  person.assignments?.forEach((assignment, index) => {
    const activity = findActivityById(wcif, assignment.activityId);
    if (!activity) {
      return;
    }

    const otherAssignments = person.assignments?.slice(index + 1) || [];
    otherAssignments.forEach((otherAssignment) => {
      const otherActivity = findActivityById(wcif, otherAssignment.activityId);
      if (!otherActivity) {
        return;
      }

      if (!activitiesOverlap(activity, otherActivity)) {
        return;
      }

      conflictingAssignments.push({
        id: [
          person.registrantId,
          assignment.activityId,
          assignment.assignmentCode,
          otherAssignment.activityId,
          otherAssignment.assignmentCode,
        ].join('-'),
        assignmentA: {
          ...assignment,
          activity,
          room: roomByActivity(wcif, assignment.activityId),
        },
        assignmentB: {
          ...otherAssignment,
          activity: otherActivity,
          room: roomByActivity(wcif, otherAssignment.activityId),
        },
      });
    });
  });

  return conflictingAssignments;
};

/**
 * Validates that person assignments don't have schedule conflicts
 */
export const validatePersonAssignmentScheduleConflicts = (wcif: Competition): ValidationError[] => {
  const errors: ValidationError[] = [];

  acceptedRegistrations(wcif.persons).forEach((person) => {
    const conflictingAssignments = findConflictingAssignmentsForPerson(wcif, person);

    if (conflictingAssignments.length === 0) {
      return;
    }

    errors.push({
      type: PERSON_ASSIGNMENT_SCHEDULE_CONFLICT,
      key: [PERSON_ASSIGNMENT_SCHEDULE_CONFLICT, person.registrantId].join('-'),
      message: `${person.name} (id: ${person.registrantId}) has ${
        conflictingAssignments.length
      } conflicting ${pluralizeWord(conflictingAssignments.length, 'assignment')}`,
      data: {
        person,
        conflictingAssignments,
      },
    });
  });

  return errors;
};

/**
 * Validates all person assignment-related requirements
 */
export const validatePersonAssignments = (wcif: Competition): ValidationError[] => {
  const missingActivityErrors = validatePersonAssignmentActivitiesExist(wcif);
  const scheduleConflictErrors = validatePersonAssignmentScheduleConflicts(wcif);

  return [...missingActivityErrors, ...scheduleConflictErrors];
};
