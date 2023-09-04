import { formatCentiseconds } from '@wca/helpers';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import MaterialLink from '../../../components/MaterialLink';
import {
  activityDuration,
  activityDurationString,
  parseActivityCode,
} from '../../../lib/activities';
import { mayMakeCutoff, mayMakeTimeLimit } from '../../../lib/persons';
import { selectPersonsAssignedToActivitiyId } from '../../../store/selectors';
import ConfigureGroupDialog from './ConfigureGroupDialog';

const withAssignmentCode =
  (assignmentCode) =>
  ({ assignedActivities }) =>
    assignedActivities.some((assignment) => assignment.assignmentCode.includes(assignmentCode));

const GroupCard = ({ groupActivity }) => {
  const wcif = useSelector((state) => state.wcif);

  const personsAssigned = useSelector((state) =>
    selectPersonsAssignedToActivitiyId(state, groupActivity.id)
  ).map((p) => ({
    ...p,
    assignedActivities: p.assignments.filter((a) => a.activityId === groupActivity.id),
  }));

  const [anchorEl, setAnchorEl] = useState(null);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const { eventId, roundNumber } = parseActivityCode(groupActivity.activityCode);
  const round = wcif?.events
    ?.find((e) => e.id === eventId)
    ?.rounds?.find((r) => r.id === `${eventId}-r${roundNumber}`);

  const competitors = personsAssigned.filter(withAssignmentCode('competitor'));
  const staff = personsAssigned.filter(withAssignmentCode('staff-'));
  const judges = staff.filter(withAssignmentCode('staff-judge'));
  const scramblers = personsAssigned.filter(withAssignmentCode('staff-scrambler'));
  const runners = staff.filter(withAssignmentCode('staff-runner'));

  const other = useMemo(
    () =>
      staff.filter((p) =>
        p.assignments.find(
          ({ activityId, assignmentCode }) =>
            activityId === groupActivity.id &&
            assignmentCode.indexOf('staff-') > -1 &&
            ['judge', 'scrambler', 'runner'].indexOf(assignmentCode.split('-')[1]) === -1
        )
      ),
    [groupActivity.id, staff]
  );

  const mapNames = useCallback(
    (array) =>
      array.length
        ? array
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ registrantId, name, assignments }) => {
              const assignment = assignments.find((a) => a.activityId === groupActivity.id);

              return (
                <MaterialLink to={`/competitions/${wcif.id}/persons/${registrantId}`}>
                  {`${name}${assignment?.stationNumber ? ` (${assignment.stationNumber})` : ''}`}
                </MaterialLink>
              );
            })
            .reduce((a, b) => (
              <>
                {a}, {b}
              </>
            ))
        : null,
    [groupActivity.id, wcif.id]
  );

  const errors = useMemo(
    () =>
      competitors
        .filter((competitor) => {
          return staff.find((s) => s.registrantId === competitor.registrantId);
        })
        .map((competitor) => ({
          message: `${competitor.name} (${competitor.wcaId}) is both competing and staffing!`,
        })),
    [competitors, staff]
  );

  const roomName = groupActivity.parent.room.name;

  const personalRecords = useMemo(
    () =>
      competitors
        .map((person) => {
          const pr = person.personalBests.find(
            (pb) => pb.eventId === eventId && pb.type === 'average'
          );
          return pr?.best;
        })
        .filter((pr) => !!pr),
    [competitors, eventId]
  );

  const averageSpeed = Math.round(
    personalRecords.reduce((a, b) => a + b, 0) / personalRecords.length
  );

  const firstTimers = competitors.filter((person) => !person.wcaId);

  const mightMakeTimeLimit = useMemo(
    () => mayMakeTimeLimit(eventId, round, competitors) || [],
    [competitors, eventId, round]
  );

  const mightMakeCutoff = useMemo(
    () => mayMakeCutoff(eventId, round, competitors) || [],
    [competitors, eventId, round]
  );

  const minutes = activityDuration(groupActivity) / 60000;
  const subheader = [
    `Time: ${activityDurationString(groupActivity)} (${minutes.toFixed(2)} Minutes)`,
    `Group Size: ${personsAssigned.length}`,
    `Average PR: ${averageSpeed ? formatCentiseconds(averageSpeed) : '???'}`,
    `First Timers: ${firstTimers.length}`,
    `Under TimeLimit: ${mightMakeTimeLimit.length}`,
    `Under Cutoff: ${mightMakeCutoff.length}`,
  ].join(' | ');

  return (
    <>
      <Card style={{ marginTop: '1em' }}>
        <CardHeader
          title={`${roomName}: Group ${parseActivityCode(groupActivity.activityCode).groupNumber}`}
          subheader={subheader}
          action={
            <IconButton aria-label="settings" onClick={handleMenuOpen}>
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
      <Menu
        id="room-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <MenuItem onClick={() => setEditGroupDialogOpen(true)}>Edit</MenuItem>
      </Menu>
      {groupActivity && (
        <ConfigureGroupDialog
          open={editGroupDialogOpen}
          onClose={() => setEditGroupDialogOpen(false)}
          activity={groupActivity}
        />
      )}
    </>
  );
};

export default GroupCard;
