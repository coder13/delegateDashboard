import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import PeopleIcon from '@mui/icons-material/People';
import { getMe } from '../../lib/wcaAPI.js'
import { useAuth } from '../providers/AuthProvider';

const useStyles = makeStyles(theme => ({
  title: {
    flexGrow: 1,
  },
  titleLink: {
    color: 'inherit',
    textDecoration: 'none',
  },
  titleIcon: {
    fontSize: '1.5em',
    verticalAlign: 'middle',
    marginRight: theme.spacing(1),
  },
}));

const Header = () => {
  const classes = useStyles();
  const { signIn, signOut, signedIn } = useAuth();

  useEffect(() => {
    if (signedIn()) {
      getMe().then((me) => {
        console.log(me);
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          <Link to='/' className={classes.titleLink}>
            <PeopleIcon className={classes.titleIcon}/>
            Delegate Dashboard
          </Link>
        </Typography>
        {signedIn() ? (
          <Button color="inherit" onClick={signOut}>
            Sign out
          </Button>
        ) : (
          <Button color="inherit" onClick={signIn}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
