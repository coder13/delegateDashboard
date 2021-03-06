import React, { useEffect} from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import { makeStyles } from '@material-ui/core/styles';
import store from '../../store';
import Header from './Header';
import Footer from './Footer';
import Competition from '../Competition/'
import CompetitionList from '../CompetitionList'
import { isSignedIn, signIn, signOut } from '../../lib/auth';
import { getMe } from '../../lib/wcaAPI.js'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#3997b0'
    },
    secondary: {
      main: '#ffffff'
    },
  },
});

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    flexGrow: 1,
  },
  grow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 1,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const App = () => {
  const classes = useStyles();

  const handleSignIn = () => {
    signIn();
  }

  const handleSignOut = () => {
    signOut();
  };

  useEffect(() => {
    if (isSignedIn()) {
      getMe().then((me) => {
        console.log(me);
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  return (
    <Provider store={store}>
      <Router>
        <ThemeProvider theme={theme}>
          <div className={classes.root}>
            <CssBaseline/>
            <Header isSignedIn={isSignedIn} onSignIn={handleSignIn} onSignOut={handleSignOut}/>
            <Grid className={classes.grow}>
              <Grid item xs={12} md={12} xl={10} className={classes.main}>
                <Switch>
                  {isSignedIn() && <Route path="/competitions/:competitionId" component={Competition}/>}
                  <Route exact path="/">
                  {isSignedIn() ? <CompetitionList/> : <p>Sign in to view comps!</p>}
                  </Route>
                  <Redirect to="/"/>
                </Switch>
              </Grid>
            </Grid>
            <Footer/>
          </div>
        </ThemeProvider>
      </Router>
    </Provider>
  );
}

export default App;