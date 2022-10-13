import { intlFormat } from 'date-fns';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Grid, Typography } from '@mui/material';
import { CardContent } from '@mui/material';
import RoundSelectorPage from '../../components/RoundSelector';
import { shortEventNameById } from '../../lib/events';
import { acceptedRegistrations } from '../../lib/persons';
import { pluralize } from '../../lib/utils';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';

const CompetitionSummary = () => {
  const wcif = useSelector((state) => state.wcif);
  const approvedRegistrations = acceptedRegistrations(wcif.persons);

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" paragraph>
          {wcif.name}
        </Typography>
        <Typography>
          <b>Date: </b>
          {intlFormat(new Date(wcif.schedule.startDate), {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}{' '}
          ({pluralize(wcif.schedule.numberOfDays, 'day', 'days')})
        </Typography>
        <Typography>
          <b>Competitors: </b>
          {approvedRegistrations.length}
        </Typography>
        <Typography>
          <b>Events: </b>
          {wcif.events.map((event) => shortEventNameById(event.id)).join(', ')}
        </Typography>
      </CardContent>
    </Card>
  );
};

const CompetitionHome = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { competitionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const handleSelected = (roundId) => {
    navigate(`/competitions/${competitionId}/events/${roundId}`);
  };

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <CompetitionSummary />
      </Grid>
      <Grid item>
        <RoundSelectorPage competitionId={competitionId} onSelected={handleSelected} />
      </Grid>
    </Grid>
  );
};

export default CompetitionHome;
