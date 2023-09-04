import React from 'react';
import { Outlet } from 'react-router-dom';
import { Alert, AlertTitle } from '@mui/material';
import { styled } from '@mui/system';
import { useAuth } from '../providers/AuthProvider';
import Footer from './Footer';

const RootDiv = styled('div')({
  display: 'flex',
  height: '100vh',
  flexDirection: 'column',
  flexGrow: 1,
});

const App = () => {
  const { userFetchError } = useAuth();

  return (
    <RootDiv>
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
    </RootDiv>
  );
};

export default App;
