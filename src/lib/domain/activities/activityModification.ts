import { type Activity } from '@wca/helpers';

/** Activity Creation and Modification Functions */

/**
 * Searches for an activity recursively and returns a new version with replacements
 * @param where - The activity to find (matched by ID)
 * @param what - The properties to replace in the found activity
 * @returns Function that transforms an activity tree
 */
export const findAndReplaceActivity = (where: Partial<Activity>, what: Partial<Activity>) => {
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
