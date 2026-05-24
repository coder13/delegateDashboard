import { isCompetitorAssignment, isStaffAssignment } from '../domain/assignments';
import { parseActivityCode } from '../domain/activities';
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

const roundKeyFor = (activity: Activity) => {
  const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
  return roundNumber ? `${eventId}-r${roundNumber}` : null;
};

const groupNumberCountsByRound = (activities: Activity[]) => {
  const groupNumbersByRound = activities.reduce((groups, activity) => {
    const { groupNumber } = parseActivityCode(activity.activityCode);
    const roundKey = roundKeyFor(activity);

    if (roundKey && groupNumber) {
      groups.set(roundKey, (groups.get(roundKey) ?? new Set<number>()).add(groupNumber));
    }

    return groups;
  }, new Map<string, Set<number>>());

  return new Map(
    [...groupNumbersByRound.entries()].map(([roundKey, groupNumbers]) => [
      roundKey,
      groupNumbers.size,
    ])
  );
};

const isTwoGroupSameRoundHelpingThenCompeting = (
  helpingAssignment: ScheduledAssignment,
  competingAssignment: ScheduledAssignment,
  roundGroupCounts: Map<string, number>
) => {
  const helpingRoundKey = roundKeyFor(helpingAssignment.activity);
  const competingRoundKey = roundKeyFor(competingAssignment.activity);

  return (
    helpingRoundKey !== null &&
    helpingRoundKey === competingRoundKey &&
    roundGroupCounts.get(helpingRoundKey) === 2
  );
};

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
  const activities = findAllActivities(wcif);
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const roundGroupCounts = groupNumberCountsByRound(activities);

  return wcif.persons.filter((person) => {
    const assignments = assignmentsBySchedule(person.assignments, activityById);

    return assignments.some((assignment, index) => {
      const nextAssignment = assignments[index + 1];
      if (!nextAssignment) {
        return false;
      }

      return (
        isImmediateHelpingThenCompeting(assignment, nextAssignment) &&
        !isTwoGroupSameRoundHelpingThenCompeting(assignment, nextAssignment, roundGroupCounts)
      );
    });
  }).length;
};
