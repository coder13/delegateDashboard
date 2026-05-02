import { findGroupActivitiesByRound } from '../../../../lib/wcif/activities';
import { parseActivityCode } from '../../../../lib/domain/activities';
import { type BulkInProgressAssignments } from '../../../../lib/types';
import { type Competition } from '@wca/helpers';

const buildGroupKey = (roomId: number | undefined, groupNumber: number | undefined) =>
  roomId !== undefined && groupNumber !== undefined ? `${roomId}:${groupNumber}` : null;

export interface CopyRoundAssignmentsResult {
  assignments: BulkInProgressAssignments;
  targetActivityIds: number[];
  copiedCount: number;
  skippedCount: number;
}

export const buildCopyRoundAssignments = (
  wcif: Competition,
  sourceRoundId: string,
  targetRoundId: string
): CopyRoundAssignmentsResult => {
  const sourceGroups = findGroupActivitiesByRound(wcif, sourceRoundId);
  const targetGroups = findGroupActivitiesByRound(wcif, targetRoundId);

  const sourceGroupsById = new Map(sourceGroups.map((activity) => [activity.id, activity]));
  const targetGroupsByKey = new Map(
    targetGroups.flatMap((activity) => {
      const { groupNumber } = parseActivityCode(activity.activityCode);
      const key = buildGroupKey(activity.parent.room?.id, groupNumber);
      return key ? [[key, activity] as const] : [];
    })
  );

  const targetActivityIds = targetGroups.map((activity) => activity.id);
  const assignments: BulkInProgressAssignments = [];
  let skippedCount = 0;

  wcif.persons.forEach((person) => {
    person.assignments?.forEach((assignment) => {
      const sourceActivity = sourceGroupsById.get(+assignment.activityId);

      if (!sourceActivity) {
        return;
      }

      const { groupNumber } = parseActivityCode(sourceActivity.activityCode);
      const targetKey = buildGroupKey(sourceActivity.parent.room?.id, groupNumber);
      const targetActivity = targetKey ? targetGroupsByKey.get(targetKey) : undefined;

      if (!targetActivity) {
        skippedCount++;
        return;
      }

      assignments.push({
        registrantId: person.registrantId,
        assignment: {
          ...assignment,
          activityId: targetActivity.id,
        },
      });
    });
  });

  return {
    assignments,
    targetActivityIds,
    copiedCount: assignments.length,
    skippedCount,
  };
};
