import { eventNameById } from './events';
import { shortTime } from './utils';
import { getExtensionData } from './wcif-extensions';
import { Activity, Competition, EventId, Room, Round } from '@wca/helpers';

interface ActivityCode {
  eventId: EventId;
  roundNumber?: number;
  groupNumber?: number;
  attemptNumber?: number;
}

/** Activity Codes */

const ParseActivityCodeCache = new Map();
/**
 *
 * @param {*} activityCode
 * @returns
 */
export const parseActivityCode = (activityCode: string): ActivityCode => {
  if (ParseActivityCodeCache.has(activityCode)) {
    return ParseActivityCodeCache.get(activityCode);
  }

  const [, e, r, g, a] = activityCode.match(/(\w+)(?:-r(\d+))?(?:-g(\d+))?(?:-a(\d+))?/) || [];
  const parsedActivityCode = {
    eventId: e as EventId,
    roundNumber: r ? parseInt(r, 10) : undefined,
    groupNumber: g ? parseInt(g, 10) : undefined,
    attemptNumber: a ? parseInt(a, 10) : undefined,
  };

  ParseActivityCodeCache.set(activityCode, parsedActivityCode);
  return parsedActivityCode;
};

/**
 * Creates an activity code from a parsed activity code
 * @param parsedActivityCode
 * @returns
 */
export const createActivityCode = (parsedActivityCode: ActivityCode) => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parsedActivityCode;
  return `${eventId}${roundNumber ? `-r${roundNumber}` : ''}${
    groupNumber ? `-g${groupNumber}` : ''
  }${attemptNumber ? `-a${attemptNumber}` : ''}`;
};

export const activityCodeToName = (activityCode: string) => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(activityCode);
  return [
    eventId && eventNameById(eventId),
    roundNumber && `Round ${roundNumber}`,
    groupNumber && `Group ${groupNumber}`,
    attemptNumber && `Attempt ${attemptNumber}`,
  ]
    .filter((x) => x)
    .join(', ');
};

/**
 * Determines if the child activitiyCode is a child of the parent activityCode
 * @param {*} parentActivitiyCode
 * @returns
 */
export const activityCodeIsChild = (parentActivitiyCode: string, childActivityCode: string) => {
  const parent = parseActivityCode(parentActivitiyCode);
  const child = parseActivityCode(childActivityCode);

  return (
    parent.eventId === child.eventId &&
    (!parent.roundNumber || parent.roundNumber === child.roundNumber) &&
    (!parent.groupNumber || parent.groupNumber === child.groupNumber) &&
    (!parent.attemptNumber || parent.attemptNumber === child.attemptNumber)
  );
};
export const hasDistributedAttempts = (activityCode: string) =>
  ['333fm', '333mbf'].includes(parseActivityCode(activityCode).eventId);

export const activityDuration = ({ startTime, endTime }: { startTime: string; endTime: string }) =>
  new Date(endTime).getTime() - new Date(startTime).getTime();

export const activityDurationString = ({ startTime, endTime }: { startTime: string; endTime: string }, timezone = 'UTC') =>
  `${shortTime(startTime, timezone)} - ${shortTime(endTime, timezone)}`;

export const activitiesOverlap = (first: Activity, second: Activity) =>
  new Date(first.startTime) < new Date(second.endTime) &&
  new Date(second.startTime) < new Date(first.endTime);

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

export const findRooms = (wcif: Competition) =>
  wcif.schedule.venues?.map((venue) => venue.rooms).flat() || [];

const findId = (activites: Activity[], activityId: number): boolean =>
  activites.some(
    ({ id, activities, childActivities }) =>
      id === activityId ||
      (activities ? findId(activities, activityId) : false) ||
      (childActivities ? findId(childActivities, activityId) : false)
  );

export const roomByActivity = (wcif: Competition, activityId: number) =>
  findRooms(wcif)?.find((room) => findId(room.activities, activityId));

export interface ActivityWithParent extends Activity {
  parent: Activity;
}

/**
 * Finds all child activities for an activity.
 * @param activity
 * @returns
 */
