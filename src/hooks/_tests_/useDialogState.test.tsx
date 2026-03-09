import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { useDialogState } from '../useDialogState';

const DialogTester = ({ initialState = false }: { initialState?: boolean }) => {
  const { open, handleOpen, handleClose, toggle } = useDialogState(initialState);
  return (
    <div>
      <span data-testid="state">{open ? 'open' : 'closed'}</span>
      <button type="button" onClick={handleOpen}>
        Open
      </button>
      <button type="button" onClick={handleClose}>
        Close
      </button>
      <button type="button" onClick={toggle}>
        Toggle
      </button>
    </div>
  );
};

describe('useDialogState', () => {
  it('opens, closes, and toggles dialog state', () => {
    const { getByText, getByTestId } = render(<DialogTester />);

    expect(getByTestId('state').textContent).toBe('closed');

    fireEvent.click(getByText('Open'));
    expect(getByTestId('state').textContent).toBe('open');

    fireEvent.click(getByText('Close'));
    expect(getByTestId('state').textContent).toBe('closed');

    fireEvent.click(getByText('Toggle'));
    expect(getByTestId('state').textContent).toBe('open');
  });

  it('honors initial open state', () => {
    const { getByTestId } = render(<DialogTester initialState />);
    expect(getByTestId('state').textContent).toBe('open');
  });
});
