import React, { useState, useEffect } from 'react';
import { Switch, Route, Redirect, useRouteMatch } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import CompetitionHome from './Home';
import EventPage from './Event';
import { getWcif } from '../../lib/wcaAPI.js'
import { updateIn } from '../../lib/utils';
import { sortWcifEvents } from '../../lib/events';
import { validateWcif } from '../../lib/wcif-validation';
import { CompetitionProvider } from './CompetitionProvider';

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
  const classes = useStyles();

  const { path, params } = useRouteMatch();

  const [wcif, setWcif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    getWcif(params.competitionId)
      /* Sort events, so that we don't need to remember about this everywhere. */
      .then(wcif => updateIn(wcif, ['events'], sortWcifEvents))
      .then(wcif => {
        setWcif(wcif);
        setErrors(validateWcif(wcif));
      })
      .catch(error => setErrors([error.message]))
      .finally(() => setLoading(false));
  }, [params.competitionId]);

  if (loading) {
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

  console.log(wcif);

  if (!wcif) {
    return 'dunno';
  }

  return (
    <div className={classes.root}>
      <CompetitionProvider competition={wcif}>
        <Switch>
          <Route exact path={`/competitions/${params.competitionId}`}>
            <CompetitionHome/>
          </Route>
          <Route exact path={`${path}/assignments/:activityId`}>
            <CompetitionHome/>
          </Route>
          <Route path={path}>
            <Redirect to={`/competitions/${params.competitionId}`}/>
          </Route>
        </Switch>
      </CompetitionProvider>
    </div>
  );
}

export default Competition;