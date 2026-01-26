import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import useDebounce from './useDebounce';

const DebounceTester = ({ value, delay }: { value: string; delay: number }) => {
  const debounced = useDebounce(value, delay);
  return <div data-testid="value">{debounced}</div>;
};

describe('useDebounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates the debounced value after the delay', () => {
    vi.useFakeTimers();
    const { getByTestId, rerender } = render(<DebounceTester value="start" delay={200} />);

    expect(getByTestId('value').textContent).toBe('start');

    rerender(<DebounceTester value="next" delay={200} />);
    expect(getByTestId('value').textContent).toBe('start');

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(getByTestId('value').textContent).toBe('start');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getByTestId('value').textContent).toBe('next');
  });

  it('cancels pending updates when the value changes quickly', () => {
    vi.useFakeTimers();
    const { getByTestId, rerender } = render(<DebounceTester value="one" delay={200} />);

    rerender(<DebounceTester value="two" delay={200} />);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender(<DebounceTester value="three" delay={200} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(getByTestId('value').textContent).toBe('three');
  });
});
