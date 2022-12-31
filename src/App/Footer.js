import React from 'react';
import { Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import grey from '@mui/material/colors/grey';
import { makeStyles } from '@mui/styles';
import { WCA_ORIGIN } from '../lib/wca-env';

const useStyles = makeStyles({
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
});

const links = [
  { text: 'GitHub', url: 'https://github.com/coder13/delegateDashboard' },
  { text: 'Contact', url: 'mailto:choover11@gmail.com' },
  {
    text: `v${process.env.REACT_APP_VERSION}`,
    url: 'https://github.com/coder13/delegateDashboard',
  },
];

const Footer = () => {
  const classes = useStyles();
  return (
    <Grid container sx={{ p: 2 }}>
      <Grid item>
        <Typography variant="body2">
          Made by{' '}
          <Link
            className={classes.link}
            href="https://github.com/coder13"
            target="_blank"
            rel="noopener noreferrer">
            Caleb Hoover
          </Link>
        </Typography>
      </Grid>
      <Divider orientation="vertical" variant="middle" style={{ margin: '0 0.5em' }} />
      <Grid item>
        <Typography variant="body2">
          {'Using data from '}
          <Link
            className={classes.link}
            href={WCA_ORIGIN}
            target="_blank"
            rel="noopener noreferrer">
            {WCA_ORIGIN}
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
                rel="noopener noreferrer">
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
