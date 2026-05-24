import {
  activityCodeIsChild,
  hasDistributedAttempts,
  parseActivityCode,
} from '../../../lib/domain/activities';
import { personsShouldBeInRound } from '../../../lib/domain/persons';
import { findAllActivities } from '../../../lib/wcif/activities';
import { formatDateTimeRange } from '../../../lib/utils/time';
import type { Activity, Assignment, Competition, Event, Round } from '@wca/helpers';

export interface BulkRoundRow {
  roundId: string;
  eventId: string;
  roundNumber: number;
  label: string;
  scheduledTime: string;
  scheduleStartTime: string | null;
  scheduleEndTime: string | null;
  roundSize: number;
  existingGroupCount: number;
  competitorAssignmentCount: number;
  staffAssignmentCount: number;
  warnings: string[];
  selectable: boolean;
}

const eventRoundLabel = (event: Event, round: Round) => {
  const { roundNumber } = parseActivityCode(round.id);
  return `${event.id.toUpperCase()} Round ${roundNumber ?? '?'}`;
};

const scheduledTimeForActivities = (activities: Activity[]) => {
  const { startTime, endTime } = scheduleBoundsForActivities(activities);
  return startTime && endTime ? formatDateTimeRange(startTime, endTime) : 'Unscheduled';
};

const scheduleBoundsForActivities = (activities: Activity[]) => {
  const activitiesWithTimes = activities.filter((activity) => activity.startTime && activity.endTime);
  if (activitiesWithTimes.length === 0) {
    return { startTime: null, endTime: null };
  }

  const startTime = activitiesWithTimes
    .map((activity) => activity.startTime)
    .sort((timeA, timeB) => timeA.localeCompare(timeB))[0];
  const endTime = activitiesWithTimes
    .map((activity) => activity.endTime)
    .sort((timeA, timeB) => timeB.localeCompare(timeA))[0];

  return { startTime, endTime };
};

const assignmentIsInRound = (
  assignment: Assignment,
  roundId: string,
  activityById: Map<number, Activity>
) => {
  const activity = activityById.get(assignment.activityId);
  return activity ? activityCodeIsChild(roundId, activity.activityCode) : false;
};

const countAssignments = (
  wcif: Competition,
  roundId: string,
  activityById: Map<number, Activity>,
  predicate: (assignment: Assignment) => boolean
) =>
  wcif.persons.reduce(
    (count, person) =>
      count +
      (person.assignments ?? []).filter(
        (assignment) => assignmentIsInRound(assignment, roundId, activityById) && predicate(assignment)
      ).length,
    0
  );

export const buildBulkRoundRows = (wcif: Competition): BulkRoundRow[] => {
  const allActivities = findAllActivities(wcif);
  const activityById = new Map(allActivities.map((activity) => [activity.id, activity]));

  return wcif.events.flatMap((event) =>
    event.rounds
      .filter((round) => !hasDistributedAttempts(round.id))
      .map((round) => {
        const { roundNumber } = parseActivityCode(round.id);
        const roundActivities = allActivities.filter((activity) => activity.activityCode === round.id);
        const scheduleBounds = scheduleBoundsForActivities(roundActivities);
        const existingGroupCount = roundActivities.reduce(
          (count, activity) => count + (activity.childActivities ?? []).length,
          0
        );
        const roundSize = personsShouldBeInRound(round)(wcif.persons).length;
        const competitorAssignmentCount = countAssignments(
          wcif,
          round.id,
          activityById,
          (assignment) => assignment.assignmentCode === 'competitor'
        );
        const staffAssignmentCount = countAssignments(
          wcif,
          round.id,
          activityById,
          (assignment) => assignment.assignmentCode !== 'competitor'
        );
        const warnings = [
          roundSize === 0 ? 'No competitors' : null,
          roundActivities.length === 0 ? 'No scheduled activity' : null,
          existingGroupCount === 0 ? 'No groups' : null,
        ].filter((warning): warning is string => Boolean(warning));

        return {
          roundId: round.id,
          eventId: event.id,
          roundNumber: roundNumber ?? 0,
          label: eventRoundLabel(event, round),
          scheduledTime: scheduledTimeForActivities(roundActivities),
          scheduleStartTime: scheduleBounds.startTime,
          scheduleEndTime: scheduleBounds.endTime,
          roundSize,
          existingGroupCount,
          competitorAssignmentCount,
          staffAssignmentCount,
          warnings,
          selectable: roundSize > 0,
        };
      })
  );
};

export const defaultSelectedRoundIds = (rows: BulkRoundRow[]) =>
  new Set(rows.filter((row) => row.roundNumber === 1 && row.selectable).map((row) => row.roundId));

export const scheduleOrderedRoundIds = (rows: BulkRoundRow[]) =>
  [...rows]
    .sort((rowA, rowB) => {
      if (rowA.scheduleStartTime && rowB.scheduleStartTime) {
        return (
          rowA.scheduleStartTime.localeCompare(rowB.scheduleStartTime) ||
          (rowA.scheduleEndTime ?? '').localeCompare(rowB.scheduleEndTime ?? '') ||
          rowA.roundId.localeCompare(rowB.roundId)
        );
      }

      if (rowA.scheduleStartTime) {
        return -1;
      }

      if (rowB.scheduleStartTime) {
        return 1;
      }

      return rowA.roundId.localeCompare(rowB.roundId);
    })
    .map((row) => row.roundId);

export const mergeRoundOrder = (roundIds: string[], persistedRoundIds: string[]) => {
  const currentRoundIds = new Set(roundIds);
  const persistedCurrentRoundIds = persistedRoundIds.filter((roundId) => currentRoundIds.has(roundId));
  const missingRoundIds = roundIds.filter((roundId) => !persistedCurrentRoundIds.includes(roundId));

  return [...persistedCurrentRoundIds, ...missingRoundIds];
};
