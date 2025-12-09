import type { ActivityWithParent } from '../../../../../lib/domain/activities';
import {
  getGroupifierActivityConfig,
  setGroupifierActivityConfig,
} from '../../../../../lib/wcif/extensions/groupifier';
import type { AppDispatch } from '../../../../../store';
import { editActivity } from '../../../../../store/actions';
import type { Person } from '@wca/helpers';
import { useCallback, useMemo } from 'react';

export function useFeaturedCompetitors(
  groups: ActivityWithParent[],
  dispatch: AppDispatch
): {
  featuredCompetitors: number[];
  toggleFeaturedCompetitor: (person: Person) => void;
} {
  // Array of wcaUserIds
  const featuredCompetitors = useMemo(
    () =>
      groups.flatMap((activity) => {
        const extensionData = getGroupifierActivityConfig(activity);
        return extensionData?.featuredCompetitorWcaUserIds || [];
      }),
    [groups]
  );

  const toggleFeaturedCompetitor = useCallback(
    (person: Person) => {
      const competingActivity = groups.find((activity) => {
        const assignment = person.assignments?.find(
          (a) => a.activityId === activity.id && a.assignmentCode === 'competitor'
        );
        return !!assignment;
      });

      if (!competingActivity) {
        return;
      }

      const activityFeaturedCompetitors =
        getGroupifierActivityConfig(competingActivity)?.featuredCompetitorWcaUserIds || [];

      const { parent: _, ...competingActivityWithoutRoom } =
        competingActivity as ActivityWithParent;

      const newActivity = setGroupifierActivityConfig(competingActivityWithoutRoom, {
        featuredCompetitorWcaUserIds: activityFeaturedCompetitors.includes(person.wcaUserId)
          ? activityFeaturedCompetitors.filter((id) => id !== person.wcaUserId)
          : [...activityFeaturedCompetitors, person.wcaUserId],
      });

      dispatch(editActivity(competingActivity, newActivity));
    },
    [groups, dispatch]
  );

  return { featuredCompetitors, toggleFeaturedCompetitor };
}
