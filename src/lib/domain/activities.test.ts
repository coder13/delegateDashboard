import {
  parseActivityCode,
  createActivityCode,
  activityCodeToName,
  activityCodeIsChild,
  hasDistributedAttempts,
  activityDuration,
  activitiesOverlap,
  activitiesIntersection,
  byGroupNumber,
  createGroupActivity,
} from './activities';
import { Activity } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

describe('parseActivityCode', () => {
  it('parses a simple event code', () => {
    expect(parseActivityCode('333')).toEqual({
      eventId: '333',
      roundNumber: undefined,
      groupNumber: undefined,
      attemptNumber: undefined,
    });
  });

  it('parses event with round', () => {
    expect(parseActivityCode('333-r1')).toEqual({
      eventId: '333',
      roundNumber: 1,
      groupNumber: undefined,
      attemptNumber: undefined,
    });
  });

  it('parses event with round and group', () => {
    expect(parseActivityCode('333-r1-g2')).toEqual({
      eventId: '333',
      roundNumber: 1,
      groupNumber: 2,
      attemptNumber: undefined,
    });
  });

  it('parses full activity code with attempt', () => {
    expect(parseActivityCode('333-r2-g3-a1')).toEqual({
      eventId: '333',
      roundNumber: 2,
      groupNumber: 3,
      attemptNumber: 1,
    });
  });

  it('parses different event IDs', () => {
    expect(parseActivityCode('444bf-r1')).toEqual({
      eventId: '444bf',
      roundNumber: 1,
      groupNumber: undefined,
      attemptNumber: undefined,
    });
  });

  it('caches parsed results', () => {
    const first = parseActivityCode('333-r1-g2');
    const second = parseActivityCode('333-r1-g2');
    expect(first).toBe(second); // Same object reference
  });
});

describe('createActivityCode', () => {
  it('creates event-only code', () => {
    expect(createActivityCode({ eventId: '333' })).toBe('333');
  });

  it('creates code with round', () => {
    expect(createActivityCode({ eventId: '333', roundNumber: 1 })).toBe('333-r1');
  });

  it('creates code with round and group', () => {
    expect(createActivityCode({ eventId: '333', roundNumber: 1, groupNumber: 2 })).toBe(
      '333-r1-g2'
    );
  });

  it('creates full code with attempt', () => {
    expect(
      createActivityCode({ eventId: '333', roundNumber: 2, groupNumber: 3, attemptNumber: 1 })
    ).toBe('333-r2-g3-a1');
  });

  it('round-trips with parseActivityCode', () => {
    const original = '333-r1-g2';
    const parsed = parseActivityCode(original);
    const recreated = createActivityCode(parsed);
    expect(recreated).toBe(original);
  });
});

describe('activityCodeToName', () => {
  it('converts simple event code to name', () => {
    expect(activityCodeToName('333')).toBe('3x3x3 Cube');
  });

  it('converts code with round', () => {
    expect(activityCodeToName('333-r1')).toBe('3x3x3 Cube, Round 1');
  });

  it('converts code with round and group', () => {
    expect(activityCodeToName('333-r2-g3')).toBe('3x3x3 Cube, Round 2, Group 3');
  });

  it('converts full code with attempt', () => {
    expect(activityCodeToName('333fm-r1-g1-a1')).toBe(
      '3x3x3 Fewest Moves, Round 1, Group 1, Attempt 1'
    );
  });

  it('handles different event types', () => {
    expect(activityCodeToName('444bf-r1')).toBe('4x4x4 Blindfolded, Round 1');
  });
});

describe('activityCodeIsChild', () => {
  it('returns true for exact match', () => {
    expect(activityCodeIsChild('333-r1', '333-r1')).toBe(true);
  });

  it('returns true when child has more specificity', () => {
    expect(activityCodeIsChild('333-r1', '333-r1-g2')).toBe(true);
    expect(activityCodeIsChild('333', '333-r1')).toBe(true);
    expect(activityCodeIsChild('333', '333-r1-g2')).toBe(true);
  });

  it('returns false for different events', () => {
    expect(activityCodeIsChild('333-r1', '222-r1')).toBe(false);
  });

  it('returns false when parent has more specificity', () => {
    expect(activityCodeIsChild('333-r1-g2', '333-r1')).toBe(false);
  });

  it('returns false for different rounds', () => {
    expect(activityCodeIsChild('333-r1', '333-r2')).toBe(false);
  });

  it('returns false for different groups', () => {
    expect(activityCodeIsChild('333-r1-g1', '333-r1-g2')).toBe(false);
  });
});

describe('hasDistributedAttempts', () => {
  it('returns true for 333fm', () => {
    expect(hasDistributedAttempts('333fm-r1')).toBe(true);
  });

  it('returns true for 333mbf', () => {
    expect(hasDistributedAttempts('333mbf-r1')).toBe(true);
  });

  it('returns false for regular events', () => {
    expect(hasDistributedAttempts('333-r1')).toBe(false);
    expect(hasDistributedAttempts('222-r1')).toBe(false);
  });
});

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

describe('createGroupActivity', () => {
  it('creates a group activity from round activity', () => {
    const roundActivity: Activity = {
      id: 100,
      name: '3x3x3 Cube, Round 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T12:00:00.000Z',
      childActivities: [],
      extensions: [],
    };

    const groupActivity = createGroupActivity(
      200,
      roundActivity,
      2,
      '2025-06-01T10:30:00.000Z',
      '2025-06-01T11:00:00.000Z'
    );

    expect(groupActivity).toEqual({
      id: 200,
      name: '3x3x3 Cube, Round 1, Group 2',
      activityCode: '333-r1-g2',
      startTime: '2025-06-01T10:30:00.000Z',
      endTime: '2025-06-01T11:00:00.000Z',
      childActivities: [],
      extensions: [],
    });
  });

  it('uses round start/end time when not provided', () => {
    const roundActivity: Activity = {
      id: 100,
      name: '3x3x3 Cube, Round 1',
      activityCode: '333-r1',
      startTime: '2025-06-01T10:00:00.000Z',
      endTime: '2025-06-01T12:00:00.000Z',
      childActivities: [],
      extensions: [],
    };

    const groupActivity = createGroupActivity(200, roundActivity, 1, '', '');

    expect(groupActivity.startTime).toBe('2025-06-01T10:00:00.000Z');
    expect(groupActivity.endTime).toBe('2025-06-01T12:00:00.000Z');
  });
});
