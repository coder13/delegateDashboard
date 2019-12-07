import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import history from '../lib/history';
import Competition from './Competition'
import CompetitionList from './CompetitionList'
import { isSignedIn, signIn, signOut } from '../lib/auth';
import { getMe } from '../lib/wcaAPI.js'

const App = () => {
  const [signedIn, setSignedIn] = useState(isSignedIn());

  const handleSignIn = () => {
    signIn();
    setSignedIn(true);
  }

  const handleSignOut = () => {
    signOut();
    setSignedIn(false);
  };

  useEffect(() => {
    console.log(isSignedIn());
    if (isSignedIn()) {
      getMe().then((me) => {
        console.log(me);
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  return (
    <Router>
      <div>
        {isSignedIn() ?
          <button onClick={() => handleSignOut()}>Sign out</button> :
          <button onClick={() => handleSignIn()}>Sign in</button>}
        <ul>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/competitions'>Comps</Link>
          </li>
        </ul>

        <hr/>
        <Switch>
          <Route exact path='/' component={Home}/>
          <Route path="/competitions/:competitionId" component={Competition}/>
          <Route path='/competitions/' component={CompetitionList}/>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

export default App;