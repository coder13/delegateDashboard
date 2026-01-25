import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils';
import { UpcomingCompetitions } from './UpcomingCompetitions';

const getUpcomingManageableCompetitions = vi.fn();

vi.mock('../../lib/api', () => ({
  getUpcomingManageableCompetitions: (...args: unknown[]) =>
    getUpcomingManageableCompetitions(...args),
}));

describe('UpcomingCompetitions', () => {
  it('renders competition links from API', async () => {
    getUpcomingManageableCompetitions.mockResolvedValue([
      {
        id: 'Comp1',
        name: 'Comp One',
        country_iso2: 'US',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
      },
    ]);

    const { findByRole } = renderWithProviders(<UpcomingCompetitions />);

    expect(await findByRole('link', { name: /Comp One/ })).toBeInTheDocument();
  });

  it('renders errors from API', async () => {
    getUpcomingManageableCompetitions.mockRejectedValue(new Error('Network error'));

    const { findByText } = renderWithProviders(<UpcomingCompetitions />);

    expect(await findByText('Network error')).toBeInTheDocument();
  });
});
