import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { AssignmentsTableWithToolbar } from '../../../components/AssignmentsTable';
import { RoundSummaryCard } from '../../../components/RoundSummaryCard/RoundSummaryCard';
import { findRoundActivitiesById } from '../../../lib/activities';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppSelector } from '../../../store';
import { selectRoundById } from '../../../store/selectors';

/**
 * I want some visualization of who's competing / staffing what for this particular round
 * If no one has been assigned, I want to generate assignments
 * I want to view a mini psych sheet so that I can pick scramblers
 * I want DOB so that I know who really not to bother assigning
 *
 */

/**
 * Handles multiple activities across multiple rooms under 1 round activity code
 */
const RoundPage = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { eventId, roundNumber } = useParams();
  const activityCode = `${eventId}-r${roundNumber}`;

  const wcif = useAppSelector((state) => state.wcif);
  const round = useAppSelector((state) => selectRoundById(state)(activityCode));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: round.id,
      },
    ]);
  }, [setBreadcrumbs, round.id]);

  // list of each stage's round activity
  const roundActivities = findRoundActivitiesById(wcif, activityCode);

  if (roundActivities.length === 0) {
    return (
      <div>
        No Group Activities found. <br />
        If you're viewing 3x3 fewest moves, there's likely not much to do here yet.
      </div>
    );
  }

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <RoundSummaryCard activityCode={activityCode} />
      </Grid>

      <Grid item>
        <AssignmentsTableWithToolbar activityCode={activityCode} />
      </Grid>
    </Grid>
  );
};

export default RoundPage;
