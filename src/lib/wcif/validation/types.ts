import type { Activity, Assignment, Person } from '@wca/helpers';

export const MISSING_ADVANCEMENT_CONDITION = 'missing_advancement_condition';
export const NO_SCHEDULE_ACTIVITIES_FOR_ROUND = 'no_schedule_activities_for_round';
export const NO_ROUNDS_FOR_ACTIVITY = 'no_rounds_for_activity';
export const MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT = 'missing_activity_for_person_assignment';
export const PERSON_ASSIGNMENT_SCHEDULE_CONFLICT = 'person_assignment_schedule_conflict';

export type ValidationErrorType =
  | typeof MISSING_ADVANCEMENT_CONDITION
  | typeof NO_SCHEDULE_ACTIVITIES_FOR_ROUND
  | typeof NO_ROUNDS_FOR_ACTIVITY
  | typeof MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT
  | typeof PERSON_ASSIGNMENT_SCHEDULE_CONFLICT;

export interface ConflictingAssignment {
  id: string;
  assignmentA: Assignment & {
    activity: Activity;
    room: { id: number; name: string } | null | undefined;
  };
  assignmentB: Assignment & {
    activity: Activity;
    room: { id: number; name: string } | null | undefined;
  };
}

export type WcifError<T extends object> = {
  type: string;
  key: string;
  message: string;
  data: T;
};

export type ValidationError = WcifError<{
  eventId?: string;
  activityCode?: string;
  person?: Person;
  assignment?: Assignment;
  conflictingAssignments?: ConflictingAssignment[];
}>;
