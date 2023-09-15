import { Competition, parseActivityCode } from '@wca/helpers';
import { findAllActivities } from 'wca-group-generators';
import { activityCodeIsChild } from '../activities';
import { AssignmentStep } from './types';

const getBaseActivities = (
  wcif: Competition,
  base: AssignmentStep['props']['activities']['base'],
  roundId: string
) => {
  const allActivities = findAllActivities(wcif);
  const activitiesForRound = allActivities
    .filter(
      (activity) =>
        activityCodeIsChild(roundId, activity.activityCode) && roundId !== activity.activityCode
    )
    .sort((a, b) => a.activityCode.localeCompare(b.activityCode));

  switch (base) {
    case 'all':
      return activitiesForRound;
    case 'even':
      return activitiesForRound.filter(
        ({ activityCode }) => (parseActivityCode(activityCode)?.groupNumber as number) % 2 === 0
      );
    case 'odd':
      return activitiesForRound.filter(
        ({ activityCode }) => (parseActivityCode(activityCode)?.groupNumber as number) % 2 === 1
      );
    default:
      return activitiesForRound;
  }
};

export const getActivities = (
  wcif: Competition,
  { base, activityIds, options = {} }: AssignmentStep['props']['activities'],
  roundId: string
) => {
  const baseActivities = getBaseActivities(wcif, base, roundId);

  if (activityIds) {
    return baseActivities.filter((activity) => activityIds?.includes(activity.id));
  }

  let baseActivityCodes = [...new Set(baseActivities.map((activity) => activity.activityCode))];
  let filteredBaseActivities = baseActivities;

  if (options.tail) {
    baseActivityCodes = baseActivityCodes.slice(0, -1);
  }

  if (options.head) {
    baseActivityCodes = baseActivityCodes.slice(0, options.head);
  }

  filteredBaseActivities = filteredBaseActivities.filter((activity) =>
    baseActivityCodes.includes(activity.activityCode)
  );

  return filteredBaseActivities;
};
