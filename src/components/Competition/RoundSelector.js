import React from 'react';
import { useRouteMatch, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import '@cubing/icons';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListSubheader from '@material-ui/core/ListSubheader';
import { eventNameById } from '../../lib/events';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'Column',
    flex: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
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
  const match = useRouteMatch();
  const wcif = useSelector((state) => state.wcif);
  const classes = useStyles();

  console.log(29, wcif.events);

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <List>
        {wcif.events.map((event) => (
          <li key={event.id} className={classes.listSection}>
            <ul className={classes.ul}>
              <ListSubheader>{eventNameById(event.id)}</ListSubheader>
              {event.rounds.map((round, index) => (
                <ListItem key={round.id} button component={RouterLink} to={`${match.url}/${round.id}`}>
                  <ListItemAvatar>
                    <span className={`cubing-icon event-${event.id}`} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${eventNameById(event.id)} Round ${index + 1}`}
                  />
                </ListItem>
              ))}
            </ul>
          </li>
        ))}
      </List>
    </Grid>
  );
};

export default RoundSelectorPage;
