import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { useMenuState } from './useMenuState';

const MenuTester = () => {
  const { anchorEl, open, handleOpen, handleClose } = useMenuState();
  return (
    <div>
      <span data-testid="open">{open ? 'open' : 'closed'}</span>
      <span data-testid="anchor">{anchorEl?.textContent ?? 'none'}</span>
      <button type="button" onClick={handleOpen}>
        Open menu
      </button>
      <button type="button" onClick={handleClose}>
        Close menu
      </button>
    </div>
  );
};

describe('useMenuState', () => {
  it('opens and closes the menu based on the anchor element', () => {
    const { getByText, getByTestId } = render(<MenuTester />);

    expect(getByTestId('open').textContent).toBe('closed');
    expect(getByTestId('anchor').textContent).toBe('none');

    fireEvent.click(getByText('Open menu'));
    expect(getByTestId('open').textContent).toBe('open');
    expect(getByTestId('anchor').textContent).toBe('Open menu');

    fireEvent.click(getByText('Close menu'));
    expect(getByTestId('open').textContent).toBe('closed');
    expect(getByTestId('anchor').textContent).toBe('none');
  });
});
