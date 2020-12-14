import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'Column',
    flex: 1,
    width: '100%',
  },
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const EventPage = () => {
  const classes = useStyles();

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
    </Grid>
  );
};

export default EventPage;
