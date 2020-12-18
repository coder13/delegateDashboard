import React from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
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

const CompetitionHome = ({ match, wcif }) => {
  const classes = useStyles();

  const { path } = useRouteMatch();

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <Typography variant="h5" paragraph>{wcif.name}</Typography>
      <Typography paragraph>Competitors: {wcif.persons.length} / {wcif.competitorLimit}</Typography>
      <Typography paragraph>Events: {wcif.events.map((event) => event.id).join(', ')}</Typography>
      <Link to={`${path}/roles`}>Configure Roles</Link>
      <Link to={`${path}/rooms`}>Configure Rooms</Link>
    </Grid>
  );
};

const mapStateToProps = (state) => ({
  wcif: state.wcif,
});

export default connect(mapStateToProps)(CompetitionHome);