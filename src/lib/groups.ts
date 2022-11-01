import { Activity, Assignment, Competition } from '@wca/helpers';
import {
  createGroupActivity,
  generateNextChildActivityId,
  parseActivityCode,
  findGroupActivitiesByRound,
  ActivityWithParent,
} from './activities';
import { InProgressAssignmment } from './assignments';

/**
 * Takes WCIF to compute the initial startActivityId.
 * Then increments startActivityId as it generates groups across all stages
 * @returns {[RoundActivity]} Returns updated roundActivities
 */
export const createGroupsAcrossStages = (
  wcif: Competition,
  roundActivities: Activity[],
  groupCount: number
) => {
  let startActivityId = generateNextChildActivityId(wcif);

  return roundActivities.map((roundActivity) => {
    const startDate = new Date(roundActivity.startTime);
    const endDate = new Date(roundActivity.endTime);
    const dateDiff = endDate.getTime() - startDate.getTime();
    const timePerGroup = dateDiff / groupCount;

    const childActivities: Activity[] = [];
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
export const previousGroupForActivity = (
  activity: ActivityWithParent
): ActivityWithParent | undefined => {
  const groups = activity.parent.childActivities as ActivityWithParent[];
  if (!groups) {
    return;
  }

  const groupCount = groups.length;
  const { groupNumber = 0 } = parseActivityCode(activity.activityCode);

  const previousGroupNumber = ((groupNumber - 2 + groupCount) % groupCount) + 1;
  const previousGroup = groups.find(
    (g) => parseActivityCode(g.activityCode).groupNumber === previousGroupNumber
  );
  return previousGroup;
};

/**
 * @param {activity} activity - A modified activity that includes a parent reference
 */
export const nextGroupForActivity = (activity: ActivityWithParent): Activity | undefined => {
  const groups = activity.parent.childActivities;
  if (!groups) {
    return;
  }

  const { groupNumber = 0 } = parseActivityCode(activity.activityCode);
  const nextGroupNumber = (groupNumber % groups.length) + 1;
  const nextGroup = groups.find(
    (g) => parseActivityCode(g.activityCode).groupNumber === nextGroupNumber
  );
  return nextGroup;
};

/**
 * So that I don't have to remember the data format
 */
export const createGroupAssignment = (
  registrantId: number,
  activityId: any,
  assignmentCode: string,
  stationNumber?: number
): InProgressAssignmment => ({
  registrantId: registrantId,
  assignment: {
    assignmentCode,
    activityId,
    stationNumber,
  },
});

export const computeGroupSizes = (assignments: Assignment[]) => (activity: Activity) => ({
  activity: activity,
  size: assignments.filter(
    ({ activityId, assignmentCode }) =>
      +activityId === activity.id && assignmentCode === 'competitor'
  ).length,
});

/**
 * computes group sizes for each group defined by the roundId
 * @param {WCCIF} wcif
 * @param {string} roundId
 * @returns
 */
export const computeGroupSizesForRoundId = (wcif, roundId) => {
  const groups = findGroupActivitiesByRound(wcif, roundId);
  return groups.map((group) => ({
    activity: group,
    size: wcif.persons.filter(
      (p) =>
        p.assignments.filter((a) => a.activityId === group.id && a.assignmentCode === 'competitor')
          .length > 0
    ).length,
  }));
};
