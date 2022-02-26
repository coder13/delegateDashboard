import React from 'react';
import { Outlet } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { makeStyles } from '@mui/styles';
import Header from './Header';
import Footer from './Footer';

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
    flexGrow: 1,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const App = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Header />
      <Grid className={classes.grow}>
        <Grid item xs={12} md={12} xl={10} className={classes.main}>
          <Outlet />
        </Grid>
      </Grid>
      <Footer/>
    </div>
  );
}

export default App;