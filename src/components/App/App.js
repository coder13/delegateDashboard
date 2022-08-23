import React from 'react';
import { Outlet } from 'react-router-dom';
import { styled } from '@mui/system';
import Footer from './Footer';
import Header from './Header';

const RootDiv = styled('div')({
  display: 'flex',
  height: '100vh',
  flexDirection: 'column',
  flexGrow: 1,
});

const App = () => {
  return (
    <RootDiv>
      <Header />
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'auto',
          marginTop: '0.5em',
          marginBottom: '1em',
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}>
        <Outlet />
      </div>
      <Footer />
    </RootDiv>
  );
};

export default App;
