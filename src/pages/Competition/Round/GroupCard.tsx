import MaterialLink from '../../../components/MaterialLink';
import {
  activityDuration,
  activityDurationString,
  parseActivityCode,
  type ActivityWithParent,
} from '../../../lib/domain/activities';
import { mayMakeCutoff, mayMakeTimeLimit } from '../../../lib/domain/persons';
import { useAppSelector } from '../../../store';
import { selectPersonsAssignedToActivitiyId } from '../../../store/selectors';
import ConfigureGroupDialog from './ConfigureGroupDialog';
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
import { type Activity, type Assignment, formatCentiseconds, type Person } from '@wca/helpers';
import React, { useCallback, useMemo, useState } from 'react';

interface PersonWithAssignment extends Person {
  assignedActivity: Assignment;
}

const withAssignmentCode =
  (activityId: number, assignmentCode: string) =>
  ({ assignedActivity }: PersonWithAssignment): boolean =>
    assignedActivity.activityId === activityId &&
    assignedActivity.assignmentCode.indexOf(assignmentCode) > -1;

interface GroupCardProps {
  groupActivity: Activity;
}

const GroupCard = ({ groupActivity }: GroupCardProps) => {
  const wcif = useAppSelector((state) => state.wcif);
  const personsAssigned = useAppSelector((state) =>
    selectPersonsAssignedToActivitiyId(state, groupActivity.id)
  ).map((p): PersonWithAssignment => {
    const assignedActivity = p.assignments?.find((a) => a.activityId === groupActivity.id);

    if (!assignedActivity) {
      throw new Error('Person is missing assignment for activity');
    }

    return {
      ...p,
      assignedActivity,
    };
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const { eventId, roundNumber } = parseActivityCode(groupActivity.activityCode);
  const round = wcif?.events
    ?.find((e) => e.id === eventId)
    ?.rounds?.find((r) => r.id === `${eventId}-r${roundNumber}`);

  const competitors = useMemo(
    () => personsAssigned.filter(withAssignmentCode(groupActivity.id, 'competitor')),
    [personsAssigned, groupActivity.id]
  );
  const staff = useMemo(
    () => personsAssigned.filter(withAssignmentCode(groupActivity.id, 'staff-')),
    [personsAssigned, groupActivity.id]
  );
  const judges = useMemo(
    () => staff.filter(withAssignmentCode(groupActivity.id, 'staff-judge')),
    [staff, groupActivity.id]
  );
  const scramblers = useMemo(
    () => personsAssigned.filter(withAssignmentCode(groupActivity.id, 'staff-scrambler')),
    [personsAssigned, groupActivity.id]
  );
  const runners = useMemo(
    () => staff.filter(withAssignmentCode(groupActivity.id, 'staff-runner')),
    [staff, groupActivity.id]
  );

  const other = useMemo(
    () =>
      staff.filter((p) =>
        p.assignments?.find(
          ({ activityId, assignmentCode }) =>
            activityId === groupActivity.id &&
            assignmentCode.indexOf('staff-') > -1 &&
            ['judge', 'scrambler', 'runner'].indexOf(assignmentCode.split('-')[1]) === -1
        )
      ),
    [groupActivity.id, staff]
  );

  const mapNames = useCallback(
    (array: PersonWithAssignment[]) =>
      array.length
        ? array
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ registrantId, name, assignments }) => {
              const assignment = assignments?.find((a) => a.activityId === groupActivity.id);

              if (!assignment) {
                return name;
              }

              return (
                <MaterialLink
                  key={registrantId || name}
                  to={`/competitions/${wcif?.id}/persons/${registrantId}`}>
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
    [groupActivity.id, wcif]
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

  const roomName = (groupActivity as ActivityWithParent).parent.room.name;

  const personalRecords = useMemo(
    () =>
      competitors
        .map((person) => {
          const pr = person.personalBests?.find(
            (pb) => pb.eventId === eventId && pb.type === 'average'
          );
          return pr?.best;
        })
        .filter((pr) => !!pr) as number[],
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
