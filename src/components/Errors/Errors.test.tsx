import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test-utils';
import { Errors } from './Errors';
import userEvent from '@testing-library/user-event';

describe('Errors', () => {
  it('opens the error dialog with details', async () => {
    const errors = [
      {
        type: 'unknown_type',
        key: 'error-1',
        message: 'Something went wrong',
        data: {},
      },
    ];

    const { getByText, getByRole, queryByText } = renderWithProviders(<Errors errors={errors} />);

    expect(getByText('Something went wrong')).toBeInTheDocument();
    await userEvent.click(getByRole('button', { name: 'Details' }));

    expect(getByText('No renderer for this error type.')).toBeInTheDocument();
    await userEvent.click(getByRole('button', { name: 'Close' }));

    expect(queryByText('No renderer for this error type.')).not.toBeInTheDocument();
  });
});
