import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import RootLayout from '../RootLayout';
import { Route, Routes } from 'react-router-dom';

const useAuthMock = vi.fn();

vi.mock('../../../providers/AuthProvider', () => ({
  useAuth: () => useAuthMock(),
}));

const renderLayout = () =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<div>Home Content</div>} />
      </Route>
    </Routes>,
    { route: '/' }
  );

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ userFetchError: undefined });
  });

  it('renders outlet content and footer', () => {
    const { getByText } = renderLayout();

    expect(getByText('Home Content')).toBeInTheDocument();
    expect(getByText('GitHub')).toBeInTheDocument();
  });

  it('renders error alert when user fetch fails', () => {
    useAuthMock.mockReturnValue({ userFetchError: new Error('Failed to load user') });

    const { getByText } = renderLayout();

    expect(getByText('Error when fetching user')).toBeInTheDocument();
    expect(getByText('Failed to load user')).toBeInTheDocument();
  });
});
