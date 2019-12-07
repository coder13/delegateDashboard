import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import PeopleIcon from '@material-ui/icons/People';

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

const Header = ({ isSignedIn, onSignIn, onSignOut }) => {
  const classes = useStyles();
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          <Link to='/' className={classes.titleLink}>
            <PeopleIcon className={classes.titleIcon}/>
            Groups
          </Link>
        </Typography>
        {isSignedIn() ? (
          <Button color="inherit" onClick={onSignOut}>
            Sign out
          </Button>
        ) : (
          <Button color="inherit" onClick={onSignIn}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
