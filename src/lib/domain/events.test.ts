import { eventNameById, shortEventNameById, roundFormatById, sortWcifEvents } from './events';
import { type Event } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

describe('eventNameById', () => {
  it('returns correct name for standard events', () => {
    expect(eventNameById('333')).toBe('3x3x3 Cube');
    expect(eventNameById('222')).toBe('2x2x2 Cube');
    expect(eventNameById('444')).toBe('4x4x4 Cube');
  });

  it('returns correct name for blindfolded events', () => {
    expect(eventNameById('333bf')).toBe('3x3x3 Blindfolded');
    expect(eventNameById('444bf')).toBe('4x4x4 Blindfolded');
    expect(eventNameById('555bf')).toBe('5x5x5 Blindfolded');
  });

  it('returns correct name for other events', () => {
    expect(eventNameById('333oh')).toBe('3x3x3 One-Handed');
    expect(eventNameById('333fm')).toBe('3x3x3 Fewest Moves');
    expect(eventNameById('minx')).toBe('Megaminx');
    expect(eventNameById('pyram')).toBe('Pyraminx');
  });

  it('throws for unknown event ID', () => {
    expect(() => eventNameById('invalid' as any)).toThrow('Event not found: invalid');
  });
});

describe('shortEventNameById', () => {
  it('returns correct short name for standard events', () => {
    expect(shortEventNameById('333')).toBe('3x3');
    expect(shortEventNameById('222')).toBe('2x2');
    expect(shortEventNameById('444')).toBe('4x4');
  });

  it('returns correct short name for special events', () => {
    expect(shortEventNameById('333bf')).toBe('3BLD');
    expect(shortEventNameById('333fm')).toBe('FMC');
    expect(shortEventNameById('333oh')).toBe('3OH');
    expect(shortEventNameById('333mbf')).toBe('MBLD');
  });

  it('throws for unknown event ID', () => {
    expect(() => shortEventNameById('unknown' as any)).toThrow('Event not found: unknown');
  });
});

describe('roundFormatById', () => {
  it('returns correct format for average of 5', () => {
    const format = roundFormatById('a');
    expect(format).toEqual({
      id: 'a',
      short: 'ao5',
      long: 'Average of 5',
      rankingResult: 'average',
    });
  });

  it('returns correct format for best of 3', () => {
    const format = roundFormatById('3');
    expect(format).toEqual({
      id: '3',
      short: 'bo3',
      long: 'Best of 3',
      rankingResult: 'single',
    });
  });

  it('returns correct format for best of 1', () => {
    const format = roundFormatById('1');
    expect(format).toEqual({
      id: '1',
      short: 'bo1',
      long: 'Best of 1',
      rankingResult: 'single',
    });
  });

  it('returns correct format for mean of 3', () => {
    const format = roundFormatById('m');
    expect(format).toEqual({
      id: 'm',
      short: 'mo3',
      long: 'Mean of 5',
      rankingResult: 'average',
    });
  });

  it('returns undefined for unknown format', () => {
    expect(roundFormatById('z')).toBeUndefined();
  });

  it('returns undefined when undefined is passed', () => {
    expect(roundFormatById(undefined)).toBeUndefined();
  });
});

describe('sortWcifEvents', () => {
  it('sorts events in canonical order', () => {
    const wcifEvents: Event[] = [
      { id: 'minx', rounds: [], extensions: [] },
      { id: '333', rounds: [], extensions: [] },
      { id: '222', rounds: [], extensions: [] },
      { id: '444', rounds: [], extensions: [] },
    ];

    const sorted = sortWcifEvents(wcifEvents);
    expect(sorted.map((e) => e.id)).toEqual(['333', '222', '444', 'minx']);
  });

  it('maintains order for events not in the standard list', () => {
    const wcifEvents: Event[] = [
      { id: 'pyram', rounds: [], extensions: [] },
      { id: 'clock', rounds: [], extensions: [] },
      { id: 'skewb', rounds: [], extensions: [] },
    ];

    const sorted = sortWcifEvents(wcifEvents);
    expect(sorted.map((e) => e.id)).toEqual(['pyram', 'clock', 'skewb']);
  });

  it('handles empty array', () => {
    expect(sortWcifEvents([])).toEqual([]);
  });
});