export const allChildActivities = (activity: Activity): ActivityWithParent[] => {
  if (!activity.childActivities || activity.childActivities.length === 0) {
    return [];
  }

  const childActivities = activity.childActivities.map((child) => ({
    ...child,
    parent: activity,
  }));

  return [...childActivities, childActivities.map(allChildActivities)].flat(2);
};

/**
 * Creates a flat array of activities
 */
export const findAllActivities = (wcif: Competition) => {
  // Rounds
  const activities = findAllRoundActivities(wcif);
  return [...activities, ...activities.flatMap(allChildActivities)];
};

export interface ActivityWithRoom extends Activity {
  room: Room;
}

/**
 * Creates a flat array of activities
 */
export const findAllRoundActivities = (wcif: Competition): ActivityWithRoom[] => {
  return findRooms(wcif).flatMap((room) => room.activities.map((a) => ({ ...a, room })));
};

export const findAllActivitiesByRoom = (wcif: Competition, roomId: number) => {
  const room = findRooms(wcif).find((room) => room.id === roomId);

  if (!room) {
    console.error('Could not find activities for room', roomId);
    return undefined;
  }

  return room.activities.map(allChildActivities).flat();
};

export const findRoundActivitiesById = (wcif: Competition, roundActivityCode: string) =>
  findAllActivities(wcif).filter((activity) => activity.activityCode === roundActivityCode);

export const findGroupActivitiesByRound = (wcif: Competition, roundId: string) =>
  findRoundActivitiesById(wcif, roundId)
    .map((roundActivity) => allChildActivities(roundActivity))
    .flat();

/* Assigning tasks invokes activityById enormous number of times.
   But during that process activities (schedule) don't change.
   Caching is gives an invaluable speed boost in this case. */
const activitiesByIdCachedBySchedule = new Map();

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

export const generateNextChildActivityId = (wcif: Competition) => {
  return findAllActivities(wcif).reduce((maxAcc, activity) => Math.max(activity.id, maxAcc), 0) + 1;
};

/**
 * Comparator for sorting groups by group number
 */
export const byGroupNumber = (groupA: Activity, groupB: Activity) => {
  const parsedActivityCodeA = parseActivityCode(groupA.activityCode);
  const parsedActivityCodeB = parseActivityCode(groupB.activityCode);
  return (
    (parsedActivityCodeA.groupNumber || Number.MAX_SAFE_INTEGER) -
    (parsedActivityCodeB.groupNumber || Number.MAX_SAFE_INTEGER)
  );
};

export const findResultsForActivityCode = (wcif: Competition, activityCode: string) => {
  const { eventId } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  return event?.rounds?.find((r) => r.id === activityCode)?.results;
};

export const createGroupActivity = (
  id: number,
  roundActivity: Activity,
  groupNumber: number,
  startTime: string,
  endTime: string
): Activity => {
  const parsedRoundActivityCode = parseActivityCode(roundActivity.activityCode);

  const newActivityCode = createActivityCode({
    ...parsedRoundActivityCode,
    groupNumber,
  });

  return {
    id: id,
    name: activityCodeToName(newActivityCode),
    activityCode: newActivityCode,
    startTime: startTime || roundActivity.startTime, // spread across groups
    endTime: endTime || roundActivity.endTime,
    childActivities: [],
    extensions: [],
  };
};

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

export const cumulativeGroupCount = (round: Round) => {
  const groupsData = getExtensionData('groups', round);
  if (groupsData.spreadGroupsAcrossStages) {
    return groupsData.groups as number;
  } else {
    return Object.values(groupsData.groups as Record<number, number>).reduce(
      (acc, groupCount) => acc + groupCount,
      0
    );
  }
};

/**
 * Searches for an activity recursively and returns a new version of the activity
 */
export const findAndReplaceActivity = (
  where: Partial<Activity> & { id: string },
  what: Partial<Activity>
) => {
  return (activity: Activity): Activity => {
    if (activity.id === where.id) {
      return {
        ...activity,
        ...what,
      } as Activity;
    }

    return {
      ...activity,
      childActivities: activity.childActivities.map(findAndReplaceActivity(where, what)),
    } as Activity;
  };
};
