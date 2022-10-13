import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { RoundSummaryCard } from '../../../components/RoundSummaryCard/RoundSummaryCard';
import {
  findAllActivities,
  byGroupNumber,
  findGroupActivitiesByRound,
  roomByActivity,
} from '../../../lib/activities';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { selectRoundById } from '../../../store/selectors';
import GroupCard from './GroupCard';

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

  const wcif = useSelector((state) => state.wcif);
  const round = useSelector((state) => selectRoundById(state)(activityCode));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: round.id,
      },
    ]);
  }, [setBreadcrumbs, round.id]);

  const _allActivities = findAllActivities(wcif);

  // list of each stage's round activity
  const roundActivities = _allActivities
    .filter((activity) => activity.activityCode === activityCode)
    .map((activity) => ({
      ...activity,
      room: roomByActivity(wcif, activity.id),
    }));

  const groups = findGroupActivitiesByRound(wcif, activityCode);

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        return (
          byGroupNumber(groupA, groupB) ||
          groupA?.parent?.room?.name?.localeCompare(groupB?.parent?.room?.name)
        );
      }),
    [groups]
  );

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
        {sortedGroups.map((group) => (
          <GroupCard key={group.id} groupActivity={group} />
        ))}
      </Grid>
    </Grid>
  );
};

export default RoundPage;
