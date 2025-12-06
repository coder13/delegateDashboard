import App from './App';
import './assets/index.css';
import QueryParamPreservingRouter from './components/QueryParamPreservingRouter';
import AuthProvider from './providers/AuthProvider';
import CommandPromptProvider from './providers/CommandPromptProvider';
import reportWebVitals from './reportWebVitals';
import { store } from './store';
import theme from './theme';
import '@cubing/icons';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ConfirmProvider } from 'material-ui-confirm';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
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
  </Provider>
);

// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
reportWebVitals(undefined); // TODO: understand
