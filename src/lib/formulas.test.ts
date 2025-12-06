import { advancingCompetitors } from './formulas';
import { describe, it, expect } from 'vitest';

describe('advancingCompetitors', () => {
  describe('percent advancement', () => {
    it('calculates advancing competitors for percent type', () => {
      expect(advancingCompetitors({ type: 'percent', level: 50 }, 100)).toBe(50);
    });

    it('rounds to nearest integer', () => {
      expect(advancingCompetitors({ type: 'percent', level: 33 }, 100)).toBe(33);
      expect(advancingCompetitors({ type: 'percent', level: 75 }, 100)).toBe(75);
    });

    it('handles small percentages', () => {
      expect(advancingCompetitors({ type: 'percent', level: 10 }, 50)).toBe(5);
    });

    it('handles 100 percent', () => {
      expect(advancingCompetitors({ type: 'percent', level: 100 }, 80)).toBe(80);
    });

    it('handles fractional results', () => {
      expect(advancingCompetitors({ type: 'percent', level: 25 }, 10)).toBe(3); // Rounds 2.5
    });
  });

  describe('ranking advancement', () => {
    it('returns level when count is greater', () => {
      expect(advancingCompetitors({ type: 'ranking', level: 10 }, 100)).toBe(10);
    });

    it('returns count when level is greater (caps at participant count)', () => {
      expect(advancingCompetitors({ type: 'ranking', level: 50 }, 30)).toBe(30);
    });

    it('handles equal count and level', () => {
      expect(advancingCompetitors({ type: 'ranking', level: 25 }, 25)).toBe(25);
    });

    it('handles top 1', () => {
      expect(advancingCompetitors({ type: 'ranking', level: 1 }, 100)).toBe(1);
    });
  });
});
