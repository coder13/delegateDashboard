import RoundContainer from '../../../containers/RoundContainer';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppSelector } from '../../../store';
import { selectRoundById } from '../../../store/selectors';
import { Alert, Typography } from '@mui/material';
import { parseActivityCode } from '@wca/helpers';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

/**
 * Page-level component for viewing and managing a round.
 * Handles URL params, breadcrumbs, and error states.
 * Delegates core logic to RoundContainer.
 */
const RoundPage = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { roundId: activityCode } = useParams();
  const { eventId, roundNumber } = activityCode ? parseActivityCode(activityCode) : {};
  const roundId = eventId && roundNumber ? `${eventId}-r${roundNumber}` : undefined;

  const round = useAppSelector((state) => (roundId ? selectRoundById(state)(roundId) : undefined));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: activityCode || '',
      },
    ]);
  }, [setBreadcrumbs, activityCode]);

  // Handle invalid URL params
  if (!activityCode || !eventId || !roundNumber) {
    return (
      <Alert severity="error">
        <Typography>Invalid round URL. Please check the route parameters.</Typography>
      </Alert>
    );
  }

  // Handle round not found
  if (!round || !roundId) {
    return (
      <Alert severity="warning">
        <Typography>Round not found for {activityCode}.</Typography>
      </Alert>
    );
  }

  return (
    <RoundContainer roundId={roundId} activityCode={activityCode} eventId={eventId} round={round} />
  );
};

export default RoundPage;
