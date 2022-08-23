import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Button, Card, CardActions, Grid, Typography } from '@mui/material';
import { CardContent } from '@mui/material';
import { acceptedRegistrations } from '../../lib/persons';
import { pluralize } from '../../lib/utils';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import Link from '../shared/MaterialLink';
import RoundSelectorPage from './RoundSelector';

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
          <b>Competitors: </b>
          {approvedRegistrations.length}
        </Typography>
        <Typography>
          <b>Date: </b>
          {wcif.schedule.startDate} ({pluralize(wcif.schedule.numberOfDays, 'day', 'days')})
        </Typography>
      </CardContent>
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
        <RoundSelectorPage />
      </Grid>
    </Grid>
  );
};

export default CompetitionHome;
