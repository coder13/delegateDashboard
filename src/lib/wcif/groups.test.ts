import type { ActivityWithParent, ActivityWithRoom } from '../domain';
import {
  computeGroupSizes,
  computeGroupSizesForRoundId,
  createGroupAssignment,
  createGroupsAcrossStages,
  nextGroupForActivity,
  previousGroupForActivity,
} from './groups';
import type { Activity, Assignment, Competition, Person } from '@wca/helpers';
import { describe, expect, it } from 'vitest';

const baseRound: Activity = {
  id: 1,
  name: '333 Round 1',
  activityCode: '333-r1',
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T11:00:00Z',
  childActivities: [],
  extensions: [],
};

const laterRound: Activity = {
  ...baseRound,
  id: 2,
  name: '333 Round 2',
  activityCode: '333-r2',
  startTime: '2024-01-01T11:00:00Z',
  endTime: '2024-01-01T12:00:00Z',
};

const buildWcifWithRooms = (
  rooms: Array<{ id: number; name?: string; activities: Activity[] }>
): Competition => ({
  schedule: {
    startDate: '2024-01-01',
    numberOfDays: 1,
    venues: [
      {
        id: 1,
        name: 'Main Venue',
        latitudeMicrodegrees: 0,
        longitudeMicrodegrees: 0,
        countryIso2: 'US',
        timezone: 'America/New_York',
        extensions: [],
        rooms: rooms.map(({ id, name, activities }) => ({
          id,
          name: name ?? `Room ${id}`,
          activities,
          color: '#000',
          extensions: [],
        })),
      },
    ],
  },
  persons: [],
  events: [],
  id: 'test-competition',
  shortName: 'test',
  name: 'Test',
  formatVersion: 'v1.0',
  competitorLimit: null,
  extensions: [],
});

const buildWcif = (roundActivities: Activity[]): Competition =>
  buildWcifWithRooms([{ id: 10, name: 'Main Room', activities: roundActivities }]);

