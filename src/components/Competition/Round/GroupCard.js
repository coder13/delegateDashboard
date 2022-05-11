import React from 'react';
import { useSelector } from 'react-redux';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { parseActivityCode } from '../../../lib/activities';
import { Card, CardHeader, CardContent, CardActions } from '@mui/material';

const GroupCard = ({ groupData, roundActivity, groupActivity }) => {
  const wcif = useSelector((state) => state.wcif);

  const personsAssigned = wcif.persons.filter((p) => p.assignments.find((a) => a.activityId === groupActivity.id));
  const competitors = personsAssigned.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('competitor') > -1));
  const staff = personsAssigned.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-') > -1));
  const judges = staff.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-judge') > -1));
  const scramblers = staff.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-scrambler') > -1));
  const runners = staff.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-runner') > -1));
  const other = staff.filter((p) => p.assignments.find(({ assignmentCode }) => assignmentCode.indexOf('staff-') > -1 && ['judge', 'scrambler', 'runner'].indexOf(assignmentCode.split('-')[1]) === -1));

  return (
    <Card style={{ marginTop: '1em' }}>
      <CardHeader title={`Group ${parseActivityCode(groupActivity.activityCode).groupNumber}`} />
      <CardContent>
        <Grid container>
          <Grid item xs={4} style={{ padding: '0.5em' }}>
            <Typography>Staff</Typography>
            <Typography>Judges: {judges.map(({ name }) => name).join(', ')}</Typography>
            <Typography>Scramblers: {scramblers.map(({ name }) => name).join(', ')}</Typography>
            <Typography>Runners: {runners.map(({ name }) => name).join(', ')}</Typography>
            <Typography>Other: {other.map(({ name }) => name).join(', ')}</Typography>
          </Grid>
          <Grid item xs={8} style={{ padding: '0.5em' }}>
            <Typography>Competitors: </Typography><Typography>{competitors.map(({ name }) => name).join(', ')}</Typography>

          </Grid>
        </Grid>
      </CardContent>
      <CardActions>

      </CardActions>
    </Card>
  );
};

export default GroupCard;
