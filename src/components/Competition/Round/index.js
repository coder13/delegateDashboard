import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '../../shared/MaterialLink';
import Button from '@mui/material/Button';
import { activityById, allActivities, groupActivitiesByRound, personsShouldBeInRound } from '../../../lib/activities';
import { generateGroupActitivites } from '../../../store/actions';
import { Card, CardHeader, CardContent, CardActions } from '@mui/material';
import GroupCard from './GroupCard';
import ConfigureScramblersDialog from './ConfigureScramblersDialog';

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

const RoundPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { competitionId, eventId, roundNumber } = useParams();
  const [ configureScramblersDialog, setConfigureScramblersDialog ] = useState(false);

  const activityId = `${eventId}-r${roundNumber}`;
  const wcif = useSelector((state) => state.wcif);
  const round = wcif.events.find((event) => event.id === eventId)?.rounds[roundNumber - 1];

  const _allActivities = allActivities(wcif);

  const roundActivity = _allActivities.find((activity) => activity.activityCode === activityId);

  const startTime = new Date(roundActivity.startTime);
  const endTime = new Date(roundActivity.endTime);

  const groupData = getGroupData(roundActivity);

  const groups = groupActivitiesByRound(wcif, activityId);
  console.log(80, groups);

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

  const onAssignStaff = () => {
    // show dialog
    setConfigureScramblersDialog(true);
    // Show filtered list of persons where their role is staffing of some kind (their specific kind) and pick them for each group
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
            <Typography>{`Round Size: ${personsShouldBeInRound(wcif, activityId)} | Assigned Persons: ${personsAssigned}`}</Typography>
          </CardContent>
          <CardActions>
            {<Button disabled={!groupData || groupData.groups !== 0} onClick={onGenerateGroupActitivites}>Generate Group Activities From Config</Button>}
            <Button onClick={onAssignStaff}>Choose Scramblers</Button>
            {personsAssigned === 0
              ? <Button onClick={onGenerateGroupActitivites}>Assign Group Activites</Button>
              : <Button onClick={onResetGroupActitivites}>Reset Group Activities</Button>
            }
          </CardActions>
        </Card>
      </Grid>
      <Grid item>
        {groups.map((group) => (
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
