import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import theme from './theme';

interface RenderOptions {
  route?: string;
}

export const renderWithProviders = (ui: ReactElement, options: RenderOptions = {}) => {
  const { route = '/' } = options;

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};