describe('group helpers', () => {
  it('creates group assignments', () => {
    expect(createGroupAssignment(1, 2, 'competitor', 5)).toEqual({
      registrantId: 1,
      assignment: {
        assignmentCode: 'competitor',
        activityId: 2,
        stationNumber: 5,
      },
    });
  });

  it('computes group sizes for a specific activity', () => {
    const assignments = [
      { activityId: 2, assignmentCode: 'competitor' },
      { activityId: 2, assignmentCode: 'competitor' },
      { activityId: 3, assignmentCode: 'staff-judge' },
    ] as Assignment[];

    const sizeResult = computeGroupSizes(assignments)({ id: 2 } as Activity);
    expect(sizeResult).toEqual({ activity: { id: 2 }, size: 2 });
  });

  it('links to the previous and next groups', () => {
    // @ts-expect-error - ignoring missing properties for test
    const parent: ActivityWithRoom = { childActivities: [] };
    // @ts-expect-error - ignoring missing properties for test
    const group1: ActivityWithParent = { activityCode: '333-r1-g1', parent };
    // @ts-expect-error - ignoring missing properties for test
    const group2: ActivityWithParent = { activityCode: '333-r1-g2', parent };
    // @ts-expect-error - ignoring missing properties for test
    const group3: ActivityWithParent = { activityCode: '333-r1-g3', parent };
    parent.childActivities = [group1, group2, group3];

    expect(previousGroupForActivity(group1)?.activityCode).toBe('333-r1-g3');
    expect(nextGroupForActivity(group3)?.activityCode).toBe('333-r1-g1');
  });

  it('creates evenly split groups across stages', () => {
    const wcif = buildWcif([baseRound]);
    const [roundWithGroups] = createGroupsAcrossStages(wcif, [baseRound], {
      spreadGroupsAcrossAllStages: true,
      groups: 2,
    });

    expect(roundWithGroups.childActivities).toHaveLength(2);
    expect(roundWithGroups.childActivities?.[0].activityCode).toBe('333-r1-g1');
    expect(roundWithGroups.childActivities?.[0].id).toBe(2);
    expect(roundWithGroups.childActivities?.[1].startTime).toBe('2024-01-01T10:30:00.000Z');
  });

  it('splits round durations evenly and increments activity ids across multiple stages', () => {
    const wcif = buildWcif([baseRound, laterRound]);
    const [firstRound, secondRound] = createGroupsAcrossStages(wcif, [baseRound, laterRound], {
      spreadGroupsAcrossAllStages: true,
      groups: 3,
    });

    expect(firstRound.childActivities?.map((a) => a.id)).toEqual([3, 4, 5]);
    expect(secondRound.childActivities?.map((a) => a.id)).toEqual([6, 7, 8]);
    expect(firstRound.childActivities?.map((a) => a.startTime)).toEqual([
      '2024-01-01T10:00:00.000Z',
      '2024-01-01T10:20:00.000Z',
      '2024-01-01T10:40:00.000Z',
    ]);
    expect(firstRound.childActivities?.map((a) => a.endTime)).toEqual([
      '2024-01-01T10:20:00.000Z',
      '2024-01-01T10:40:00.000Z',
      '2024-01-01T11:00:00.000Z',
    ]);
  });

  it('creates groups per room when not spreading across stages', () => {
    const wcif = buildWcif([baseRound]);
    const [roundWithGroups] = createGroupsAcrossStages(wcif, [baseRound], {
      spreadGroupsAcrossAllStages: false,
      groups: { 10: 2 },
    });

    expect(roundWithGroups.childActivities?.map((a) => a.activityCode)).toEqual([
      '333-r1-g1',
      '333-r1-g2',
    ]);
  });

  it('uses per-room group counts when not spreading across stages', () => {
    const roomOneRound = { ...baseRound };
    const roomTwoRound: Activity = {
      ...baseRound,
      id: 3,
      name: '444 Round 1',
      activityCode: '444-r1',
    };

    const wcif = buildWcifWithRooms([
      { id: 10, activities: [roomOneRound] },
      { id: 11, activities: [roomTwoRound] },
    ]);

    const [mainRoomRound, sideRoomRound] = createGroupsAcrossStages(
      wcif,
      [roomOneRound, roomTwoRound],
      {
        spreadGroupsAcrossAllStages: false,
        groups: { 10: 1, 11: 3 },
      }
    );

    expect(mainRoomRound.childActivities?.map((a) => a.activityCode)).toEqual(['333-r1-g1']);
    expect(sideRoomRound.childActivities?.map((a) => a.activityCode)).toEqual([
      '444-r1-g1',
      '444-r1-g2',
      '444-r1-g3',
    ]);
    expect(sideRoomRound.childActivities?.[1].startTime).toBe('2024-01-01T10:20:00.000Z');
    expect(sideRoomRound.childActivities?.[2].endTime).toBe('2024-01-01T11:00:00.000Z');
  });

  it('calculates group sizes for a round id', () => {
    const group1 = {
      id: 2,
      name: '333 Round 1 Group 1',
      activityCode: '333-r1-g1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      childActivities: [],
      extensions: [],
    } as Activity;
    const group2 = {
      id: 3,
      name: '333 Round 1 Group 2',
      activityCode: '333-r1-g2',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      childActivities: [],
      extensions: [],
    } as Activity;
    const roundWithGroups: Activity = {
      ...baseRound,
      childActivities: [group1, group2],
    };

    const wcif: Competition = {
      ...buildWcif([roundWithGroups]),
      persons: [
        { registrantId: 1, assignments: [{ activityId: 2, assignmentCode: 'competitor' }] },
        { registrantId: 2, assignments: [{ activityId: 3, assignmentCode: 'competitor' }] },
        { registrantId: 3, assignments: [{ activityId: 3, assignmentCode: 'staff-judge' }] },
      ] as Person[],
    } as Competition;

    const groupSizes = computeGroupSizesForRoundId(wcif, '333-r1');
    expect(groupSizes).toEqual([
      { activity: expect.objectContaining({ id: 2 }), size: 1 },
      { activity: expect.objectContaining({ id: 3 }), size: 1 },
    ]);
  });
});
