import React from 'react';
import { Outlet } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/system';
import Header from './Header';
import Footer from './Footer';

const RootDiv = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  flexGrow: 1,
});

const App = () => {
  return (
    <RootDiv>
      <Header />
      <Grid container sx={{ flexGrow: 1 }}>
        <Grid item sx={{ flexGrow: 1 }} direction="column">
          <Outlet />
        </Grid>
      </Grid>
      <Footer/>
    </RootDiv>
  );
}

export default App;