import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { OauthSender } from 'react-oauth-flow';

console.log(process.env)

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: '',
    };
  }
  
  Login () {
    let onAuthSuccess = async (accessToken, { response, state }) => {

    }

    let handleError = error => {
      console.error(error);
    }

    return (
      <OauthSender
         authorizeUrl='https://staging.worldcubeassociation.org/oauth/authorize'
         clientId={process.env.CLIENT_ID}
         clientSecret={process.env.CLIENT_SECRET}
         redirectUri='http://localhost:3000/oauth/callback'
         args={{scope: 'email public'}}
         onAuthError={handleError}
         onAuthSuccess={onAuthSuccess}
         render={({ url }) => <a href={url}>Login</a>}
       />
    );
  }

  render () {
    let Login = this.Login;

    return (
      <Router>
        <div>
          <Login/>
          <ul>
            <li>
              <Link to='/'>Home</Link>
            </li>
          </ul>

          <hr/>
          <Switch>
            <Route exact path='/'>
              <Home/>
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}