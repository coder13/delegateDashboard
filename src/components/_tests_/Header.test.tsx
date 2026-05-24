import { describe, expect, it, vi } from 'vitest';
import { DrawerLinks, CompetitionHeader } from '../../layout/CompetitionLayout/CompetitionHeader';
import { renderWithProviders } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import type { AppState } from '../../store/initialState';
import { buildEvent, buildRound } from '../../store/reducers/_tests_/helpers';

const useAppSelector = vi.fn();

vi.mock('../../store', () => ({
  useAppSelector: (...args: unknown[]) => useAppSelector(...args),
}));

describe('Header', () => {
  it('renders the competition name and triggers menu open', async () => {
    const state = { wcif: { name: 'Test Competition', id: 'TestComp' } } as unknown as AppState;
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const onMenuOpen = vi.fn();
    const { getByText, getByLabelText } = renderWithProviders(
      <CompetitionHeader open onMenuOpen={onMenuOpen} />
    );

    expect(getByText('Test Competition')).toBeInTheDocument();
    await userEvent.click(getByLabelText('menu'));
    expect(onMenuOpen).toHaveBeenCalled();
  });
});

describe('DrawerLinks', () => {
  const state = {
    wcif: {
      id: 'TestComp',
      events: [
        buildEvent({
          id: '333',
          rounds: [buildRound({ id: '333-r1' }), buildRound({ id: '333-r2' })],
        }),
        buildEvent({
          id: '222',
          rounds: [buildRound({ id: '222-r1' })],
        }),
      ],
    },
  } as unknown as AppState;

  it('renders menu links for the current competition', () => {
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const { getByText, getByRole } = renderWithProviders(<DrawerLinks />);

    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('Configure Staff')).toBeInTheDocument();
    expect(getByText('Import Data')).toBeInTheDocument();
    expect(getByRole('link', { name: 'Assignments' })).toHaveAttribute(
      'href',
      '/competitions/TestComp/assignments'
    );
  });

  it('renders event accordions with round links', async () => {
    useAppSelector.mockImplementation((selector: (state: AppState) => unknown) => selector(state));

    const { getByRole, getAllByRole } = renderWithProviders(<DrawerLinks />);

    expect(getByRole('button', { name: /3x3x3 Cube/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(getByRole('button', { name: /2x2x2 Cube/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    await userEvent.click(getByRole('button', { name: /2x2x2 Cube/ }));

    expect(getByRole('button', { name: /2x2x2 Cube/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(
      getAllByRole('link', { name: 'Round 1' }).some(
        (link) => link.getAttribute('href') === '/competitions/TestComp/events/222-r1'
      )
    ).toBe(true);
  });
});
