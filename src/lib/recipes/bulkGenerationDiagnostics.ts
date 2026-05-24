import { isCompetitorAssignment, isStaffAssignment } from '../domain/assignments';
import { findAllActivities } from '../wcif/activities';
import type { Activity, Assignment, Competition } from '@wca/helpers';

interface ScheduledAssignment {
  assignment: Assignment;
  activity: Activity;
}

const activityStartTime = (activity: Activity) =>
  activity.startTime ? new Date(activity.startTime).getTime() : Number.POSITIVE_INFINITY;

const activityEndTime = (activity: Activity) =>
  activity.endTime ? new Date(activity.endTime).getTime() : Number.POSITIVE_INFINITY;

const assignmentsBySchedule = (
  assignments: Assignment[] | undefined,
  activityById: Map<number, Activity>
): ScheduledAssignment[] =>
  (assignments ?? [])
    .map((assignment) => {
      const activity = activityById.get(assignment.activityId);
      return activity ? { assignment, activity } : null;
    })
    .filter((assignment): assignment is ScheduledAssignment => Boolean(assignment))
    .sort(
      (assignmentA, assignmentB) =>
        activityStartTime(assignmentA.activity) - activityStartTime(assignmentB.activity) ||
        activityEndTime(assignmentA.activity) - activityEndTime(assignmentB.activity) ||
        assignmentA.activity.id - assignmentB.activity.id
    );

const isImmediateHelpingThenCompeting = (
  helpingAssignment: ScheduledAssignment,
  competingAssignment: ScheduledAssignment
) =>
  isStaffAssignment(helpingAssignment.assignment) &&
  isCompetitorAssignment(competingAssignment.assignment) &&
  helpingAssignment.activity.endTime &&
  competingAssignment.activity.startTime &&
  new Date(helpingAssignment.activity.endTime).getTime() ===
    new Date(competingAssignment.activity.startTime).getTime();

export const countPeopleWithImmediateHelpingThenCompetingAssignments = (wcif: Competition) => {
  const activityById = new Map(findAllActivities(wcif).map((activity) => [activity.id, activity]));

  return wcif.persons.filter((person) => {
    const assignments = assignmentsBySchedule(person.assignments, activityById);

    return assignments.some((assignment, index) => {
      const nextAssignment = assignments[index + 1];
      return nextAssignment
        ? isImmediateHelpingThenCompeting(assignment, nextAssignment)
        : false;
    });
  }).length;
};
