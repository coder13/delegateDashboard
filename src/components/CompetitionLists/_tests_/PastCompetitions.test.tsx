import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import { PastCompetitions } from '../PastCompetitions';

const getPastManageableCompetitions = vi.fn();

vi.mock('../../../lib/api', () => ({
  getPastManageableCompetitions: (...args: unknown[]) => getPastManageableCompetitions(...args),
}));

describe('PastCompetitions', () => {
  it('renders competition links from API', async () => {
    getPastManageableCompetitions.mockResolvedValue([
      {
        id: 'Comp2',
        name: 'Comp Two',
        country_iso2: 'US',
        start_date: '2024-02-01',
        end_date: '2024-02-03',
      },
    ]);

    const { findByRole } = renderWithProviders(<PastCompetitions />);

    expect(await findByRole('link', { name: /Comp Two/ })).toBeInTheDocument();
  });

  it('renders errors from API', async () => {
    getPastManageableCompetitions.mockRejectedValue(new Error('Server error'));

    const { findByText } = renderWithProviders(<PastCompetitions />);

    expect(await findByText('Server error')).toBeInTheDocument();
  });
});
