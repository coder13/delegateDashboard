import {
  balanceStartAndEndTimes,
  determineMissingGroupActivities,
  determineStageForAssignments,
  findCompetingAssignment,
  findStaffingAssignments,
  generateAssignments,
  generateMissingGroupActivities,
  type ParsedAssignment,
  upsertCompetitorAssignments,
} from './import';
import { type Activity, type Competition, type Person } from '@wca/helpers';
import { describe, expect, it } from 'vitest';

const baseRound = (id: number, activityCode = '333-r1'): Activity => ({
  id,
  name: '333 Round 1',
  activityCode,
  startTime: '2024-01-01T10:00:00.000Z',
  endTime: '2024-01-01T11:00:00.000Z',
  childActivities: [],
  extensions: [],
});

const groupActivity = (id: number, activityCode: string): Activity => ({
  id,
  name: activityCode,
  activityCode,
  startTime: '2024-01-01T10:00:00.000Z',
  endTime: '2024-01-01T10:15:00.000Z',
  childActivities: [],
  extensions: [],
});

const buildCompetition = (rooms: any[], persons: Person[]): Competition => ({
  id: 'comp',
  shortName: 'comp',
  name: 'Comp',
  formatVersion: 'v1.0',
  competitorLimit: null,
  extensions: [],
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
        timezone: 'America/New_York',
        rooms,
        extensions: [],
      },
    ],
  },
  persons,
  events: [
    {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          cutoff: null,
          timeLimit: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    },
  ],
});

const competitor = (overrides: Partial<Person>): Person => ({
  registrantId: 1,
  wcaUserId: 1,
  name: 'Alice',
  email: 'alice@example.com',
  countryIso2: 'US',
  assignments: [],
  registration: {
    wcaRegistrationId: 1,
    status: 'accepted',
    eventIds: ['333'],
    isCompeting: true,
  },
  extensions: [],
  ...overrides,
});

