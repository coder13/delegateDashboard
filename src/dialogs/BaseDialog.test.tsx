import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test-utils';
import { BaseDialog } from './BaseDialog';
import userEvent from '@testing-library/user-event';

describe('BaseDialog', () => {
  it('renders title, content, and default close action', async () => {
    const onClose = vi.fn();
    const { getByText, getByRole } = renderWithProviders(
      <BaseDialog open onClose={onClose} title="Dialog Title">
        <div>Dialog Content</div>
      </BaseDialog>
    );

    expect(getByText('Dialog Title')).toBeInTheDocument();
    expect(getByText('Dialog Content')).toBeInTheDocument();

    await userEvent.click(getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders custom actions when provided', () => {
    const { getByRole, queryByRole } = renderWithProviders(
      <BaseDialog
        open
        onClose={() => undefined}
        title="Dialog Title"
        actions={<button type="button">Custom Action</button>}>
        <div>Dialog Content</div>
      </BaseDialog>
    );

    expect(getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
    expect(queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});
