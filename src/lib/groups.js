import {
  createGroupActivity,
  generateNextChildActivityId,
  parseActivityCode,
  groupActivitiesByRound,
} from './activities';

/**
 * Takes WCIF to compute the initial startActivityId.
 * Then increments startActivityId as it generates groups across all stages
 * @returns {[RoundActivity]} Returns updated roundActivities
 */
export const createGroupsAcrossStages = (wcif, roundActivities, groupCount) => {
  let startActivityId = generateNextChildActivityId(wcif);

  return roundActivities.map((roundActivity) => {
    const startDate = new Date(roundActivity.startTime);
    const endDate = new Date(roundActivity.endTime);
    const dateDiff = endDate - startDate;
    const timePerGroup = dateDiff / groupCount;

    const childActivities = [];
    for (let i = 0; i < groupCount; i++) {
      childActivities.push(
        createGroupActivity(
          startActivityId,
          roundActivity,
          i + 1,
          new Date(startDate.getTime() + timePerGroup * i).toISOString(),
          new Date(startDate.getTime() + timePerGroup * (i + 1)).toISOString()
        )
      );

      startActivityId++;
    }

    return {
      ...roundActivity,
      childActivities,
    };
  });
};

/**
 * @param {activity} activity - A modified activity that includes a parent reference
 */
export const previousGroupForActivity = (activity) => {
  const groupCount = activity.parent.childActivities.length;
  const previousGroupNumber =
    ((parseActivityCode(activity.activityCode).groupNumber - 2 + groupCount) % groupCount) + 1;
  const previousGroup = activity.parent.childActivities.find(
    (g) => parseActivityCode(g.activityCode).groupNumber === previousGroupNumber
  );
  return previousGroup;
};

/**
 * @param {activity} activity - A modified activity that includes a parent reference
 */
export const nextGroupForActivity = (activity) => {
  const { groupNumber } = parseActivityCode(activity.activityCode);
  const nextGroupNumber = (groupNumber % activity.parent.childActivities.length) + 1;
  const nextGroup = activity.parent.childActivities.find(
    (g) => parseActivityCode(g.activityCode).groupNumber === nextGroupNumber
  );
  return nextGroup;
};

/**
 * So that I don't have to remember the data format
 */
export const createGroupAssignment = (registrantId, activityId, assignmentCode, stationNumber) => ({
  registrantId: registrantId,
  assignment: {
    assignmentCode,
    activityId,
    stationNumber,
  },
});

export const computeGroupSizes = (assignments) => (activity) => ({
  activity: activity,
  size: assignments.filter(
    ({ assignment }) =>
      assignment.activityId === activity.id && assignment.assignmentCode === 'competitor'
  ).length,
});

/**
 * computes group sizes for each group defined by the roundId
 * @param {WCCIF} wcif
 * @param {string} roundId
 * @returns
 */
export const computeGroupSizesForRoundId = (wcif, roundId) => {
  const groups = groupActivitiesByRound(wcif, roundId);
  return groups.map((group) => ({
    activity: group,
    size: wcif.persons.filter(
      (p) =>
        p.assignments.filter((a) => a.activityId === group.id && a.assignmentCode === 'competitor')
          .length > 0
    ).length,
  }));
};
