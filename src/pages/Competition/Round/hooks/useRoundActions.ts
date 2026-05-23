import { parseActivityCode } from '../../../../lib/domain/activities';
import { type ActivityWithParent, type ActivityWithRoom } from '../../../../lib/domain/types';
import {
  bulkRemovePersonAssignments,
  generateAssignments,
  generateRoundAttemptAssignments,
  updateRoundChildActivities,
} from '../../../../store/actions';
import { type Round } from '@wca/helpers';
import { useConfirm } from 'material-ui-confirm';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

interface UseRoundActionsParams {
  round: Round | undefined;
  activityCode: string;
  groups: ActivityWithParent[];
  roundActivities: ActivityWithRoom[];
}

export const useRoundActions = ({
  round,
  activityCode,
  groups,
  roundActivities,
}: UseRoundActionsParams) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const handleGenerateAssignments = useCallback(() => {
    if (!round) return;
    dispatch(generateAssignments(round.id));
  }, [dispatch, round]);

  const handleAssignToRoundAttempt = useCallback(() => {
    const { attemptNumber } = parseActivityCode(activityCode);

    if (attemptNumber !== undefined) {
      dispatch(generateRoundAttemptAssignments(activityCode));
      return;
    }

    const attemptCodes = Array.from(
      new Set(
        [...groups, ...roundActivities]
          .map((activity) => activity.activityCode)
          .filter((code) => parseActivityCode(code).attemptNumber !== undefined)
      )
    );

    attemptCodes.forEach((code) => {
      dispatch(generateRoundAttemptAssignments(code));
    });
  }, [dispatch, activityCode, groups, roundActivities]);

  const handleResetAttemptAssignments = useCallback(() => {
    confirm({
      description: 'Do you really want to reset all competitor assignments for this attempt?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        const { attemptNumber } = parseActivityCode(activityCode);
        const activityIdsToReset =
          attemptNumber !== undefined
            ? roundActivities.map((roundActivity) => roundActivity.id)
            : [...groups, ...roundActivities]
                .filter((group) => parseActivityCode(group.activityCode).attemptNumber !== undefined)
                .map((group) => group.id);

        if (activityIdsToReset.length === 0) {
          return;
        }

        dispatch(
          bulkRemovePersonAssignments(
            activityIdsToReset.map((activityId) => ({
              activityId,
              assignmentCode: 'competitor',
            }))
          )
        );
      })
      .catch((e) => {
        console.error('Failed to reset attempt assignments:', e);
      });
  }, [activityCode, confirm, dispatch, groups, roundActivities]);

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

  return {
    handleGenerateAssignments,
    handleAssignToRoundAttempt,
    handleResetAttemptAssignments,
    handleResetAll,
    handleResetNonScrambling,
  };
};
