import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Typography from '@material-ui/core/Typography';
import Link from '../shared/MaterialLink';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { allActivities, groupActivitiesByRound } from '../../lib/activities';

const byWorldRanking = (eventId) => (a, b) => {
  const aPR = a.personalBests.find((i) => i.eventId.toString() === eventId.toString())?.best
  const bPR =  b.personalBests.find((i) => i.eventId.toString() === eventId.toString())?.best;
  console.log(aPR || 1, bPR || 1);
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
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const RoundPage = () => {
  const classes = useStyles();
  const match = useRouteMatch();
  const { competitionId, eventId, roundNumber } = match.params;
  const activityId = `${eventId}-r${roundNumber}`;
  const wcif = useSelector((state) => state.wcif);
  const round = wcif.events.find((event) => event.id === eventId)?.rounds[roundNumber];

  const _allActivities = allActivities(wcif);

  const activities = groupActivitiesByRound(wcif, activityId);

  const registeredPersonsForEvent = wcif.persons.filter(({ registration }) =>
    (registration.status === 'accepted' && registration.eventIds.indexOf(eventId) > -1)
  );

  console.log(25, registeredPersonsForEvent);
  const unassignedRegisteredPersons = registeredPersonsForEvent.filter(({ assignments }) =>
    !assignments.some((assignment) => _allActivities.find(({ id }) => id === assignment.activityId))
  );

  console.log(20, unassignedRegisteredPersons)

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
        {unassignedRegisteredPersons.length} Unassigned competitors
      </Grid>
      <Grid item container direction="row" className={classes.competitors}>
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
      </Grid>
    </Grid>
  );
};

export default RoundPage;
