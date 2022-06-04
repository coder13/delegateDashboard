import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Card, CardActions, Grid, Typography } from '@mui/material';
import { CardContent } from '@mui/material';
import { acceptedRegistrations } from '../../lib/persons';
import { pluralize } from '../../lib/utils';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import Link from '../shared/MaterialLink';
import RoundSelectorPage from './RoundSelector';

const CompetitionSummary = () => {
  const wcif = useSelector((state) => state.wcif);
  const approvedRegistrations = acceptedRegistrations(wcif.persons).filter(
    (person) => person.registration.status === 'accepted'
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" paragraph>
          {wcif.name}
        </Typography>
        <Typography>
          <b>Competitors: </b>
          {approvedRegistrations.length}
        </Typography>
        <Typography>
          <b>Date: </b>
          {wcif.schedule.startDate} ({pluralize(wcif.schedule.numberOfDays, 'day', 'days')})
        </Typography>
      </CardContent>
      <CardActions>
        <Link to="export">Export Data</Link>
        <Link to="assignments">View All Assignments</Link>
      </CardActions>
    </Card>
  );
};

const CompetitionHome = () => {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <CompetitionSummary />
      </Grid>
      <Grid item>
        <Alert severity="error">
          <Link to="roles">Pick Staff!</Link>
        </Alert>
      </Grid>
      <Grid item>
        <RoundSelectorPage />
      </Grid>
    </Grid>
  );
};

export default CompetitionHome;
