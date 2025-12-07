import { describe, expect, it, vi } from 'vitest';
import {
  getGroupifierActivityConfig,
  isGroupifierActivityConfig,
  setGroupifierActivityConfig,
} from './groupifier';

describe('groupifier helpers', () => {
  it('validates activity configuration shapes', () => {
    expect(isGroupifierActivityConfig(undefined)).toBe(false);
    expect(isGroupifierActivityConfig({ groups: 'two' })).toBe(false);
    expect(isGroupifierActivityConfig({ featuredCompetitorWcaUserIds: ['1'] })).toBe(false);
    expect(isGroupifierActivityConfig({ groups: 2, featuredCompetitorWcaUserIds: [1, 2] })).toBe(true);
  });

  it('reads the activity config when valid', () => {
    const wcifEntity = {
      extensions: [
        { id: 'groupifier.ActivityConfig', data: { groups: 3 }, specUrl: 'url' },
        { id: 'other', data: {}, specUrl: 'other' },
      ],
    };

    expect(getGroupifierActivityConfig(wcifEntity)).toEqual({ groups: 3 });
  });

  it('returns undefined for invalid extension data', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wcifEntity = {
      extensions: [{ id: 'groupifier.ActivityConfig', data: { groups: 'a' }, specUrl: 'url' }],
    };

    expect(getGroupifierActivityConfig(wcifEntity)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('sets or replaces the activity config while preserving other extensions', () => {
    const wcifEntity = {
      extensions: [
        { id: 'groupifier.ActivityConfig', data: { groups: 1 }, specUrl: 'url' },
        { id: 'other', data: {}, specUrl: 'other' },
      ],
    };

    const updated = setGroupifierActivityConfig(wcifEntity, { featuredCompetitorWcaUserIds: [5] });
    expect(updated.extensions).toHaveLength(2);
    expect(updated.extensions.find((e) => e.id === 'groupifier.ActivityConfig')?.data).toEqual({
      featuredCompetitorWcaUserIds: [5],
    });
    expect(updated.extensions.find((e) => e.id === 'other')).toBeDefined();
  });
});
