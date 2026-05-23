import { describe, expect, it, vi } from 'vitest';
import RoundSelector from '../index';
import { renderWithProviders } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import type { AppState } from '../../../store/initialState';

const useAppSelector = vi.fn();

vi.mock('../../../store', () => ({
  useAppSelector: (...args: unknown[]) => useAppSelector(...args),
}));

vi.mock('../../../providers/CommandPromptProvider', () => ({
  useCommandPrompt: () => ({ open: false, setOpen: vi.fn() }),
}));

vi.mock('../../../lib/domain/activities', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/domain/activities')>(
    '../../../lib/domain/activities'
  );

  return {
    ...actual,
    earliestStartTimeForRound: vi.fn(() => new Date('2020-01-01T00:00:00Z')),
  };
});

vi.mock('../RoundListItem', () => ({
  default: ({
    activityCode,
    selected,
    nestingLevel,
  }: {
    activityCode: string;
    selected: boolean;
    nestingLevel?: number;
  }) => (
    <div
      data-testid="round-item"
      data-selected={selected}
      data-code={activityCode}
      data-nesting={nestingLevel ?? 0}
    />
  ),
}));

describe('RoundSelector', () => {
  it('renders rounds and handles keyboard selection', async () => {
    const wcif = {
      id: 'TestComp',
      events: [
        {
          id: '333',
          rounds: [
            { id: '333-r1', format: 'a', results: [], timeLimit: null, cutoff: null },
            { id: '333-r2', format: 'a', results: [], timeLimit: null, cutoff: null },
          ],
        },
      ],
    };

    const state = { wcif } as unknown as AppState;
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const onSelected = vi.fn();
    const { getAllByTestId } = renderWithProviders(
      <RoundSelector competitionId="TestComp" onSelected={onSelected} />
    );

    expect(getAllByTestId('round-item')).toHaveLength(2);

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    expect(onSelected).toHaveBeenCalled();
  });

  it('toggles show all rounds with the switch', async () => {
    const wcif = {
      id: 'TestComp',
      events: [
        {
          id: '333',
          rounds: [{ id: '333-r1', format: 'a', results: [], timeLimit: null, cutoff: null }],
        },
      ],
    };

    const state = { wcif } as unknown as AppState;
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const { getByRole } = renderWithProviders(
      <RoundSelector competitionId="TestComp" onSelected={() => undefined} />
    );

    const toggle = getByRole('switch', { name: 'Show All Rounds' });
    await userEvent.click(toggle);

    expect(toggle).toBeChecked();
  });

  it('renders round-level entry plus attempts for distributed-attempt events', () => {
    const wcif = {
      id: 'TestComp',
      events: [
        {
          id: '333fm',
          rounds: [{ id: '333fm-r1', format: '3', results: [], timeLimit: null, cutoff: null }],
        },
      ],
    };

    const state = { wcif } as unknown as AppState;
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const { getAllByTestId } = renderWithProviders(
      <RoundSelector competitionId="TestComp" onSelected={() => undefined} />
    );

    const activityCodes = getAllByTestId('round-item').map((item) => item.getAttribute('data-code'));
    const nestingLevels = getAllByTestId('round-item').map((item) =>
      item.getAttribute('data-nesting')
    );

    expect(activityCodes).toEqual(['333fm-r1', '333fm-r1-a1', '333fm-r1-a2', '333fm-r1-a3']);
    expect(nestingLevels).toEqual(['0', '1', '1', '1']);
  });
});
