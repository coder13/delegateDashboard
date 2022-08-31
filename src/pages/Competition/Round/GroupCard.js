import { formatCentiseconds } from '@wca/helpers';
import React from 'react';
import { useSelector } from 'react-redux';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Card, CardHeader, CardContent, CardActions, Alert, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import MaterialLink from '../../../components/MaterialLink';
import {
  activityDuration,
  activityDurationString,
  parseActivityCode,
} from '../../../lib/activities';

const GroupCard = ({ groupActivity }) => {
  const wcif = useSelector((state) => state.wcif);

  const mapNames = (array) =>
    array.length
      ? array
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ registrantId, name }) => (
            <MaterialLink to={`/competitions/${wcif.id}/persons/${registrantId}`}>
              {name}
            </MaterialLink>
          ))
          .reduce((a, b) => (
            <>
              {a}, {b}
            </>
          ))
      : null;

  const { eventId } = parseActivityCode(groupActivity.activityCode);

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

  const personalRecords = competitors
    .map((person) => {
      const pr = person.personalBests.find((pb) => pb.eventId === eventId && pb.type === 'average');
      return pr?.best;
    })
    .filter((pr) => !!pr);
  const averageSpeed = Math.round(
    personalRecords.reduce((a, b) => a + b, 0) / personalRecords.length
  );

  const firstTimers = competitors.filter((person) => !person.wcaId);

  const minutes = activityDuration(groupActivity) / 60000;
  const subheader = [
    `Time: ${activityDurationString(groupActivity)} (${minutes} Minutes)`,
    `Group Size: ${personsAssigned.length}`,
    `Average PR: ${averageSpeed ? formatCentiseconds(averageSpeed) : '???'}`,
    `First Timers: ${firstTimers.length}`,
  ].join(' | ');

  return (
    <Card style={{ marginTop: '1em' }}>
      <CardHeader
        title={`${roomName}: Group ${parseActivityCode(groupActivity.activityCode).groupNumber}`}
        subheader={subheader}
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <div>
        {errors.map((error) => (
          <Alert key={error.message} severity="error">
            {error.message}
          </Alert>
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
