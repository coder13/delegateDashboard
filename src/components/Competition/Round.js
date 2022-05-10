import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '../shared/MaterialLink';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { activityById, allActivities, groupActivitiesByRound, parseActivityCode, personsShouldBeInRound } from '../../lib/activities';
import { generateGroupActitivites } from '../../store/actions';
import { Card, CardHeader, CardContent, CardActions } from '@mui/material';

const byWorldRanking = (eventId) => (a, b) => {
  const aPR = a.personalBests.find((i) => i.eventId.toString() === eventId.toString())?.best
  const bPR = b.personalBests.find((i) => i.eventId.toString() === eventId.toString())?.best;
  if (aPR && bPR) {
    return aPR - bPR;
  } else {
    return (aPR ? 1 : 0) - (aPR ? 1 : 0)
  }
}

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

const getGroupData = (roundActivity) => {
  // Start off with using groupifier and then build own version. Makes compatible with groupifier.
  if (roundActivity.extensions.find(({ id }) => id === 'groupifier.ActivityConfig')) {
    const groupifierData = roundActivity.extensions.find(({ id }) => id === 'groupifier.ActivityConfig').data;
    return {
      groups: groupifierData.groups,
      source: 'groupifier'
    }
  } else {
    // Tells app we need to create a group config
    return null;
  }
};

const GroupCard = ({ groupData, roundActivity, groupActivity }) => {
  const wcif = useSelector((state) => state.wcif);

  const personsAssigned = wcif.persons.filter((p) => p.assignments.find((a) => a.activityId === groupActivity.id));
  const competitors = personsAssigned.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('competitor') > -1));
  const staff = personsAssigned.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-') > -1));
  const judges = staff.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-judge') > -1));
  const scramblers = staff.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-scrambler') > -1));
  const runners = staff.filter((p) => p.assignments.find((a) => a.assignmentCode.indexOf('staff-runner') > -1));
  const other = staff.filter((p) => p.assignments.find(({ assignmentCode }) => assignmentCode.indexOf('staff-') > -1 && ['judge', 'scrambler', 'runner'].indexOf(assignmentCode.split('-')[1]) > -1));
  console.log(64, personsAssigned);


  return (
    <Card style={{marginTop: '1em'}}>
      <CardHeader title={`Group ${parseActivityCode(groupActivity.activityCode).groupNumber}`} />
      <CardContent>
        <Grid container>
          <Grid Item xs={4} style={{ padding: '0.5em' }}>
            <Typography>Staff</Typography>
            <Typography>Judges: {judges.length}</Typography>
            <Typography>Scramblers: {scramblers.length}</Typography>
            <Typography>Runners: {runners.length}</Typography>
            <Typography>Other: {staff.length}</Typography>
          </Grid>
          <Grid Item xs={8} style={{ padding: '0.5em' }}>
            <Typography>Competitors: </Typography><Typography>{competitors.length}</Typography>

          </Grid>
        </Grid>
      </CardContent>
      <CardActions>

      </CardActions>
    </Card>
  );
};

const RoundPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { competitionId, eventId, roundNumber } = useParams();
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
  })).length, [roundActivity.activityCode, wcif]);


  const onGenerateGroupActitivites = () => {
    dispatch(generateGroupActitivites(roundActivity.activityCode, groupData.groups));
  };

  const onResetGroupActitivites = () => {

  };

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
            <Typography>{`Round Size: ${personsShouldBeInRound(wcif, activityId)} | Assigned Persons: ${personsAssigned}`}</Typography>
          </CardContent>
          <CardActions>
            {<Button disabled={groupData.groups !== 0} onClick={onGenerateGroupActitivites}>Generate Group Activities From Config</Button>}
            {personsAssigned === 0
              ? <Button onClick={onGenerateGroupActitivites}>Assign Group Activites</Button>
              : <Button onClick={onResetGroupActitivites}>Reset Group Activities</Button>
            }
          </CardActions>
        </Card>
      </Grid>
      <Grid item>
        {groups.map((group) => (
          <GroupCard groupData={groupData} roundActivity={roundActivity} groupActivity={group} />
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
    </Grid>
  );
};

export default RoundPage;
