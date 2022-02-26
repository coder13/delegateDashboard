import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import '@cubing/icons';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListSubheader from '@mui/material/ListSubheader';
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
  const location = useLocation();
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
                <ListItem key={round.id} button component={RouterLink} to={round.id}>
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
