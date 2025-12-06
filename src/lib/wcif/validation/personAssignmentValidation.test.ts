import { describe, it, expect } from 'vitest';
import type { Competition, Person } from '@wca/helpers';
import {
  validatePersonAssignmentActivitiesExist,
  validatePersonAssignmentScheduleConflicts,
  validatePersonAssignments,
} from './personAssignmentValidation';
import {
  MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
  PERSON_ASSIGNMENT_SCHEDULE_CONFLICT,
} from './types';

const mockWcif: Competition = {
  formatVersion: '1.0',
  id: 'TestComp2024',
  name: 'Test Competition 2024',
  shortName: 'Test 2024',
  persons: [],
  events: [],
  schedule: {
    startDate: '2024-01-01',
    numberOfDays: 1,
    venues: [
      {
        id: 1,
        name: 'Venue 1',
        latitudeMicrodegrees: 0,
        longitudeMicrodegrees: 0,
        countryIso2: 'US',
        timezone: 'America/New_York',
        rooms: [
          {
            id: 1,
            name: 'Room 1',
            color: '#000000',
            activities: [
              {
                id: 1,
                name: '3x3 Round 1',
                activityCode: '333-r1',
                startTime: '2024-01-01T09:00:00.000Z',
                endTime: '2024-01-01T10:00:00.000Z',
                childActivities: [],
                extensions: [],
              },
              {
                id: 2,
                name: '2x2 Round 1',
                activityCode: '222-r1',
                startTime: '2024-01-01T10:00:00.000Z',
                endTime: '2024-01-01T11:00:00.000Z',
                childActivities: [],
                extensions: [],
              },
              {
                id: 3,
                name: '4x4 Round 1',
                activityCode: '444-r1',
                startTime: '2024-01-01T09:30:00.000Z',
                endTime: '2024-01-01T10:30:00.000Z',
                childActivities: [],
                extensions: [],
              },
            ],
            extensions: [],
          },
        ],
        extensions: [],
      },
    ],
  },
  competitorLimit: 100,
  extensions: [],
};

const createPerson = (overrides: Partial<Person> = {}): Person => ({
  registrantId: 1,
  name: 'Test Person',
  wcaUserId: 1,
  wcaId: null,
  countryIso2: 'US',
  gender: 'm',
  birthdate: '2000-01-01',
  email: 'test@example.com',
  avatar: null,
  roles: [],
  registration: {
    wcaRegistrationId: 1,
    eventIds: ['333'],
    status: 'accepted',
    guests: 0,
    comments: '',
    isCompeting: true,
  },
  assignments: [],
  personalBests: [],
  extensions: [],
  ...overrides,
});

describe('validatePersonAssignmentActivitiesExist', () => {
  it('should return errors when person has assignment for non-existent activity', () => {
    const person = createPerson({
      registrantId: 123,
      name: 'John Doe',
      assignments: [
        {
          activityId: 999, // Does not exist
          stationNumber: null,
          assignmentCode: 'competitor',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignmentActivitiesExist(wcif);

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT);
    expect(errors[0].message).toContain('John Doe');
    expect(errors[0].message).toContain('123');
    expect(errors[0].data.person).toBe(person);
    expect(errors[0].data.assignment?.activityId).toBe(999);
  });

  it('should return no errors when all assignments reference existing activities', () => {
    const person = createPerson({
      assignments: [
        {
          activityId: 1,
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 2,
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignmentActivitiesExist(wcif);

    expect(errors).toHaveLength(0);
  });

  it('should skip pending/deleted registrations', () => {
    const pendingPerson = createPerson({
      registration: {
        wcaRegistrationId: 1,
        eventIds: ['333'],
        status: 'pending',
        guests: 0,
        comments: '',
        isCompeting: true,
      },
      assignments: [
        {
          activityId: 999,
          stationNumber: null,
          assignmentCode: 'competitor',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [pendingPerson],
    };

    const errors = validatePersonAssignmentActivitiesExist(wcif);

    expect(errors).toHaveLength(0);
  });
});

describe('validatePersonAssignmentScheduleConflicts', () => {
  it('should detect overlapping assignments for same person', () => {
    const person = createPerson({
      registrantId: 456,
      name: 'Jane Smith',
      assignments: [
        {
          activityId: 1, // 09:00 - 10:00
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 3, // 09:30 - 10:30 (overlaps with activity 1)
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignmentScheduleConflicts(wcif);

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(PERSON_ASSIGNMENT_SCHEDULE_CONFLICT);
    expect(errors[0].message).toContain('Jane Smith');
    expect(errors[0].message).toContain('456');
    expect(errors[0].message).toContain('conflicting');
    expect(errors[0].data.conflictingAssignments).toHaveLength(1);
    expect(errors[0].data.conflictingAssignments?.[0].assignmentA.activityId).toBe(1);
    expect(errors[0].data.conflictingAssignments?.[0].assignmentB.activityId).toBe(3);
  });

  it('should not detect conflicts for non-overlapping assignments', () => {
    const person = createPerson({
      assignments: [
        {
          activityId: 1, // 09:00 - 10:00
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 2, // 10:00 - 11:00 (no overlap)
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignmentScheduleConflicts(wcif);

    expect(errors).toHaveLength(0);
  });

  it('should handle multiple conflicts for same person', () => {
    const person = createPerson({
      registrantId: 789,
      name: 'Bob Wilson',
      assignments: [
        {
          activityId: 1, // 09:00 - 10:00
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 3, // 09:30 - 10:30 (overlaps with 1)
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
        {
          activityId: 1, // 09:00 - 10:00 (duplicate, overlaps with 3)
          stationNumber: null,
          assignmentCode: 'staff-scrambler',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignmentScheduleConflicts(wcif);

    expect(errors).toHaveLength(1);
    expect(errors[0].data.conflictingAssignments!.length).toBeGreaterThan(1);
  });

  it('should include room information in conflict data', () => {
    const person = createPerson({
      assignments: [
        {
          activityId: 1,
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 3,
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignmentScheduleConflicts(wcif);

    expect(errors).toHaveLength(1);
    const conflict = errors[0].data.conflictingAssignments?.[0];
    expect(conflict?.assignmentA.room).toBeDefined();
    expect(conflict?.assignmentA.room?.name).toBe('Room 1');
    expect(conflict?.assignmentB.room).toBeDefined();
  });
});

describe('validatePersonAssignments', () => {
  it('should return all person assignment validation errors', () => {
    const person1 = createPerson({
      registrantId: 1,
      assignments: [
        {
          activityId: 999, // Non-existent
          stationNumber: null,
          assignmentCode: 'competitor',
        },
      ],
    });

    const person2 = createPerson({
      registrantId: 2,
      assignments: [
        {
          activityId: 1,
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 3, // Overlaps with 1
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person1, person2],
    };

    const errors = validatePersonAssignments(wcif);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.type === MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT)).toBe(true);
    expect(errors.some((e) => e.type === PERSON_ASSIGNMENT_SCHEDULE_CONFLICT)).toBe(true);
  });

  it('should return no errors for valid assignments', () => {
    const person = createPerson({
      assignments: [
        {
          activityId: 1,
          stationNumber: null,
          assignmentCode: 'competitor',
        },
        {
          activityId: 2,
          stationNumber: null,
          assignmentCode: 'staff-judge',
        },
      ],
    });

    const wcif: Competition = {
      ...mockWcif,
      persons: [person],
    };

    const errors = validatePersonAssignments(wcif);

    expect(errors).toHaveLength(0);
  });
});
