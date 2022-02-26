import React, { useEffect } from 'react';
import { Switch, Route, Redirect, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import CompetitionHome from './Home';
import RolesPage from './Roles';
import RoundSelectorPage from './RoundSelector';
import PersonPage from './Person';
import RoomsPage from './Rooms';
import RoundPage from './Round';
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

const Competition = () => {
  const fetchingWCIF = useSelector((state) => state.fetchingWCIF);
  const needToSave = useSelector((state) => state.needToSave);
  const errors = useSelector((state) => state.errors);
  const wcif = useSelector((state) => state.wcif);
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
    return 'No WCIF';
  }

  return (
    <div className={classes.root}>
      { needToSave && (<Alert severity="error">This is an error alert — check it out!</Alert>) }
      <Switch>
        <Route exact path={`/competitions/${params.competitionId}`}>
          <CompetitionHome/>
        </Route>
        <Route exact path={`${path}/roles`}>
          <RolesPage/>
        </Route>
        <Route exact path={`${path}/rooms`}>
          <RoomsPage/>
        </Route>
        <Route exact path={`${path}/events/:eventId-r:roundNumber`}>
          <RoundPage/>
        </Route>
        <Route exact path={`${path}/events`}>
          <RoundSelectorPage/>
        </Route>
        <Route exact path={`${path}/persons/:registrantId`}>
          <PersonPage/>
        </Route>
        <Route path={path}>
          <Redirect to={`/competitions/${params.competitionId}`}/>
        </Route>
      </Switch>
    </div>
  );
}

export default Competition;
