import { Outlet } from 'react-router-dom';
import { Alert, AlertTitle, Box } from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import Footer from './Footer';

const App = () => {
  const { userFetchError } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100vh',
      }}>
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          flexDirection: 'column',
          marginBottom: '0.5em',
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}>
        {userFetchError && (
          <Alert severity="error">
            <AlertTitle>Error when fetching user</AlertTitle>
            <p>{userFetchError.message}</p>
          </Alert>
        )}
        <Outlet />
      </div>
      <Footer />
    </Box>
  );
};

export default App;
