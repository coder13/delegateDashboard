import React, { useEffect } from 'react';
import { Switch, Route, Redirect, useRouteMatch } from 'react-router-dom';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import CompetitionHome from './Home';
import RolesPage from './Roles';
import EventPage from './Event';
import PersonPage from './Person';
import RoomsPage from './Rooms';
import { fetchWCIF } from '../../store/actions';

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

const Competition = ({ fetchingWCIF, wcif, errors }) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { path, params } = useRouteMatch();

  useEffect(() => {
    dispatch(fetchWCIF(params.competitionId))
  }, [dispatch, params.competitionId]);

  if (fetchingWCIF) {
    return (<div><p>Loading...</p></div>)
  }

  if (errors.length) {
    return (
      <div>
        Errors!
        <ul>
          {errors.map(err => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      </div>
    )
  }

  if (!wcif) {
    return 'dunno';
  }

  return (
    <div className={classes.root}>
      <Switch>
        <Route exact path={`/competitions/${params.competitionId}`}>
          <CompetitionHome/>
        </Route>
        <Route path={`${path}/roles`}>
          <RolesPage/>
        </Route>
        <Route path={`${path}/rooms`}>
          <RoomsPage/>
        </Route>
        <Route path={`${path}/assignments/:activityId`}>
          <EventPage/>
        </Route>
        <Route path={`${path}/person/:registrantId`}>
          <PersonPage/>
        </Route>
        <Route path={path}>
          <Redirect to={`/competitions/${params.competitionId}`}/>
        </Route>
      </Switch>
    </div>
  );
}

const mapStateToProps = (state) => ({
  fetchingWCIF: state.fetchingWCIF,
  wcif: state.wcif,
  errors: state.errors,
});

export default connect(mapStateToProps)(Competition);