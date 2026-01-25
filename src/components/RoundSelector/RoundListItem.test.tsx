import { describe, expect, it, vi } from 'vitest';
import RoundListItem from './RoundListItem';
import { renderWithProviders } from '../../test-utils';
import type { Round } from '@wca/helpers';

const useAppSelector = vi.fn();
const selectPersonsShouldBeInRound = vi.fn();
const selectPersonsAssignedForRound = vi.fn();
const selectPersonsHavingCompetitorAssignmentsForRound = vi.fn();

vi.mock('../../store', () => ({
  useAppSelector: (...args: unknown[]) => useAppSelector(...args),
}));

vi.mock('../../store/selectors', () => ({
  selectPersonsShouldBeInRound: (...args: unknown[]) => selectPersonsShouldBeInRound(...args),
  selectPersonsAssignedForRound: (...args: unknown[]) => selectPersonsAssignedForRound(...args),
  selectPersonsHavingCompetitorAssignmentsForRound: (...args: unknown[]) =>
    selectPersonsHavingCompetitorAssignmentsForRound(...args),
}));

vi.mock('../../lib/domain/activities', async () => {
  const actual = await vi.importActual<typeof import('../../lib/domain/activities')>(
    '../../lib/domain/activities'
  );
  return {
    ...actual,
    cumulativeGroupCount: vi.fn(() => 3),
    findGroupActivitiesByRound: vi.fn(() => [{ id: 1 }, { id: 2 }]),
  };
});

describe('RoundListItem', () => {
  it('renders group and assignment summaries', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      results: [],
      scrambleSetCount: 1,
      extensions: [],
    };

    selectPersonsShouldBeInRound.mockReturnValue(() => [{}, {}, {}]);
    selectPersonsAssignedForRound.mockReturnValue([{ id: 1 }]);
    selectPersonsHavingCompetitorAssignmentsForRound.mockReturnValue([{}, {}]);

    useAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector({ wcif: { id: 'TestComp' } })
    );

    const { getByText } = renderWithProviders(
      <RoundListItem activityCode="333-r1" round={round} selected={false} in />
    );

    expect(getByText(/2 groups generated/)).toBeInTheDocument();
    expect(getByText(/1 person assigned of 3/)).toBeInTheDocument();
    expect(getByText(/2 people competitors assigned of 3/)).toBeInTheDocument();
  });
});
