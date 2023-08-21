import { Alert, Button, Container, Divider, Typography } from '@mui/material';
import mca_logo from '../../assets/mca_logo.png';
import { useAuth } from '../../providers/AuthProvider';
import CompetitionList from '../CompetitionList';
import Header from './Header';

const Home = () => {
  const { signedIn, signIn } = useAuth();

  return (
    <>
      <Header />
      <div style={{ overflowY: 'auto', paddingTop: '1em' }}>
        <Container>
          <Alert
            severity="info"
            action={
              <Button
                color="inherit"
                size="small"
                href="https://cailynhoover.com/donate"
                target="_blank"
                rel="noreferrer">
                Donate
              </Button>
            }>
            <Typography variant="body2">
              This tool is in an open beta. If you enjoy using this tool for your competitions,
              please consider donating.
            </Typography>
          </Alert>
          <br />
          <div>
            <Typography>
              Delegate Dashboard is graciously supported by the following organizations:
            </Typography>
            <div>
              <img src={mca_logo} alt="Midwest Cubing Association logo" height={120} />
            </div>
          </div>
        </Container>
        <br />
        {signedIn() ? (
          <CompetitionList />
        ) : (
          <Container>
            <Typography>
              Welcome to Delegate Dashboard!
              <br />
              A stage-conscious groups management tool for WCA competitions
              <br />
              Use this tool to generate and configure groups, export data, or import your own
              groups!
              <br />
              Requires no setup. Configure groups for any round you want!
              <br />
              pick scramblers, number of groups, and populate the groups with the press of a button.
            </Typography>
            <Divider style={{ margin: '1em 0' }} />
            <Typography>Sign in to view comps!</Typography>
            <Button onClick={() => signIn()} variant="outlined">
              Sign In
            </Button>
          </Container>
        )}
      </div>
    </>
  );
};

export default Home;
