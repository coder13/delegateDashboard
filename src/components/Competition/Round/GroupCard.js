import React from 'react';
import { useSelector } from 'react-redux';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Card, CardHeader, CardContent, CardActions, Alert, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { parseActivityCode } from '../../../lib/activities';

const mapNames = (array) => array.map(({ name }) => name).join(', ');

const GroupCard = ({ groupActivity }) => {
  const wcif = useSelector((state) => state.wcif);

  const personsAssigned = wcif.persons.filter((p) =>
    p.assignments.find((a) => a.activityId === groupActivity.id)
  );
  const competitors = personsAssigned.filter((p) =>
    p.assignments.find(
      (a) => a.activityId === groupActivity.id && a.assignmentCode.indexOf('competitor') > -1
    )
  );
  const staff = personsAssigned.filter((p) =>
    p.assignments.find(
      (a) => a.activityId === groupActivity.id && a.assignmentCode.indexOf('staff-') > -1
    )
  );
  const judges = staff.filter((p) =>
    p.assignments.find(
      (a) => a.activityId === groupActivity.id && a.assignmentCode.indexOf('staff-judge') > -1
    )
  );
  const scramblers = staff.filter((p) =>
    p.assignments.find(
      (a) => a.activityId === groupActivity.id && a.assignmentCode.indexOf('staff-scrambler') > -1
    )
  );
  const runners = staff.filter((p) =>
    p.assignments.find(
      (a) => a.activityId === groupActivity.id && a.assignmentCode.indexOf('staff-runner') > -1
    )
  );
  const other = staff.filter((p) =>
    p.assignments.find(
      ({ activityId, assignmentCode }) =>
        activityId === groupActivity.id &&
        assignmentCode.indexOf('staff-') > -1 &&
        ['judge', 'scrambler', 'runner'].indexOf(assignmentCode.split('-')[1]) === -1
    )
  );

  const errors = competitors
    .filter((competitor) => {
      return staff.find((s) => s.registrantId === competitor.registrantId);
    })
    .map((competitor) => ({
      message: `${competitor.name} (${competitor.wcaId}) is both competing and staffing!`,
    }));

  const roomName = groupActivity.parent.room.name;

  return (
    <Card style={{ marginTop: '1em' }}>
      <CardHeader
        title={`${roomName}: Group ${parseActivityCode(groupActivity.activityCode).groupNumber}`}
        subheader={`Group Size: ${personsAssigned.length}`}
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <div>
        {errors.map((error) => (
          <Alert severity="error">{error.message}</Alert>
        ))}
      </div>
      <CardContent>
        <Grid container>
          <Grid item xs={4} style={{ padding: '0.5em' }}>
            <Typography variant="h6">Staff ({staff.length})</Typography>
            <Typography>
              <b>Judges: </b>
              {mapNames(judges)}
            </Typography>
            <Typography>
              <b>Scramblers: </b>
              {mapNames(scramblers)}
            </Typography>
            <Typography>
              <b>Runners: </b>
              {mapNames(runners)}
            </Typography>
            {other.length > 0 && (
              <Typography>
                <b>Other: </b>
                {mapNames(other)}
              </Typography>
            )}
          </Grid>
          <Grid item xs={8} style={{ padding: '0.5em' }}>
            <Typography variant="h6">Competitors: ({competitors.length})</Typography>
            <Typography>{mapNames(competitors)}</Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions></CardActions>
    </Card>
  );
};

export default GroupCard;
