import { Button, Container, Divider, Typography } from '@mui/material';
import { useAuth } from '../../providers/AuthProvider';
import CompetitionList from '../CompetitionList';
import Header from './Header';

const Home = () => {
  const { signedIn, signIn } = useAuth();

  return (
    <>
      <Header />
      <div style={{ overflowY: 'auto', paddingTop: '1em' }}>
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
