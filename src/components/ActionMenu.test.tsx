import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test-utils';
import ActionMenu from './ActionMenu';
import userEvent from '@testing-library/user-event';

describe('ActionMenu', () => {
  it('opens menu and triggers action', async () => {
    const onClick = vi.fn();
    const { getByLabelText, findByRole, queryByRole } = renderWithProviders(
      <ActionMenu items={[{ label: 'Edit', onClick }]} />
    );

    await userEvent.click(getByLabelText('Action Menu'));
    const menuItem = await findByRole('menuitem', { name: 'Edit' });
    await userEvent.click(menuItem);

    expect(onClick).toHaveBeenCalled();
    expect(queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
