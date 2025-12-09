import type { ActivityWithParent } from '../../../../../lib/domain/activities';
import type { AppDispatch } from '../../../../../store';
import {
  bulkRemovePersonAssignments,
  removePersonAssignments,
  upsertPersonAssignments,
} from '../../../../../store/actions';
import type { PersonWithSeedResult } from '../types';
import { useConfirm } from 'material-ui-confirm';
import { useCallback } from 'react';

export function useAssignmentHandlers(
  persons: PersonWithSeedResult[],
  groups: ActivityWithParent[],
  paintingAssignmentCode: string,
  dispatch: AppDispatch
) {
  const confirm = useConfirm();

  const personAssignments = useCallback(
    (registrantId: number) => persons?.find((p) => p.registrantId === registrantId)?.assignments,
    [persons]
  );

  const getAssignmentCodeForPersonGroup = useCallback(
    (registrantId: number, activityId: number) => {
      return personAssignments(registrantId)?.find((a) => a.activityId === activityId)
        ?.assignmentCode;
    },
    [personAssignments]
  );

  const handleUpdateAssignmentForPerson = useCallback(
    (registrantId: number, activityId: number) => () => {
      if (getAssignmentCodeForPersonGroup(registrantId, activityId) === paintingAssignmentCode) {
        dispatch(removePersonAssignments(registrantId, activityId));
      } else {
        dispatch(
          upsertPersonAssignments(registrantId, [
            {
              activityId,
              assignmentCode: paintingAssignmentCode,
              stationNumber: null,
            },
          ])
        );
      }
    },
    [dispatch, getAssignmentCodeForPersonGroup, paintingAssignmentCode]
  );

  const handleResetAssignments = useCallback(() => {
    confirm({
      title: 'Are you sure you want to reset all assignments and start over',
    }).then(() => {
      dispatch(
        bulkRemovePersonAssignments(
          groups.map((groupActivity) => ({
            activityId: groupActivity.id,
          }))
        )
      );
    });
  }, [confirm, dispatch, groups]);

  return {
    getAssignmentCodeForPersonGroup,
    handleUpdateAssignmentForPerson,
    handleResetAssignments,
  };
}
