import ConfigureAssignmentsDialog from '../../../dialogs/ConfigureAssignmentsDialog/ConfigureAssignmentsDialog';
import { allChildActivities, findAllRoundActivities } from '../../../lib/wcif/activities';
import type { Competition } from '@wca/helpers';
import { useMemo } from 'react';

interface BulkRoundPreviewDialogProps {
  wcif: Competition | null;
  roundId: string | null;
  onClose: () => void;
}

export const BulkRoundPreviewDialog = ({
  wcif,
  roundId,
  onClose,
}: BulkRoundPreviewDialogProps) => {
  const round = useMemo(
    () =>
      wcif && roundId
        ? wcif.events.flatMap((event) => event.rounds).find((candidate) => candidate.id === roundId)
        : undefined,
    [roundId, wcif]
  );

  const groups = useMemo(
    () =>
      wcif && roundId
        ? findAllRoundActivities(wcif)
            .filter((activity) => activity.activityCode === roundId)
            .flatMap((activity) => allChildActivities(activity))
        : [],
    [roundId, wcif]
  );

  if (!wcif || !roundId || !round) {
    return null;
  }

  return (
    <ConfigureAssignmentsDialog
      open
      onClose={onClose}
      round={round}
      activityCode={roundId}
      groups={groups}
      isDistributedAttemptRoundLevel={false}
      distributedAttemptGroups={[]}
      defaultShowAllCompetitors
    />
  );
};
