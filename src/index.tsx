import '@cubing/icons';
import { ConfirmProvider } from 'material-ui-confirm';
import { SnackbarProvider } from 'notistack';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import './assets/index.css';
import QueryParamPreservingRouter from './components/QueryParamPreservingRouter';
import AuthProvider from './providers/AuthProvider';
import CommandPromptProvider from './providers/CommandPromptProvider';
import reportWebVitals from './reportWebVitals';
import { store } from './store';
import theme from './theme';

ReactDOM.render(
  <Provider store={store}>
    <QueryParamPreservingRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ConfirmProvider>
            <SnackbarProvider maxSnack={3} autoHideDuration={1000}>
              <CommandPromptProvider>
                <App />
              </CommandPromptProvider>
            </SnackbarProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryParamPreservingRouter>
  </Provider>,
  document.getElementById('root')
);

// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
reportWebVitals(undefined); // TODO: understand
