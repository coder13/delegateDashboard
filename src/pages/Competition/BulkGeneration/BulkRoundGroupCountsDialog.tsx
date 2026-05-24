import ConfigureGroupCountsDialog from '../../../dialogs/ConfigureGroupCountsDialog';
import { findAllRoundActivities } from '../../../lib/wcif/activities';
import type { Competition } from '@wca/helpers';
import { useMemo } from 'react';

interface BulkRoundGroupCountsDialogProps {
  wcif: Competition | null;
  roundId: string | null;
  onClose: () => void;
}

export const BulkRoundGroupCountsDialog = ({
  wcif,
  roundId,
  onClose,
}: BulkRoundGroupCountsDialogProps) => {
  const round = useMemo(
    () =>
      wcif && roundId
        ? wcif.events.flatMap((event) => event.rounds).find((candidate) => candidate.id === roundId)
        : undefined,
    [roundId, wcif]
  );

  const roundActivities = useMemo(
    () =>
      wcif && roundId
        ? findAllRoundActivities(wcif).filter((activity) => activity.activityCode === roundId)
        : [],
    [roundId, wcif]
  );

  if (!wcif || !roundId || !round) {
    return null;
  }

  return (
    <ConfigureGroupCountsDialog
      open
      onClose={onClose}
      activityCode={roundId}
      round={round}
      roundActivities={roundActivities}
    />
  );
};
