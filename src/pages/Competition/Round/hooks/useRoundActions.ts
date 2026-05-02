import { type ActivityWithParent, type ActivityWithRoom } from '../../../../lib/domain/types';
import { buildCopyRoundAssignments } from '../utils/dualRoundAssignments';
import {
  bulkAddPersonAssignments,
  bulkRemovePersonAssignments,
  generateAssignments,
  updateRoundChildActivities,
} from '../../../../store/actions';
import { type Competition, type Round } from '@wca/helpers';
import { useConfirm } from 'material-ui-confirm';
import { useSnackbar } from 'notistack';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

interface UseRoundActionsParams {
  wcif: Competition | null;
  round: Round | undefined;
  groups: ActivityWithParent[];
  roundActivities: ActivityWithRoom[];
}

export const useRoundActions = ({ wcif, round, groups, roundActivities }: UseRoundActionsParams) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  const handleGenerateAssignments = useCallback(() => {
    if (!round) return;
    dispatch(generateAssignments(round.id));
  }, [dispatch, round]);

  const handleResetAll = useCallback(() => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(
          bulkRemovePersonAssignments([
            ...groups.map((group) => ({
              activityId: group.id,
            })),
          ])
        );

        roundActivities.forEach((roundActivity) => {
          dispatch(updateRoundChildActivities(roundActivity.id, []));
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }, [confirm, dispatch, groups, roundActivities]);

  const handleResetNonScrambling = useCallback(() => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(
          bulkRemovePersonAssignments([
            ...groups.map((group) => ({
              activityId: group.id,
              assignmentCode: 'staff-judge',
            })),
            ...groups.map((group) => ({
              activityId: group.id,
              assignmentCode: 'competitor',
            })),
          ])
        );
      })
      .catch((e) => {
        console.error(e);
      });
  }, [confirm, dispatch, groups]);

  const handleCopyAssignments = useCallback(
    (sourceRoundId: string, targetRoundId: string) => {
      if (!wcif || !round) {
        return;
      }

      const { assignments, targetActivityIds, copiedCount, skippedCount } = buildCopyRoundAssignments(
        wcif,
        sourceRoundId,
        targetRoundId
      );

      if (targetActivityIds.length === 0) {
        enqueueSnackbar('Target round has no generated groups to copy into.', { variant: 'warning' });
        return;
      }

      if (copiedCount === 0) {
        enqueueSnackbar('No source assignments found to copy.', { variant: 'warning' });
        return;
      }

      confirm({
        description: `Copy ${copiedCount} assignments into ${targetRoundId}? Existing assignments in the target round will be replaced.`,
        confirmationText: 'Copy',
        cancellationText: 'Cancel',
      })
        .then(() => {
          dispatch(
            bulkRemovePersonAssignments(
              targetActivityIds.map((activityId) => ({
                activityId,
              }))
            )
          );
          dispatch(bulkAddPersonAssignments(assignments));

          enqueueSnackbar(
            skippedCount > 0
              ? `Copied ${copiedCount} assignments. Skipped ${skippedCount} without a matching target group.`
              : `Copied ${copiedCount} assignments.`,
            { variant: skippedCount > 0 ? 'warning' : 'success' }
          );
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [confirm, dispatch, enqueueSnackbar, round, wcif]
  );

  return {
    handleGenerateAssignments,
    handleResetAll,
    handleResetNonScrambling,
    handleCopyAssignments,
  };
};
