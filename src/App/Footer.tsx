import { WCA_ORIGIN } from '../lib/api';
import { Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import grey from '@mui/material/colors/grey';

const linkStyle = {
  verticalAlign: 'middle',
  fontWeight: 500,
  color: grey['900'],
  '&:hover': {
    textDecoration: 'none',
    opacity: 0.7,
  },
};

const gitSha = import.meta.env.VITE_GIT_SHA;

const links = [
  { text: 'GitHub', url: 'https://github.com/coder13/delegateDashboard' },
  { text: 'Contact', url: 'mailto:choover11@gmail.com' },
  ...(gitSha
    ? [
        {
          text: gitSha,
          url: `https://github.com/coder13/delegateDashboard/commit/${gitSha}`,
        },
      ]
    : []),
];

const Footer = () => {
  return (
    <Grid container sx={{ p: 2 }}>
      <Grid item>
        <Typography variant="body2">
          Made by{' '}
          <Link
            sx={linkStyle}
            href="https://github.com/coder13"
            target="_blank"
            rel="noopener noreferrer">
            Cailyn Hoover
          </Link>
        </Typography>
      </Grid>
      <Divider orientation="vertical" variant="middle" style={{ margin: '0 0.5em' }} />
      <Grid item>
        <Typography variant="body2">
          <Link
            sx={linkStyle}
            href="https://cailynhoover.com/donate"
            target="_blank"
            rel="noopener noreferrer">
            Donate
          </Link>
        </Typography>
      </Grid>
      <Divider orientation="vertical" variant="middle" style={{ margin: '0 0.5em' }} />
      <Grid item>
        <Typography variant="body2">
          {'Using data from '}
          <Link sx={linkStyle} href={WCA_ORIGIN} target="_blank" rel="noopener noreferrer">
            {WCA_ORIGIN}
          </Link>
        </Typography>
      </Grid>
      <Grid item sx={{ flexGrow: 1 }} />
      <Grid item>
        <Grid container spacing={1}>
          {links.map(({ text, url }) => (
            <Grid item key={text}>
              <Link
                sx={{
                  verticalAlign: 'middle',
                  fontWeight: 500,
                  color: grey['900'],
                  '&:hover': {
                    textDecoration: 'none',
                    opacity: 0.7,
                  },
                }}
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
