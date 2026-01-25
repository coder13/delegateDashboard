import { describe, expect, it, vi } from 'vitest';
import { DrawerLinks, Header } from './Header';
import { renderWithProviders } from '../test-utils';
import userEvent from '@testing-library/user-event';

const useAppSelector = vi.fn();

vi.mock('../store', () => ({
  useAppSelector: (...args: unknown[]) => useAppSelector(...args),
}));

describe('Header', () => {
  it('renders the competition name and triggers menu open', async () => {
    useAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector({ wcif: { name: 'Test Competition', id: 'TestComp' } })
    );

    const onMenuOpen = vi.fn();
    const { getByText, getByLabelText } = renderWithProviders(
      <Header open onMenuOpen={onMenuOpen} />
    );

    expect(getByText('Test Competition')).toBeInTheDocument();
    await userEvent.click(getByLabelText('menu'));
    expect(onMenuOpen).toHaveBeenCalled();
  });
});

describe('DrawerLinks', () => {
  it('renders menu links for the current competition', () => {
    useAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector({ wcif: { id: 'TestComp' } })
    );

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
