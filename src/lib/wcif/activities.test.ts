import { describe, expect, it, vi } from 'vitest';
import {
  activityByActivityCode,
  allChildActivities,
  earliestStartTimeForRound,
  findActivityById,
  findAllActivities,
  findAllActivitiesByRoom,
  findAllRoundActivities,
  findGroupActivitiesByRound,
  findResultsForActivityCode,
  findRoundActivitiesById,
  findRooms,
  generateNextChildActivityId,
  roomByActivity,
} from './activities';
import type { Activity, Competition } from '@wca/helpers';

const buildActivity = (overrides: Partial<Activity>): Activity => ({
  id: 1,
  name: 'Activity',
  activityCode: '333-r1',
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T11:00:00Z',
  childActivities: [],
  extensions: [],
  ...overrides,
});

const buildWcif = (
  rooms: { id: number; name: string; activities: Activity[]; color: string; extensions: any[] }[]
): Competition =>
  ({
    id: 'TestComp',
    name: 'Test Competition',
    shortName: 'Test',
    formatVersion: '1.0',
    series: [],
    competitorLimit: null,
    registrationInfo: null,
    schedule: {
      startDate: '2024-01-01',
      numberOfDays: 1,
      venues: [
        {
          id: 1,
          name: 'Venue',
          latitudeMicrodegrees: 0,
          longitudeMicrodegrees: 0,
          countryIso2: 'US',
          timezone: 'UTC',
          rooms,
        },
      ],
    },
    events: [
      {
        id: '333',
        rounds: [
          {
            id: '333-r1',
            format: 'a',
            timeLimit: null,
            cutoff: null,
            advancementCondition: null,
            results: [{ personId: 1, best: 1000, average: 1200, ranking: 1, attempts: [] }],
            scrambleSetCount: 1,
            extensions: [],
          },
        ],
        competitorLimit: null,
        qualification: null,
        extensions: [],
      },
    ],
    persons: [],
    extensions: [],
  }) as unknown as Competition;

describe('wcif activities helpers', () => {
  const groupA = buildActivity({
    id: 11,
    name: 'Group 1',
    activityCode: '333-r1-g1',
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:30:00Z',
  });
  const groupBChild = buildActivity({
    id: 12,
    name: 'Subgroup',
    activityCode: '333-r1-g2-a',
    startTime: '2024-01-01T10:10:00Z',
    endTime: '2024-01-01T10:20:00Z',
  });
  const groupB = buildActivity({
    id: 13,
    name: 'Group 2',
    activityCode: '333-r1-g2',
    childActivities: [groupBChild],
  });

  const roundMain = buildActivity({
    id: 10,
    name: 'Round 1',
    activityCode: '333-r1',
    childActivities: [groupA, groupB],
  });
  const roundSide = buildActivity({
    id: 20,
    name: 'Round 1',
    activityCode: '333-r1',
    startTime: '2024-01-01T09:30:00Z',
  });

  const wcif = buildWcif([
    { id: 1, name: 'Main Room', activities: [roundMain], color: '#fff', extensions: [] },
    { id: 2, name: 'Side Room', activities: [roundSide], color: '#fff', extensions: [] },
  ]);

  it('flattens all child activities with parent references', () => {
    const children = allChildActivities(roundMain);

    expect(children).toHaveLength(3);
    expect(children.map((child) => child.parent?.id)).toEqual([10, 10, 13]);
  });

  it('finds rooms and round activities', () => {
    expect(findRooms(wcif)).toHaveLength(2);
    expect(findAllRoundActivities(wcif)).toHaveLength(2);
  });

  it('finds rooms for activity ids', () => {
    const room = roomByActivity(wcif, 11);
    expect(room?.name).toBe('Main Room');
  });

  it('finds all activities and groups for a round', () => {
    expect(findAllActivities(wcif)).toHaveLength(5);
    expect(findRoundActivitiesById(wcif, '333-r1')).toHaveLength(2);
    expect(findGroupActivitiesByRound(wcif, '333-r1')).toHaveLength(3);
  });

  it('finds activities by room and logs when missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(findAllActivitiesByRoom(wcif, 1)).toHaveLength(3);
    expect(findAllActivitiesByRoom(wcif, 999)).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('Could not find activities for room', 999);
  });

  it('finds activities by id with caching', () => {
    const first = findActivityById(wcif, 11);
    const second = findActivityById(wcif, 11);

    expect(first?.id).toBe(11);
    expect(second).toBe(first);
  });

  it('finds activities by code per room and throws when missing', () => {
    const activity = activityByActivityCode(wcif, 1, '333-r1-g1');
    expect(activity.id).toBe(11);

    expect(() => activityByActivityCode(wcif, 2, 'missing')).toThrow(
      'Activity not found: missing in room: 2'
    );
  });

  it('generates next child activity id and finds results', () => {
    expect(generateNextChildActivityId(wcif)).toBe(21);
    expect(findResultsForActivityCode(wcif, '333-r1')).toHaveLength(1);
    expect(findResultsForActivityCode(wcif, '222-r1')).toBeUndefined();
  });

  it('finds earliest start time for round activities', () => {
    const earliest = earliestStartTimeForRound(wcif, '333-r1');
    expect(earliest?.toISOString()).toBe('2024-01-01T09:30:00.000Z');
    expect(earliestStartTimeForRound(wcif, '333-r2')).toBeUndefined();
  });
});
