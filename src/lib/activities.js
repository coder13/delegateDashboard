import { eventNameById } from './events';
import { mapIn, updateIn, setIn, flatMap, shortTime } from './utils';
import { getExtensionData } from './wcif-extensions';

/**
 *
 * @param {*} activityCode
 * @returns
 */
export const parseActivityCode = (activityCode) => {
  const [, e, r, g, a] = activityCode.match(/(\w+)(?:-r(\d+))?(?:-g(\d+))?(?:-a(\d+))?/);
  return {
    eventId: e,
    roundNumber: r && parseInt(r, 10),
    groupNumber: g && parseInt(g, 10),
    attemptNumber: a && parseInt(a, 10),
  };
};

export const activityCodeToName = (activityCode) => {
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

export const hasDistributedAttempts = (activityCode) =>
  ['333fm', '333mbf'].includes(parseActivityCode(activityCode).eventId);

export const activityDuration = ({ startTime, endTime }) => new Date(endTime) - new Date(startTime);

export const activityDurationString = ({ startTime, endTime }, timezone = 'UTC') =>
  `${shortTime(startTime, timezone)} - ${shortTime(endTime, timezone)}`;

export const activitiesOverlap = (first, second) =>
  new Date(first.startTime) < new Date(second.endTime) &&
  new Date(second.startTime) < new Date(first.endTime);

export const activitiesIntersection = (first, second) => {
  if (!activitiesOverlap(first, second)) return 0;
  const [, middleStart, middleEnd] = [
    first.startTime,
    first.endTime,
    second.startTime,
    second.endTime,
  ].sort();
  /* Time distance between the two middle points in time. */
  return new Date(middleEnd) - new Date(middleStart);
};

export const rooms = (wcif) => flatMap(wcif.schedule.venues, (venue) => venue.rooms);

export const roomByActivity = (wcif, activityId) =>
  rooms(wcif).find((room) => room.activities.some(({ id }) => id === activityId));

export const stationsByActivity = (wcif, activityId) =>
  getExtensionData('RoomConfig', roomByActivity(wcif, activityId)).stations;

// export const flatActivities = ({ activities, childActivities }) => {
//   const a = activities || childActivities;
//   return a.length > 0 ? [...a, ...flatMap(a, flatActivities)] : a;
// }

const getActivities = (activity) => activity.childActivities || activity.activities;

// get all child activities by activity
export const flatActivities = (activity) =>
  getActivities(activity).length > 0
    ? [
        ...getActivities(activity).map((a) => ({
          ...a,
          parent: activity,
        })),
        ...flatMap(
          getActivities(activity).map((a) => ({
            ...a,
            parent: activity,
          })),
          flatActivities
        ),
      ]
    : getActivities(activity).map((a) => ({
        ...a,
        parent: activity,
      }));

/**
 * Creates a flat array of activities
 */
export const allActivities = (wcif) => {
  // Rounds
  const activities = flatMap(rooms(wcif), (room) =>
    room.activities.map((a) => ({
      ...a,
      room,
    }))
  );
  return [...activities, ...flatMap(activities, flatActivities)];
};

/**
 * Creates a flat array of activities
 */
export const allRoundActivities = (wcif) => {
  const activities = flatMap(rooms(wcif), (room) => room.activities.map((a) => ({ ...a, room })));
  return activities;
};

export const allActivitiesByRoom = (wcif, roomId) =>
  flatActivities(rooms(wcif).find((room) => room.id === roomId));

export const maxActivityId = (wcif) =>
  Math.max(...allActivities(wcif).map((activity) => activity.id));

/* Assigning tasks invokes activityById enormous number of times.
   But during that process activities (schedule) don't change.
   Caching is gives an invaluable speed boost in this case. */
const activitiesByIdCachedBySchedule = new Map();

export const activityById = (wcif, activityId) => {
  if (activitiesByIdCachedBySchedule.has(wcif.schedule)) {
    return activitiesByIdCachedBySchedule.get(wcif.schedule).get(activityId);
  }

  const activities = allActivities(wcif);
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  activitiesByIdCachedBySchedule.set(wcif.schedule, activitiesById);
  return activitiesById.get(activityId);
};

const activitiesByCodeAndRoomCache = new Map();
export const activityByActivityCode = (wcif, roomId, activityCode) => {
  const id = `${roomId}-${activityCode}`;

  if (activitiesByCodeAndRoomCache.has(id)) {
    return activitiesByCodeAndRoomCache.get(id);
  }

  const activities = allActivitiesByRoom(wcif, roomId);
  const activity = activities.find((activity) => activity.activityCode === activityCode);

  if (activity) {
    activitiesByCodeAndRoomCache.set(id, activity);
    return activity;
  }

  throw new Error(`Activity not found: ${activityCode} in room: ${roomId}`);
};

export const updateActivity = (wcif, updatedActivity) =>
  mapIn(wcif, ['schedule', 'venues'], (venue) =>
    mapIn(venue, ['rooms'], (room) =>
      mapIn(room, ['activities'], (activity) =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    )
  );

export const shouldHaveGroups = (activity) => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(
    activity.activityCode
  );
  return !!(eventId && roundNumber && !groupNumber && !attemptNumber);
};

export const roundActivities = (wcif, roundId) =>
  flatMap(rooms(wcif), (room) =>
    room.activities
      .filter(({ activityCode }) => activityCode.startsWith(roundId))
      .map((activity) => ({
        ...activity,
        room,
      }))
  );

export const groupActivitiesByRound = (wcif, roundId) =>
  flatMap(roundActivities(wcif, roundId), (roundActivity) =>
    hasDistributedAttempts(roundId)
      ? [roundActivity]
      : roundActivity.childActivities.map((activity) => ({
          ...activity,
          parent: roundActivity,
        }))
  );

export const roomsWithTimezoneAndGroups = (wcif, roundId) =>
  flatMap(wcif.schedule.venues, (venue) =>
    venue.rooms.map((room) => [
      room,
      venue.timezone,
      flatMap(
        room.activities.filter((activity) => activity.activityCode === roundId),
        (activity) => activity.childActivities
      ),
    ])
  );

export const activityAssigned = (wcif, activityId) =>
  wcif.persons.some((person) =>
    person.assignments.some((assignment) => assignment.activityId === activityId)
  );

export const groupActivitiesAssigned = (wcif, roundId) =>
  groupActivitiesByRound(wcif, roundId).some((activity) => activityAssigned(wcif, activity.id));

export const roundsWithoutResults = (wcif) =>
  flatMap(wcif.events, (event) => event.rounds).filter(
    (round) =>
      round.results.length === 0 || round.results.every((result) => result.attempts.length === 0)
  );

/* Round is missing results if it has all results empty
   or it's the first round and has no results at all.
   In other words no one's competed in such round, but we know who should compete in it. */
const roundsMissingResults = (wcif) =>
  wcif.events
    .map((event) =>
      event.rounds.find((round) => {
        const { roundNumber } = parseActivityCode(round.id);
        return (
          (round.results.length === 0 && roundNumber === 1) ||
          (round.results.length > 0 &&
            round.results.every((result) => result.attempts.length === 0))
        );
      })
    )
    .filter((round) => round);

export const roundsMissingAssignments = (wcif) =>
  roundsMissingResults(wcif).filter((round) => !groupActivitiesAssigned(wcif, round.id));

export const roundsMissingScorecards = (wcif) =>
  roundsMissingResults(wcif)
    .filter((round) => groupActivitiesAssigned(wcif, round.id))
    .filter((round) => parseActivityCode(round.id).eventId !== '333fm');

export const allGroupsCreated = (wcif) =>
  wcif.events.every((event) =>
    event.rounds.every((round) => groupActivitiesByRound(wcif, round.id).length > 0)
  );

export const anyCompetitorAssignment = (wcif) =>
  wcif.persons.some((person) =>
    person.assignments.some((assignment) => assignment.assignmentCode === 'competitor')
  );

export const anyGroupAssignedOrCreated = (wcif) =>
  wcif.events.some((event) =>
    event.rounds.some((round) =>
      hasDistributedAttempts(event.id)
        ? groupActivitiesAssigned(wcif, round.id)
        : groupActivitiesByRound(wcif, round.id).length > 0
    )
  );

export const anyResults = (wcif) =>
  wcif.events.some((event) => event.rounds.some((round) => round.results.length > 0));

/* Clears groups and assignments only for rounds without results. */
export const clearGroupsAndAssignments = (wcif) => {
  const clearableRounds = roundsWithoutResults(wcif);
  const clearableRoundIds = clearableRounds.map(({ id }) => id);
  const clearableActivities = flatMap(clearableRounds, (round) =>
    groupActivitiesByRound(wcif, round.id)
  );
  const clearableActivityIds = clearableActivities.map(({ id }) => id);

  const persons = wcif.persons.map((person) =>
    updateIn(person, ['assignments'], (assignments) =>
      assignments
        .filter(({ activityId }) => !clearableActivityIds.includes(activityId))
        .filter(
          ({ assignmentCode }) =>
            !assignmentCode.startsWith('staff-') && assignmentCode !== 'competitor'
        )
    )
  );
  const schedule = mapIn(wcif.schedule, ['venues'], (venue) =>
    mapIn(venue, ['rooms'], (room) =>
      mapIn(room, ['activities'], (activity) =>
        clearableRoundIds.includes(activity.activityCode)
          ? setIn(activity, ['childActivities'], [])
          : activity
      )
    )
  );
  return { ...wcif, persons, schedule };
};

export const generateNextChildActivityId = (wcif) => {
  const activities = allActivities(wcif);
  let max = 0;
  activities.forEach((activity) => {
    max = Math.max(activity.id, max);
  });

  return max + 1;
};

/**
 * Comparator for sorting groups by group number
 */
export const byGroupNumber = (groupA, groupB) => {
  const parsedActivityCodeA = parseActivityCode(groupA.activityCode);
  const parsedActivityCodeB = parseActivityCode(groupB.activityCode);
  return parsedActivityCodeA.groupNumber - parsedActivityCodeB.groupNumber;
};

export const getResultsForActivityCode = (wcif, activityCode) => {
  const { eventId } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  return event?.rounds.find((r) => r.id === activityCode)?.results;
};

export const createGroupActivity = (id, roundActivity, groupNumber, startTime, endTime) => {
  const newActivityCode = `${roundActivity.activityCode}-g${groupNumber}`;

  return {
    id: id,
    name: activityCodeToName(newActivityCode),
    activityCode: newActivityCode,
    startTime: startTime || roundActivity.startTime, // spread across groups
    endTime: endTime || roundActivity.endTime,
    childActivities: [],
  };
};
