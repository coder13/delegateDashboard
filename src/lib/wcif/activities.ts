import { parseActivityCode } from '../domain/activities/activityCode';
import type { ActivityWithParent, ActivityWithRoom } from '../domain/types';
import { type Activity, type Competition } from '@wca/helpers';

/** WCIF Activity Search and Lookup Functions */

/**
 * Finds all child activities for an activity recursively
 * @param activity - The parent activity
 * @returns Flat array of all child activities with parent reference
 */
export const allChildActivities = (activity: Activity): ActivityWithParent[] => {
  if (!activity.childActivities || activity.childActivities.length === 0) {
    return [];
  }

  const childActivities = activity.childActivities.map((child) => ({
    ...child,
    parent: activity,
  })) as ActivityWithParent[];

  return [...childActivities, childActivities.map(allChildActivities)].flat(2);
};

/**
 * Finds all rooms in the competition schedule
 * @param wcif - The competition WCIF
 * @returns Array of all rooms
 */
export const findRooms = (wcif: Competition) =>
  wcif.schedule.venues?.map((venue) => venue.rooms).flat() || [];

/**
 * Recursively searches for an activity ID in a list of activities
 */
const findId = (activities: Activity[], activityId: number): boolean =>
  activities.some(
    ({
      id,
      activities,
      childActivities,
    }: {
      id: number;
      activities?: Activity[];
      childActivities?: Activity[];
    }) =>
      id === activityId ||
      (activities ? findId(activities, activityId) : false) ||
      (childActivities ? findId(childActivities, activityId) : false)
  );

/**
 * Finds the room containing a specific activity
 * @param wcif - The competition WCIF
 * @param activityId - The activity ID to find
 * @returns The room containing the activity, or undefined
 */
export const roomByActivity = (wcif: Competition, activityId: number) =>
  findRooms(wcif)?.find((room) => findId(room.activities, activityId));

/**
 * Creates a flat array of all activities in the competition
 * @param wcif - The competition WCIF
 * @returns Flat array of all activities including children
 */
export const findAllActivities = (wcif: Competition) => {
  const activities = findAllRoundActivities(wcif);
  return [...activities, ...activities.flatMap(allChildActivities)];
};

/**
 * Creates a flat array of all round activities (top-level activities in rooms)
 * @param wcif - The competition WCIF
 * @returns Flat array of round activities with room reference
 */
export const findAllRoundActivities = (wcif: Competition): ActivityWithRoom[] => {
  return findRooms(wcif).flatMap((room) => room.activities.map((a) => ({ ...a, room })));
};

/**
 * Finds all activities for a specific room
 * @param wcif - The competition WCIF
 * @param roomId - The room ID
 * @returns Flat array of all activities in the room, or undefined if room not found
 */
export const findAllActivitiesByRoom = (wcif: Competition, roomId: number) => {
  const room = findRooms(wcif).find((room) => room.id === roomId);

  if (!room) {
    console.error('Could not find activities for room', roomId);
    return undefined;
  }

  return room.activities.map(allChildActivities).flat();
};

/**
 * Finds all round activities matching a specific activity code
 * @param wcif - The competition WCIF
 * @param roundActivityCode - The round activity code to search for
 * @returns Array of matching round activities
 */
export const findRoundActivitiesById = (wcif: Competition, roundActivityCode: string) =>
  findAllActivities(wcif).filter((activity) => activity.activityCode === roundActivityCode);

/**
 * Finds all group activities for a specific round
 * @param wcif - The competition WCIF
 * @param roundId - The round ID (activity code)
 * @returns Flat array of all group activities
 */
export const findGroupActivitiesByRound = (wcif: Competition, roundId: string) =>
  findRoundActivitiesById(wcif, roundId)
    .map((roundActivity) => allChildActivities(roundActivity))
    .flat();

/* Assigning tasks invokes activityById enormous number of times.
   But during that process activities (schedule) don't change.
   Caching gives an invaluable speed boost in this case. */
const activitiesByIdCachedBySchedule = new Map();

/**
 * Finds an activity by its ID (with caching for performance)
 * @param wcif - The competition WCIF
 * @param activityId - The activity ID to find
 * @returns The activity, or undefined if not found
 */
export const findActivityById = (wcif: Competition, activityId: number) => {
  if (activitiesByIdCachedBySchedule.has(wcif.schedule)) {
    return activitiesByIdCachedBySchedule.get(wcif.schedule).get(activityId);
  }

  const activities = findAllActivities(wcif);
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  activitiesByIdCachedBySchedule.set(wcif.schedule, activitiesById);
  return activitiesById.get(activityId);
};

const activitiesByCodeAndRoomCache = new Map();

/**
 * Finds an activity by its activity code and room ID (with caching)
 * @param wcif - The competition WCIF
 * @param roomId - The room ID
 * @param activityCode - The activity code
 * @returns The activity
 * @throws Error if activity not found
 */
export const activityByActivityCode = (wcif: Competition, roomId: number, activityCode: string) => {
  const id = `${roomId}-${activityCode}`;

  if (activitiesByCodeAndRoomCache.has(id)) {
    return activitiesByCodeAndRoomCache.get(id);
  }

  const activities = findAllActivitiesByRoom(wcif, roomId);
  const activity = activities?.find((activity) => activity.activityCode === activityCode);

  if (activity) {
    activitiesByCodeAndRoomCache.set(id, activity);
    return activity;
  }

  throw new Error(`Activity not found: ${activityCode} in room: ${roomId}`);
};

/**
 * Generates the next available child activity ID
 * @param wcif - The competition WCIF
 * @returns The next available ID
 */
export const generateNextChildActivityId = (wcif: Competition) => {
  return findAllActivities(wcif).reduce((maxAcc, activity) => Math.max(activity.id, maxAcc), 0) + 1;
};

/**
 * Finds results for a specific activity code
 * @param wcif - The competition WCIF
 * @param activityCode - The activity code
 * @returns The results array, or undefined if not found
 */
export const findResultsForActivityCode = (wcif: Competition, activityCode: string) => {
  const { eventId } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  return event?.rounds?.find((r) => r.id === activityCode)?.results;
};

/**
 * Finds the earliest start time across all activities for a round
 * @param wcif - The competition WCIF
 * @param roundId - The round ID (activity code)
 * @returns The earliest start time as a Date, or undefined if no activities found
 */
export const earliestStartTimeForRound = (wcif: Competition, roundId: string) => {
  const roundActivities = findRoundActivitiesById(wcif, roundId);

  if (!roundActivities.length) {
    return;
  }

  return roundActivities.reduce(
    (minStartTime, activity) =>
      activity.startTime && new Date(activity.startTime).getTime() < minStartTime.getTime()
        ? new Date(activity.startTime)
        : minStartTime,
    new Date(roundActivities[0].startTime)
  );
};
