import {
  mapIn,
  updateIn,
  setIn,
  flatMap,
  zip,
  scaleToOne,
  shortTime,
  isPresentDeep,
} from './utils';
import { getExtensionData, setExtensionData } from './wcif-extensions';
import {
  suggestedGroupCount,
  suggestedScramblerCount,
  suggestedRunnerCount,
} from './formulas';
import { eventNameById } from './events';

export const parseActivityCode = activityCode => {
  const [, e, r, g, a] = activityCode.match(
    /(\w+)(?:-r(\d+))?(?:-g(\d+))?(?:-a(\d+))?/
  );
  return {
    eventId: e,
    roundNumber: r && parseInt(r, 10),
    groupNumber: g && parseInt(g, 10),
    attemptNumber: a && parseInt(a, 10),
  };
};

export const activityCodeToName = activityCode => {
  const {
    eventId,
    roundNumber,
    groupNumber,
    attemptNumber,
  } = parseActivityCode(activityCode);
  return [
    eventId && eventNameById(eventId),
    roundNumber && `Round ${roundNumber}`,
    groupNumber && `Group ${groupNumber}`,
    attemptNumber && `Attempt ${attemptNumber}`,
  ]
    .filter(x => x)
    .join(', ');
};

export const hasDistributedAttempts = activityCode =>
  ['333fm', '333mbf'].includes(parseActivityCode(activityCode).eventId);

export const activityDuration = ({ startTime, endTime }) =>
  new Date(endTime) - new Date(startTime);

export const activityDurationString = (
  { startTime, endTime },
  timezone = 'UTC'
) => `${shortTime(startTime, timezone)} - ${shortTime(endTime, timezone)}`;

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

export const rooms = wcif =>
  flatMap(wcif.schedule.venues, venue => venue.rooms);

export const roomByActivity = (wcif, activityId) =>
  rooms(wcif).find(room => room.activities.some(({ id }) => id === activityId));

export const stationsByActivity = (wcif, activityId) =>
  getExtensionData('RoomConfig', roomByActivity(wcif, activityId)).stations;

const allActivities = wcif => {
  const allChildActivities = ({ childActivities }) =>
    childActivities.length > 0
      ? [...childActivities, ...flatMap(childActivities, allChildActivities)]
      : childActivities;
  const activities = flatMap(rooms(wcif), room => room.activities);
  return [...activities, ...flatMap(activities, allChildActivities)];
};

export const maxActivityId = wcif =>
  Math.max(...allActivities(wcif).map(activity => activity.id));

/* Assigning tasks invokes activityById enormous number of times.
   But during that process activities (schedule) don't change.
   Caching is gives an invaluable speed boost in this case. */
const activitiesByIdCachedBySchedule = new Map();

export const activityById = (wcif, activityId) => {
  if (activitiesByIdCachedBySchedule.has(wcif.schedule)) {
    return activitiesByIdCachedBySchedule.get(wcif.schedule).get(activityId);
  } else {
    const activities = allActivities(wcif);
    const activitiesById = new Map(
      activities.map(activity => [activity.id, activity])
    );
    activitiesByIdCachedBySchedule.set(wcif.schedule, activitiesById);
    return activitiesById.get(activityId);
  }
};

