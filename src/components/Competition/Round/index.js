import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '../../shared/MaterialLink';
import Button from '@mui/material/Button';
import { activityById, allActivities, byGroupNumber, groupActivitiesByRound, parseActivityCode } from '../../../lib/activities';
import { personsShouldBeInRound } from '../../../lib/persons';
import { bulkAddPersonAssignment, bulkRemovePersonAssignment } from '../../../store/actions';
import { Card, CardHeader, CardContent, CardActions } from '@mui/material';
import GroupCard from './GroupCard';
import ConfigureScramblersDialog from './ConfigureScramblersDialog';
import { getGroupData } from '../../../lib/wcif-extensions';
import { useConfirm } from 'material-ui-confirm';

// const byWorldRanking = (eventId) => (a, b) => {
//   const aPR = a.personalBests.find((i) => i.eventId.toString() === eventId.toString())?.best
//   const bPR = b.personalBests.find((i) => i.eventId.toString() === eventId.toString())?.best;
//   if (aPR && bPR) {
//     return aPR - bPR;
//   } else {
//     return (aPR ? 1 : 0) - (aPR ? 1 : 0)
//   }
// }

/**
 * I want some visualization of who's competing / staffing what for this particular round
 * If no one has been assigned, I want to generate assignments
 * I want to view a mini psych sheet so that I can pick scramblers
 * I want DOB so that I know who really not to bother assigning
 * 
 */

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flex: 1,
    width: '100%',
  },
  competitors: {
    display: 'flex',
    flex: 1,
    width: '100%',
  },
}));

const RoundPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { competitionId, eventId, roundNumber } = useParams();
  const [configureScramblersDialog, setConfigureScramblersDialog] = useState(false);

  const activityId = `${eventId}-r${roundNumber}`;
  const wcif = useSelector((state) => state.wcif);
  const round = wcif.events.find((event) => event.id === eventId)?.rounds[roundNumber - 1];

  const _allActivities = allActivities(wcif);

  const roundActivity = _allActivities.find((activity) => activity.activityCode === activityId);

  const startTime = new Date(roundActivity.startTime);
  const endTime = new Date(roundActivity.endTime);

  const groupData = getGroupData(roundActivity);

  const groups = groupActivitiesByRound(wcif, activityId);

  const registeredPersonsForEvent = wcif.persons.filter(({ registration }) =>
    (registration.status === 'accepted' && registration.eventIds.indexOf(eventId) > -1)
  );

  const unassignedRegisteredPersons = registeredPersonsForEvent.filter(({ assignments }) =>
    !assignments.some((assignment) => _allActivities.find(({ id }) => id === assignment.activityId))
  );

  const personsAssigned = useMemo(() => wcif.persons.filter((p) => p.assignments.find((a) => {
    const activity = activityById(wcif, a.activityId);
    return activity.activityCode.split('-')[0] === roundActivity.activityCode.split('-')[0] && activity.activityCode.split('-')[1] === roundActivity.activityCode.split('-')[1];
  })), [roundActivity.activityCode, wcif]);

  const personsAssignedToCompeteOrJudge = useMemo(() => wcif.persons.filter((p) => p.assignments.find((a) => {
    const activity = activityById(wcif, a.activityId);
    return activity.activityCode.split('-')[0] === roundActivity.activityCode.split('-')[0]
      && activity.activityCode.split('-')[1] === roundActivity.activityCode.split('-')[1]
      && ['competitor', 'staff-judge'].indexOf(a.assignmentCode) > -1;
  })).length, [roundActivity.activityCode, wcif]);

  const onGenerateGroupActitivites = () => {
    // determine who needs assignments
    // pick groups for them
    // assign their judging assignment to be the group after
    const groupsActivityIds = groups.map((_, index) => groups.find((g) => parseActivityCode(g.activityCode)?.groupNumber === index + 1).id);
    const assignments = [];

    // start with scramblers
    const scramblers = personsAssigned
      .filter((p) => p.assignments.find((a) => groupsActivityIds.indexOf(a.activityId) > -1 && a.assignmentCode === 'staff-scrambler'))
      .map((p) => {
        const scramblingAssignments = p.assignments.filter((a) => groupsActivityIds.indexOf(a.activityId) > -1 && a.assignmentCode === 'staff-scrambler').map(({ activityId }) => groupsActivityIds.findIndex((g) => activityId === g));

        return {
          registrantId: p.registrantId,
          groupNumber: Math.min(...scramblingAssignments),
        };
      });

    debugger;

    assignments.push(...scramblers.map((s) => ({
      registrantId: s.registrantId,
      assignment: {
        assignmentCode: 'competitor',
        activityId: groupsActivityIds[(s.groupNumber + groupsActivityIds.length - 1) % groupsActivityIds.length],
        stationNumber: null,
      },
    })));

    dispatch(bulkAddPersonAssignment(assignments));
  };

  const onResetGroupActitivites = () => {
    confirm({
      description: 'Do you really want to reset all group activities in this round?',
      confirmationText: 'Yes',
      cancellationText: 'No',
    })
      .then(() => {
        // remove competitor assignments for groups
        dispatch(bulkRemovePersonAssignment([
          ...groups.map((group) => ({
            activityId: group.id,
            assignmentCode: 'staff-judge',
          })),
          ...groups.map((group) => ({
            activityId: group.id,
            assignmentCode: 'competitor',
          })),
        ]))
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const onAssignStaff = () => {
    setConfigureScramblersDialog(true);
  }

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <Grid item>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to={`/competitions/${competitionId}`}>
            {wcif.name || competitionId}
          </Link>
          <Link to={`/competitions/${competitionId}/events`}>
            Events
          </Link>
          <Typography color="textPrimary">{activityId}</Typography>
        </Breadcrumbs>
      </Grid>
      <Grid item>
        <Card>
          <CardHeader title="Round Information" />
          <CardContent>
            <Typography>{unassignedRegisteredPersons.length} Unassigned competitors</Typography>
            <Typography>Time: {startTime.toLocaleDateString()} {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()} ({(endTime - startTime) / 1000 / 60} Minutes)</Typography>
            {!groupData
              ? <Link style={{ display: 'block' }} to={`/competitions/${competitionId}/rooms`}>Need to configure group config</Link>
              : <Typography>{`Groups: ${groupData.groups} (source: ${groupData.source}) | Competitors per group: ${Math.round(unassignedRegisteredPersons.length / groupData.groups)}`}</Typography>
            }
            <Typography>{`Round Size: ${personsShouldBeInRound(wcif, activityId).length} | Assigned Persons: ${personsAssigned.length}`}</Typography>
          </CardContent>
          <CardActions>
            {<Button disabled={!groupData || groupData.groups !== 0} onClick={onGenerateGroupActitivites}>Generate Group Activities From Config</Button>}
            <Button onClick={onAssignStaff}>Choose Scramblers</Button>
            {personsAssignedToCompeteOrJudge === 0
              ? <Button onClick={onGenerateGroupActitivites}>Assign Competitor and Judging Assignments</Button>
              : <Button onClick={onResetGroupActitivites}>Reset Non-scrambling Assignments</Button>
            }
          </CardActions>
        </Card>
      </Grid>
      <Grid item>
        {groups.sort(byGroupNumber).map((group) => (
          <GroupCard key={group.id} groupData={groupData} roundActivity={roundActivity} groupActivity={group} />
        ))}
      </Grid>
      {/* <Grid item container direction="row" className={classes.competitors}>
        <Grid item xs={6}>
          <List>
            {registeredPersonsForEvent.sort(byWorldRanking(eventId)).map((person) => (
              <ListItem>
                <ListItemText primary={person.name} secondary={`${person.roles.join(', ')}`}/>
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={6}>Groups</Grid>
      </Grid> */}
      <ConfigureScramblersDialog open={configureScramblersDialog} onClose={() => setConfigureScramblersDialog(false)} round={round} roundActivity={roundActivity} />
    </Grid>
  );
};

export default RoundPage;
