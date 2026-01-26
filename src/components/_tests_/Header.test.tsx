import { describe, expect, it, vi } from 'vitest';
import { DrawerLinks, CompetitionHeader } from '../../layout/CompetitionLayout/CompetitionHeader';
import { renderWithProviders } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import type { AppState } from '../../store/initialState';

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
  it('renders menu links for the current competition', () => {
    const state = { wcif: { id: 'TestComp' } } as unknown as AppState;
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
});
