import { describe, expect, it } from 'vitest';
import { parseCompetitorAssignment } from './import2';

describe('parseCompetitorAssignment', () => {
  it('returns undefined for blank values', () => {
    expect(parseCompetitorAssignment('-')).toBeUndefined();
  });

  it('parses assignments with explicit stage', () => {
    expect(parseCompetitorAssignment('A2')).toEqual({ groupNumber: 2, stage: 'A' });
    expect(parseCompetitorAssignment('B 3')).toEqual({ groupNumber: 3, stage: 'B' });
  });

  it('parses assignments without a stage', () => {
    expect(parseCompetitorAssignment('4')).toEqual({ groupNumber: 4, stage: null });
  });

  it('falls back to numeric parsing when regex does not match', () => {
    expect(parseCompetitorAssignment('7 ')).toEqual({ groupNumber: 7, stage: null });
  });
});
