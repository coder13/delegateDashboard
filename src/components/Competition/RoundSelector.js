import React, { useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import '@cubing/icons';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListSubheader from '@mui/material/ListSubheader';
import { eventNameById } from '../../lib/events';
import { activityById, allActivities } from '../../lib/activities';
import { personsShouldBeInRound } from '../../lib/persons';
import { useMemo } from 'react';
import { pluralize } from '../../lib/utils';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'Column',
    flex: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    marginTop: '1em',
  },
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
  listSection: {
    backgroundColor: 'inherit',
  },
  ul: {
    backgroundColor: 'inherit',
    padding: 0,
  },
}));

const RoundSelectorPage = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const wcif = useSelector((state) => state.wcif);
  const classes = useStyles();

  useEffect(() => {
    setBreadcrumbs([{
      text: 'Events',
    }]);
  }, [setBreadcrumbs]);

  const _allActivities = useMemo(() => allActivities(wcif), [wcif]);

  return (
    <List className={classes.root}>
      {wcif.events.map((event) => (
        <li key={event.id} className={classes.listSection}>
          <ul className={classes.ul}>
            <ListSubheader>{eventNameById(event.id)}</ListSubheader>
            {event.rounds.map((round, index) => {
              const roundActivity = _allActivities.find((activity) => activity.activityCode === round.id);

              const _personsShouldBeInRound = personsShouldBeInRound(wcif.persons, round.id).length;
              const personsAssigned = wcif.persons.filter((p) => p.assignments.find((a) => {
                const activity = activityById(wcif, a.activityId);
                return activity.activityCode.split('-')[0] === round.id.split('-')[0] && activity.activityCode.split('-')[1] === round.id.split('-')[1];
              })).length;

              return (
                <ListItem key={round.id} button component={RouterLink} to={round.id}>
                  <ListItemAvatar>
                    <span className={`cubing-icon event-${event.id}`} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${eventNameById(event.id)} Round ${index + 1}`}
                    secondary={[
                      `${pluralize(roundActivity?.childActivities?.length, 'group', 'groups')} generated`,
                      `${pluralize(personsAssigned, 'person', 'people')} assigned of ${_personsShouldBeInRound}`
                    ].join(' | ')}
                  />
                </ListItem>
              )
            })}
          </ul>
        </li>
      ))}
    </List>
  );
};

export default RoundSelectorPage;