describe('import helpers', () => {
  it('parses competitor assignments across named stages', () => {
    const round = baseRound(1);
    const wcif = buildCompetition(
      [
        { id: 10, name: 'A Stage', activities: [round], color: '#000' },
        { id: 11, name: 'B Stage', activities: [round], color: '#111' },
      ],
      [competitor({})]
    );

    const assignment = findCompetingAssignment(
      wcif.schedule.venues[0].rooms,
      { email: 'alice@example.com', '333': 'B 2' },
      wcif.persons[0],
      '333'
    );

    expect(assignment).toEqual({
      registrantId: 1,
      eventId: '333',
      groupNumber: 2,
      activityCode: '333-r1-g2',
      assignmentCode: 'competitor',
      roomId: 11,
    });
  });

  it('throws when no stage is provided with multiple rooms', () => {
    const wcif = buildCompetition(
      [
        { id: 10, name: 'A Stage', activities: [baseRound(1)], color: '#000' },
        { id: 11, name: 'B Stage', activities: [baseRound(2)], color: '#111' },
      ],
      [competitor({})]
    );

    expect(() =>
      findCompetingAssignment(
        wcif.schedule.venues[0].rooms,
        { email: 'alice', '333': '1' },
        wcif.persons[0],
        '333'
      )
    ).toThrow('Stage data for competitor assignment is ambiguous');
  });

  it('extracts staffing assignments with default judge role and stage aware ids', () => {
    const wcif = buildCompetition(
      [{ id: 10, name: 'Main Stage', activities: [baseRound(1)], color: '#000' }],
      [competitor({})]
    );

    const assignments = findStaffingAssignments(
      wcif.schedule.venues[0].rooms,
      {
        meta: { fields: ['333', '333-staff'] },
        data: [{ email: 'alice@example.com', '333': '1', '333-staff': 'R1, 2;S3' }],
      },
      { email: 'alice@example.com', '333': '1', '333-staff': 'R1, 2;S3' },
      wcif.persons[0],
      '333'
    );

    expect(assignments).toEqual([
      {
        registrantId: 1,
        eventId: '333',
        roundNumber: 1,
        activityCode: '333-r1-g1',
        groupNumber: 1,
        assignmentCode: 'staff-runner',
        roomId: 10,
      },
      {
        registrantId: 1,
        eventId: '333',
        roundNumber: 1,
        activityCode: '333-r1-g2',
        groupNumber: 2,
        assignmentCode: 'staff-judge',
        roomId: 10,
      },
      {
        registrantId: 1,
        eventId: '333',
        roundNumber: 1,
        activityCode: '333-r1-g3',
        groupNumber: 3,
        assignmentCode: 'staff-scrambler',
        roomId: 10,
      },
    ]);
  });

  it('generates assignments from CSV rows', () => {
    const rooms = [{ id: 10, name: 'Main Stage', activities: [baseRound(1)], color: '#000' }];
    const person = competitor({});
    const wcif = buildCompetition(rooms, [person]);

    const assignments = generateAssignments(wcif, {
      meta: { fields: ['email', '333', '333-staff'] },
      data: [
        {
          email: 'alice@example.com',
          '333': '1',
          '333-staff': 'J2',
        },
      ],
    });

    expect(assignments).toEqual([
      {
        registrantId: 1,
        eventId: '333',
        groupNumber: 1,
        activityCode: '333-r1-g1',
        assignmentCode: 'competitor',
        roomId: 10,
      },
      {
        registrantId: 1,
        eventId: '333',
        groupNumber: 2,
        activityCode: '333-r1-g2',
        assignmentCode: 'staff-judge',
        roomId: 10,
        roundNumber: 1,
      },
    ]);
  });

  it('reports missing group activities and fills stage information', () => {
    const round = {
      ...baseRound(1),
      childActivities: [groupActivity(2, '333-r1-g1')],
    };
    const room = { id: 10, name: 'Main Stage', activities: [round], color: '#000' };
    const wcif = buildCompetition([room], [competitor({})]);

    const assignments: ParsedAssignment[] = [
      {
        registrantId: 1,
        eventId: '333',
        groupNumber: 2,
        activityCode: '333-r1-g2',
        assignmentCode: 'competitor',
        roomId: 10,
      },
      {
        registrantId: 1,
        eventId: '333',
        groupNumber: 2,
        activityCode: '333-r1-g2',
        assignmentCode: 'staff-judge',
      },
    ];

    const missing = determineMissingGroupActivities(wcif, assignments);
    expect(missing).toEqual([{ activityCode: '333-r1-g2', roomId: 10 }]);

    const stagedAssignments = determineStageForAssignments(wcif, assignments);
    expect(stagedAssignments[1].roomId).toBe(10);
  });

  it('creates and balances missing group activities', () => {
    const round = { ...baseRound(1), childActivities: [] };
    const room = { id: 10, name: 'Main Stage', activities: [round], color: '#000' };
    const wcif = buildCompetition([room], [competitor({})]);

    const withGroups = generateMissingGroupActivities(wcif, [
      { activityCode: '333-r1-g1', roomId: 10 },
      { activityCode: '333-r1-g2', roomId: 10 },
    ]);

    expect(withGroups.schedule.venues[0].rooms[0].activities[0].childActivities).toHaveLength(2);

    const balanced = balanceStartAndEndTimes(withGroups, [
      { activityCode: '333-r1-g1', roomId: 10 },
      { activityCode: '333-r1-g2', roomId: 10 },
    ]);

    const [firstGroup, secondGroup] =
      balanced.schedule.venues[0].rooms[0].activities[0].childActivities;
    expect(firstGroup.startTime).toBe('2024-01-01T10:00:00.000Z');
    expect(secondGroup.startTime).toBe('2024-01-01T10:30:00.000Z');
    expect(secondGroup.endTime).toBe('2024-01-01T11:00:00.000Z');
  });

  it('upserts competitor assignments without duplication', () => {
    const groups = [groupActivity(2, '333-r1-g1')];
    const round = { ...baseRound(1), childActivities: groups };
    const room = { id: 10, name: 'Main Stage', activities: [round], color: '#000' };
    const person = competitor({ assignments: [] });
    const wcif = buildCompetition([room], [person]);

    const updated = upsertCompetitorAssignments(wcif, [
      {
        registrantId: 1,
        eventId: '333',
        groupNumber: 1,
        activityCode: '333-r1-g1',
        assignmentCode: 'competitor',
        roomId: 10,
      },
      {
        registrantId: 1,
        eventId: '333',
        groupNumber: 1,
        activityCode: '333-r1-g1',
        assignmentCode: 'competitor',
        roomId: 10,
      },
    ]);

    expect(updated.persons[0].assignments).toHaveLength(1);
    expect(updated.persons[0].assignments?.[0].assignmentCode).toBe('competitor');
  });
});
