import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatDateTimeRange,
  formatTime,
  formatTimeRange,
} from './time';
import { afterEach, describe, expect, it, vi } from 'vitest';

declare const navigator: Navigator;

const setNavigatorLanguages = (languages: string[]) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { ...navigator, languages },
    configurable: true,
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('time formatting helpers', () => {
  const iso = '2024-01-01T10:00:00Z';

  it('formats time using navigator languages and options', () => {
    setNavigatorLanguages(['en-US']);
    const spy = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    spy.mockReturnValue('10:00 AM');

    expect(formatTime(iso)).toBe('10:00 AM');
    expect(spy).toHaveBeenCalledWith(
      ['en-US'],
      expect.objectContaining({ hour: '2-digit', minute: '2-digit' })
    );
  });

  it('formats date using navigator languages', () => {
    setNavigatorLanguages(['en-GB']);
    const spy = vi.spyOn(Date.prototype, 'toLocaleDateString');
    spy.mockReturnValue('01/01/2024');

    expect(formatDate(iso)).toBe('01/01/2024');
    expect(spy).toHaveBeenCalledWith(['en-GB']);
  });

  it('formats date time with combined options', () => {
    setNavigatorLanguages(['en-US']);
    const spy = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    spy.mockReturnValue('Jan 1, 2024, 10:00 AM');

    expect(formatDateTime(iso)).toBe('Jan 1, 2024, 10:00 AM');
    expect(spy).toHaveBeenCalledWith(
      ['en-US'],
      expect.objectContaining({
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  });

  it('formats a time range using formatted outputs', () => {
    setNavigatorLanguages(['en-US']);
    const spy = vi.spyOn(Date.prototype, 'toLocaleTimeString');
    spy.mockImplementationOnce(() => '10:00 AM').mockImplementationOnce(() => '11:00 AM');

    expect(formatTimeRange('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z')).toBe(
      '10:00 AM - 11:00 AM'
    );
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('formats a date time range on the same day', () => {
    setNavigatorLanguages(['en-US']);
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Jan 1, 2024');
    vi.spyOn(Date.prototype, 'toLocaleTimeString')
      .mockImplementationOnce(() => '10:00 AM')
      .mockImplementationOnce(() => '11:00 AM');

    expect(formatDateTimeRange('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z')).toBe(
      'Jan 1, 2024 10:00 AM - 11:00 AM'
    );
  });

  it('formats a date time range across days', () => {
    setNavigatorLanguages(['en-US']);
    vi.spyOn(Date.prototype, 'toLocaleTimeString')
      .mockImplementationOnce(() => '10:00 AM')
      .mockImplementationOnce(() => '11:00 AM');

    expect(formatDateTimeRange('2024-01-01T10:00:00Z', '2024-01-02T11:00:00Z')).toBe(
      '10:00 AM - 11:00 AM'
    );
  });

  it('formats date ranges with shared month and year', () => {
    expect(formatDateRange('2024-02-01', '2024-02-03')).toBe('Feb 1 - 3, 2024');
  });

  it('formats date ranges with shared year but different months', () => {
    expect(formatDateRange('2024-02-01', '2024-03-01')).toBe('Feb 1 - Mar 1, 2024');
  });

  it('formats date ranges across years', () => {
    expect(formatDateRange('2024-12-31', '2025-01-01')).toBe('Dec 31, 2024 - Jan 1, 2025');
  });

  it('formats identical start and end dates', () => {
    expect(formatDateRange('2024-02-01', '2024-02-01')).toBe('Feb 1, 2024');
  });
});
