import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { useCompetition } from './CompetitionProvider';

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

const CompetitionHome = () => {
  const classes = useStyles();

  const wcif = useCompetition();

  return (
    <div className={classes.root}>
      <Grid container direction="column" spacing={2}>
        <Paper className={classes.paper}>
          <Typography variant="h5" paragraph>{wcif.name}</Typography>
          <Typography paragraph>Competitors: {wcif.persons.length} / {wcif.competitorLimit}</Typography>
          <Typography paragraph>Events: {wcif.events.map((event) => event.id).join(', ')}</Typography>
        </Paper>
      </Grid>
    </div>
  );
}

export default CompetitionHome;