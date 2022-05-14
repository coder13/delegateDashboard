//eslint-disable import/firstq

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ConfirmProvider } from 'material-ui-confirm';
import './assets/index.css';
import App from './components/App/';
import * as serviceWorker from './serviceWorker';
import AuthProvider from './components/providers/AuthProvider';
import store from './store';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3997b0'
    },
    secondary: {
      main: '#ffffff'
    },
  },
});

ReactDOM.render((
  <Provider store={store}>
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  </Provider>
), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
