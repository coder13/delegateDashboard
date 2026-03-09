import {
  activityDuration,
  activitiesOverlap,
  activitiesIntersection,
  byGroupNumber,
} from './activityUtils';
import { type Activity } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

describe('activityDuration', () => {
  it('calculates duration in milliseconds', () => {
    const activity = {
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T11:30:00.000Z',
    };
    expect(activityDuration(activity)).toBe(5400000); // 90 minutes
  });

  it('handles same start and end time', () => {
    const activity = {
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T10:00:00.000Z',
    };
    expect(activityDuration(activity)).toBe(0);
  });
});

describe('activitiesOverlap', () => {
  it('returns true when activities overlap', () => {
    const first: Activity = {
      id: 1,
      name: 'Activity 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T11:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    const second: Activity = {
      id: 2,
      name: 'Activity 2',
      activityCode: '222-r1',
      startTime: '2025-06-01T10:30:00.000Z',
      endTime: '2025-06-01T11:30:00.000Z',
      childActivities: [],
      extensions: [],
    };
    expect(activitiesOverlap(first, second)).toBe(true);
  });

  it('returns false when activities do not overlap', () => {
    const first: Activity = {
      id: 1,
      name: 'Activity 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T11:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    const second: Activity = {
      id: 2,
      name: 'Activity 2',
      activityCode: '222-r1',
      startTime: '2025-06-01T11:00:00.000Z',
      endTime: '2025-06-01T12:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    expect(activitiesOverlap(first, second)).toBe(false);
  });

  it('returns false when activities are adjacent', () => {
    const first: Activity = {
      id: 1,
      name: 'Activity 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T11:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    const second: Activity = {
      id: 2,
      name: 'Activity 2',
      activityCode: '222-r1',
      startTime: '2025-06-01T11:00:00.000Z',
      endTime: '2025-06-01T12:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    expect(activitiesOverlap(first, second)).toBe(false);
  });
});

describe('activitiesIntersection', () => {
  it('returns overlap duration when activities overlap', () => {
    const first: Activity = {
      id: 1,
      name: 'Activity 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T11:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    const second: Activity = {
      id: 2,
      name: 'Activity 2',
      activityCode: '222-r1',
      startTime: '2025-06-01T10:30:00.000Z',
      endTime: '2025-06-01T11:30:00.000Z',
      childActivities: [],
      extensions: [],
    };
    expect(activitiesIntersection(first, second)).toBe(1800000); // 30 minutes
  });

  it('returns 0 when activities do not overlap', () => {
    const first: Activity = {
      id: 1,
      name: 'Activity 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T11:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    const second: Activity = {
      id: 2,
      name: 'Activity 2',
      activityCode: '222-r1',
      startTime: '2025-06-01T11:00:00.000Z',
      endTime: '2025-06-01T12:00:00.000Z',
      childActivities: [],
      extensions: [],
    };
    expect(activitiesIntersection(first, second)).toBe(0);
  });
});

describe('byGroupNumber', () => {
  it('sorts groups by group number', () => {
    const groups: Activity[] = [
      {
        id: 3,
        name: 'Group 3',
        activityCode: '333-r1-g3',
        startTime: '',
        endTime: '',
        childActivities: [],
        extensions: [],
      },
      {
        id: 1,
        name: 'Group 1',
        activityCode: '333-r1-g1',
        startTime: '',
        endTime: '',
        childActivities: [],
        extensions: [],
      },
      {
        id: 2,
        name: 'Group 2',
        activityCode: '333-r1-g2',
        startTime: '',
        endTime: '',
        childActivities: [],
        extensions: [],
      },
    ];
    groups.sort(byGroupNumber);
    expect(groups.map((g) => g.id)).toEqual([1, 2, 3]);
  });
});
