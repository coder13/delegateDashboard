import React from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import red from '@material-ui/core/colors/red';
import grey from '@material-ui/core/colors/grey';
import { makeStyles } from '@material-ui/core/styles';

import { version } from '../../../package.json';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  grow: {
    flexGrow: 1,
  },
  link: {
    verticalAlign: 'middle',
    fontWeight: 500,
    color: grey['900'],
    '&:hover': {
      textDecoration: 'none',
      opacity: 0.7,
    },
  },
}));

const links = [
  { text: 'GitHub', url: 'https://github.com/coder13/groups' },
  { text: 'Contact', url: 'mailto:choover11@gmail.com' },
  {
    text: `v${version}`,
    url: 'https://github.com/coder13/groups',
  },
];

const Footer = () => {
  const classes = useStyles();
  return (
    <Grid container className={classes.root}>
      <Grid item>
        <Typography variant="body2">
          Made by{' '}
          <Link
            className={classes.link}
            href="https://github.com/coder13"
            target="_blank"
            rel="noopener noreferrer"
          >
            Caleb Hoover
          </Link>
        </Typography>
      </Grid>
      <Grid item className={classes.grow} />
      <Grid item>
        <Grid container spacing={1}>
          {links.map(({ text, url }) => (
            <Grid item key={text}>
              <Link
                className={classes.link}
                variant="body2"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {text}
              </Link>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Footer;
