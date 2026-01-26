import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import usePageTracking from './usePageTracking';
import { useAuth } from '../providers/AuthProvider';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga';

vi.mock('react-ga', () => ({
  default: {
    initialize: vi.fn(),
    pageview: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);
const useLocationMock = vi.mocked(useLocation);
const reactGaMock = ReactGA as unknown as {
  initialize: ReturnType<typeof vi.fn>;
  pageview: ReturnType<typeof vi.fn>;
};

const TrackingTester = ({ code }: { code: string }) => {
  usePageTracking(code);
  return null;
};

describe('usePageTracking', () => {
  it('initializes analytics and tracks page views', async () => {
    useAuthMock.mockReturnValue({ user: { id: 42, name: 'Test User' } } as any);
    let location = { pathname: '/home', search: '?q=1' };
    useLocationMock.mockImplementation(() => location as any);

    const { rerender } = render(<TrackingTester code="UA-TEST" />);

    expect(reactGaMock.initialize).toHaveBeenCalledWith(
      'UA-TEST',
      expect.objectContaining({
        gaOptions: expect.objectContaining({
          name: 'Test User',
          userId: '42',
        }),
      })
    );

    await waitFor(() => {
      expect(reactGaMock.pageview).toHaveBeenCalledWith('/home?q=1');
    });

    location = { pathname: '/next', search: '' };
    rerender(<TrackingTester code="UA-TEST" />);

    await waitFor(() => {
      expect(reactGaMock.pageview).toHaveBeenCalledWith('/next');
    });
  });
});
