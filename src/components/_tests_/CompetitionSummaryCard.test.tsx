import { describe, expect, it, vi } from 'vitest';
import CompetitionSummaryCard from '../CompetitionSummaryCard';
import { renderWithProviders } from '../../test-utils';
import type { AppState } from '../../store/initialState';

const useAppSelector = vi.fn();

vi.mock('../../store', () => ({
  useAppSelector: (...args: unknown[]) => useAppSelector(...args),
}));

describe('CompetitionSummaryCard', () => {
  it('renders competition summary details', () => {
    const wcif = {
      id: 'Comp',
      name: 'Summary Competition',
      schedule: { startDate: '2024-01-01', numberOfDays: 1, venues: [] },
      events: [{ id: '333' }, { id: '222' }],
      persons: [{ registration: { status: 'accepted' } }, { registration: { status: 'pending' } }],
    };

    const state = { wcif } as unknown as AppState;
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const { getByText } = renderWithProviders(<CompetitionSummaryCard />);

    expect(getByText('Summary Competition')).toBeInTheDocument();
    expect(getByText('Competitors:').parentElement).toHaveTextContent('Competitors: 1');
    expect(getByText('Events:').parentElement).toHaveTextContent('Events: 3x3, 2x2 (2)');
  });
});
