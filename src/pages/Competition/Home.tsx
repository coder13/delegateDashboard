import CompetitionSummary from '../../components/CompetitionSummaryCard';
import RoundSelectorPage from '../../components/RoundSelector';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import { Grid } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CompetitionHome = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const handleSelected = (roundId: string) => {
    navigate(`/competitions/${competitionId}/events/${roundId}`);
  };

  useEffect(() => {
    document.title = 'Delegate Dashboard';
  }, []);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <CompetitionSummary />
      </Grid>
      <Grid item>
        <RoundSelectorPage competitionId={competitionId || ''} onSelected={handleSelected} />
      </Grid>
    </Grid>
  );
};

export default CompetitionHome;
