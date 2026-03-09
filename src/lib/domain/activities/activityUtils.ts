import { shortTime } from '../../utils';
import { parseActivityCode } from './activityCode';
import { type Activity } from '@wca/helpers';

/** Activity Timing and Utility Functions */

/**
 * Calculates the duration of an activity in milliseconds
 * @param activity - Activity with startTime and endTime
 * @returns Duration in milliseconds
 */
export const activityDuration = ({ startTime, endTime }: { startTime: string; endTime: string }) =>
  new Date(endTime).getTime() - new Date(startTime).getTime();

/**
 * Returns a formatted duration string for an activity
 * @param activity - Activity with startTime and endTime
 * @param timezone - Timezone string (defaults to 'UTC')
 * @returns Formatted string like "09:00 - 11:00"
 */
export const activityDurationString = (
  { startTime, endTime }: { startTime: string; endTime: string },
  timezone = 'UTC'
) => `${shortTime(startTime, timezone)} - ${shortTime(endTime, timezone)}`;

/**
 * Checks if two activities overlap in time
 * @param first - First activity
 * @param second - Second activity
 * @returns True if activities overlap
 */
export const activitiesOverlap = (first: Activity, second: Activity) =>
  new Date(first.startTime) < new Date(second.endTime) &&
  new Date(second.startTime) < new Date(first.endTime);

/**
 * Calculates the time intersection between two activities in milliseconds
 * @param first - First activity
 * @param second - Second activity
 * @returns Intersection duration in milliseconds (0 if no overlap)
 */
export const activitiesIntersection = (first: Activity, second: Activity) => {
  if (!activitiesOverlap(first, second)) return 0;
  const [, middleStart, middleEnd] = [
    first.startTime,
    first.endTime,
    second.startTime,
    second.endTime,
  ].sort();
  /* Time distance between the two middle points in time. */
  return new Date(middleEnd).getTime() - new Date(middleStart).getTime();
};

/**
 * Comparator for sorting groups by group number
 * @param groupA - First group activity
 * @param groupB - Second group activity
 * @returns Comparison value for sorting
 */
export const byGroupNumber = (groupA: Activity, groupB: Activity) => {
  const parsedActivityCodeA = parseActivityCode(groupA.activityCode);
  const parsedActivityCodeB = parseActivityCode(groupB.activityCode);
  return (
    (parsedActivityCodeA.groupNumber || Number.MAX_SAFE_INTEGER) -
    (parsedActivityCodeB.groupNumber || Number.MAX_SAFE_INTEGER)
  );
};