export const updateActivity = (wcif, updatedActivity) =>
  mapIn(wcif, ['schedule', 'venues'], venue =>
    mapIn(venue, ['rooms'], room =>
      mapIn(room, ['activities'], activity =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    )
  );

export const populateRoundActivitiesConfig = (
  wcif,
  expectedCompetitorsByRound,
  defaults
) => {
  const activitiesWithConfig = flatMap(wcif.events, event => {
    return flatMap(event.rounds, round => {
      const { roundNumber } = parseActivityCode(round.id);
      const expectedRoundCompetitors =
        expectedCompetitorsByRound[round.id].length;
      const activities = roundActivities(wcif, round.id).filter(
        shouldHaveGroups
      );
      const alreadyHaveConfig = activities.every(activity =>
        getExtensionData('ActivityConfig', activity)
      );
      if (alreadyHaveConfig) return activities;
      const capacities = scaleToOne(
        activities.map(
          activity =>
            stationsByActivity(wcif, activity.id) * activityDuration(activity)
        )
      );
      return zip(activities, capacities).map(([activity, capacity]) => {
        const stations = stationsByActivity(wcif, activity.id);
        const competitors = Math.round(capacity * expectedRoundCompetitors);
        const groups = suggestedGroupCount(competitors, stations, roundNumber);
        const scramblers = defaults.assignScramblers
          ? suggestedScramblerCount(competitors / groups, stations)
          : 0;
        const runners = defaults.assignRunners
          ? suggestedRunnerCount(competitors / groups, stations)
          : 0;
        const assignJudges = stations > 0 && defaults.assignJudges;
        return setExtensionData('ActivityConfig', activity, {
          capacity,
          groups,
          scramblers,
          runners,
          assignJudges,
        });
      });
    });
  });
  return activitiesWithConfig.reduce(updateActivity, wcif);
};

export const shouldHaveGroups = activity => {
  const {
    eventId,
    roundNumber,
    groupNumber,
    attemptNumber,
  } = parseActivityCode(activity.activityCode);
  return !!(eventId && roundNumber && !groupNumber && !attemptNumber);
};

export const anyActivityConfig = wcif =>
  rooms(wcif).some(room =>
    room.activities.some(activity =>
      getExtensionData('ActivityConfig', activity)
    )
  );

export const activitiesWithUnpopulatedConfig = wcif =>
  flatMap(rooms(wcif), room =>
    room.activities
      .filter(shouldHaveGroups)
      .filter(activity => !getExtensionData('ActivityConfig', activity))
  );

export const activitiesConfigComplete = wcif =>
  rooms(wcif).every(room =>
    room.activities
      .filter(shouldHaveGroups)
      .map(activity => getExtensionData('ActivityConfig', activity))
      .every(isPresentDeep)
  );

export const roomsConfigComplete = wcif =>
  rooms(wcif)
    .map(room => getExtensionData('RoomConfig', room))
    .every(isPresentDeep);

export const roundActivities = (wcif, roundId) =>
  flatMap(rooms(wcif), room =>
    room.activities.filter(({ activityCode }) =>
      activityCode.startsWith(roundId)
    )
  );

export const groupActivitiesByRound = (wcif, roundId) =>
  flatMap(roundActivities(wcif, roundId), activity =>
    hasDistributedAttempts(roundId) ? [activity] : activity.childActivities
  );

export const roomsWithTimezoneAndGroups = (wcif, roundId) =>
  flatMap(wcif.schedule.venues, venue =>
    venue.rooms.map(room => [
      room,
      venue.timezone,
      flatMap(
        room.activities.filter(activity => activity.activityCode === roundId),
        activity => activity.childActivities
      ),
    ])
  );

export const activityAssigned = (wcif, activityId) =>
  wcif.persons.some(person =>
    person.assignments.some(assignment => assignment.activityId === activityId)
  );

export const groupActivitiesAssigned = (wcif, roundId) =>
  groupActivitiesByRound(wcif, roundId).some(activity =>
    activityAssigned(wcif, activity.id)
  );

export const roundsWithoutResults = wcif =>
  flatMap(wcif.events, event => event.rounds).filter(
    round =>
      round.results.length === 0 ||
      round.results.every(result => result.attempts.length === 0)
  );

/* Round is missing results if it has all results empty
   or it's the first round and has no results at all.
   In other words no one's competed in such round, but we know who should compete in it. */
const roundsMissingResults = wcif =>
  wcif.events
    .map(event =>
      event.rounds.find(round => {
        const { roundNumber } = parseActivityCode(round.id);
        return (
          (round.results.length === 0 && roundNumber === 1) ||
          (round.results.length > 0 &&
            round.results.every(result => result.attempts.length === 0))
        );
      })
    )
    .filter(round => round);

export const roundsMissingAssignments = wcif =>
  roundsMissingResults(wcif).filter(
    round => !groupActivitiesAssigned(wcif, round.id)
  );

export const roundsMissingScorecards = wcif =>
  roundsMissingResults(wcif)
    .filter(round => groupActivitiesAssigned(wcif, round.id))
    .filter(round => parseActivityCode(round.id).eventId !== '333fm');

export const allGroupsCreated = wcif =>
  wcif.events.every(event =>
    event.rounds.every(
      round => groupActivitiesByRound(wcif, round.id).length > 0
    )
  );

export const anyCompetitorAssignment = wcif =>
  wcif.persons.some(person =>
    person.assignments.some(
      assignment => assignment.assignmentCode === 'competitor'
    )
  );

export const anyGroupAssignedOrCreated = wcif =>
  wcif.events.some(event =>
    event.rounds.some(round =>
      hasDistributedAttempts(event.id)
        ? groupActivitiesAssigned(wcif, round.id)
        : groupActivitiesByRound(wcif, round.id).length > 0
    )
  );

export const anyResults = wcif =>
  wcif.events.some(event =>
    event.rounds.some(round => round.results.length > 0)
  );

/* Clears groups and assignments only for rounds without results. */
export const clearGroupsAndAssignments = wcif => {
  const clearableRounds = roundsWithoutResults(wcif);
  const clearableRoundIds = clearableRounds.map(({ id }) => id);
  const clearableActivities = flatMap(clearableRounds, round =>
    groupActivitiesByRound(wcif, round.id)
  );
  const clearableActivityIds = clearableActivities.map(({ id }) => id);

  const persons = wcif.persons.map(person =>
    updateIn(person, ['assignments'], assignments =>
      assignments
        .filter(({ activityId }) => !clearableActivityIds.includes(activityId))
        .filter(
          ({ assignmentCode }) =>
            !assignmentCode.startsWith('staff-') &&
            assignmentCode !== 'competitor'
        )
    )
  );
  const schedule = mapIn(wcif.schedule, ['venues'], venue =>
    mapIn(venue, ['rooms'], room =>
      mapIn(room, ['activities'], activity =>
        clearableRoundIds.includes(activity.activityCode)
          ? setIn(activity, ['childActivities'], [])
          : activity
      )
    )
  );
  return { ...wcif, persons, schedule };
};
