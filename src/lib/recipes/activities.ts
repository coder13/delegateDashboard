import { Competition, parseActivityCode } from '@wca/helpers';
import { findAllActivities } from 'wca-group-generators';
import { activityCodeIsChild } from '../activities';
import { Step } from './types';

const getBaseActivities = (
  wcif: Competition,
  base: Step['props']['activities']['base'],
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
  { base, options = {} }: Step['props']['activities'],
  roundId: string
) => {
  const baseActivities = getBaseActivities(wcif, base, roundId);

  if (options.activityIds) {
    return baseActivities.filter((activity) => options.activityIds?.includes(activity.id));
  }

  if (options.tail) {
    return baseActivities.slice(options.tail);
  } else if (options.head) {
    return baseActivities.slice(0, options.head);
  } else return baseActivities;
};
