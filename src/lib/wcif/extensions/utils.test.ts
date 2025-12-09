import { getGroupData } from './utils';
import { type Activity } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

const createActivity = (extensions: Activity['extensions']): Activity =>
  ({
    id: 1,
    name: 'Test Activity',
    activityCode: '333-r1',
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T11:00:00Z',
    childActivities: [],
    extensions,
  } as Activity);

describe('extension utils', () => {
  describe('getGroupData', () => {
    it('returns null when no extension found', () => {
      const activity = createActivity([]);
      expect(getGroupData(activity)).toBeNull();
    });

    it('gets group data from Delegate Dashboard extension', () => {
      const activity = createActivity([
        {
          id: 'delegateDashboard.groups',
          specUrl: 'url',
          data: { groups: 5 },
        },
      ]);

      const result = getGroupData(activity);
      expect(result).toEqual({
        groups: 5,
        source: 'Delegate Dashboard',
      });
    });

    it('gets group data from Groupifier extension', () => {
      const activity = createActivity([
        {
          id: 'groupifier.ActivityConfig',
          specUrl: 'url',
          data: { groups: 4 },
        },
      ]);

      const result = getGroupData(activity);
      expect(result).toEqual({
        groups: 4,
        source: 'Groupifier',
      });
    });

    it('prioritizes Delegate Dashboard over Groupifier', () => {
      const activity = createActivity([
        {
          id: 'delegateDashboard.groups',
          specUrl: 'url',
          data: { groups: 6 },
        },
        {
          id: 'groupifier.ActivityConfig',
          specUrl: 'url',
          data: { groups: 3 },
        },
      ]);

      const result = getGroupData(activity);
      expect(result).toEqual({
        groups: 6,
        source: 'Delegate Dashboard',
      });
    });

    it('handles per-stage group configuration', () => {
      const activity = createActivity([
        {
          id: 'delegateDashboard.groups',
          specUrl: 'url',
          data: { groups: { 1: 2, 2: 3 } },
        },
      ]);

      const result = getGroupData(activity);
      expect(result).toEqual({
        groups: 5, // Sum of all groups
        source: 'Delegate Dashboard',
      });
    });

    it('defaults to 1 when Groupifier groups is missing', () => {
      const activity = createActivity([
        {
          id: 'groupifier.ActivityConfig',
          specUrl: 'url',
          data: {},
        },
      ]);

      const result = getGroupData(activity);
      expect(result).toEqual({
        groups: 1,
        source: 'Groupifier',
      });
    });
  });
});
