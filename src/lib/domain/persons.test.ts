import {
  acceptedRegistration,
  registeredForEvent,
  isOrganizerOrDelegate,
  acceptedRegistrations,
  personsRegistered,
  shouldBeInRound,
  personsShouldBeInRound,
  findPR,
  byPsychsheet,
  byResult,
  byPROrResult,
  addAssignmentsToPerson,
  removeAssignmentsFromPerson,
  upsertAssignmentsOnPerson,
  mayMakeTimeLimit,
  mayMakeCutoff,
} from './persons';
import { Person, Round, Result } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

const createMockPerson = (overrides: Partial<Person> = {}): Person => ({
  registrantId: 1,
  name: 'Test Person',
  wcaUserId: 1,
  wcaId: 'TEST2025',
  countryIso2: 'US',
  gender: 'm',
  birthdate: '2000-01-01',
  email: 'test@example.com',
  assignments: [],
  avatar: null,
  roles: [],
  registration: {
    wcaRegistrationId: 1,
    eventIds: ['333', '222'],
    status: 'accepted',
    guests: 0,
    comments: '',
    isCompeting: true,
  },
  personalBests: [],
  extensions: [],
  ...overrides,
});

describe('acceptedRegistration', () => {
  it('returns true for accepted registration', () => {
    const person = createMockPerson();
    expect(acceptedRegistration(person)).toBe(true);
  });

  it('returns false for pending registration', () => {
    const person = createMockPerson({
      registration: { ...createMockPerson().registration!, status: 'pending' },
    });
    expect(acceptedRegistration(person)).toBe(false);
  });

  it('returns false for deleted registration', () => {
    const person = createMockPerson({
      registration: { ...createMockPerson().registration!, status: 'deleted' },
    });
    expect(acceptedRegistration(person)).toBe(false);
  });
});

describe('registeredForEvent', () => {
  it('returns true when registered for event', () => {
    const person = createMockPerson();
    expect(registeredForEvent('333')(person)).toBe(true);
    expect(registeredForEvent('222')(person)).toBe(true);
  });

  it('returns false when not registered for event', () => {
    const person = createMockPerson();
    expect(registeredForEvent('444')(person)).toBe(false);
  });

  it('returns false when registration is null', () => {
    const person = createMockPerson({ registration: null });
    expect(registeredForEvent('333')(person)).toBe(false);
  });
});

describe('isOrganizerOrDelegate', () => {
  it('returns true for delegate', () => {
    const person = createMockPerson({ roles: ['delegate'] });
    expect(isOrganizerOrDelegate(person)).toBe(true);
  });

  it('returns true for trainee delegate', () => {
    const person = createMockPerson({ roles: ['trainee-delegate'] });
    expect(isOrganizerOrDelegate(person)).toBe(true);
  });

  it('returns true for organizer', () => {
    const person = createMockPerson({ roles: ['organizer'] });
    expect(isOrganizerOrDelegate(person)).toBe(true);
  });

  it('returns false for regular competitor', () => {
    const person = createMockPerson({ roles: [] });
    expect(isOrganizerOrDelegate(person)).toBe(false);
  });
});

describe('acceptedRegistrations', () => {
  it('filters to only accepted registrations', () => {
    const persons = [
      createMockPerson({ registrantId: 1 }),
      createMockPerson({
        registrantId: 2,
        registration: { ...createMockPerson().registration!, status: 'pending' },
      }),
      createMockPerson({ registrantId: 3 }),
    ];

    const accepted = acceptedRegistrations(persons);
    expect(accepted).toHaveLength(2);
    expect(accepted.map((p) => p.registrantId)).toEqual([1, 3]);
  });
});

describe('personsRegistered', () => {
  it('returns persons registered for specific event', () => {
    const persons = [
      createMockPerson({
        registrantId: 1,
        registration: { ...createMockPerson().registration!, eventIds: ['333', '222'] },
      }),
      createMockPerson({
        registrantId: 2,
        registration: { ...createMockPerson().registration!, eventIds: ['444'] },
      }),
      createMockPerson({
        registrantId: 3,
        registration: { ...createMockPerson().registration!, eventIds: ['333'] },
      }),
    ];

    const registered333 = personsRegistered(persons, '333');
    expect(registered333).toHaveLength(2);
    expect(registered333.map((p) => p.registrantId)).toEqual([1, 3]);
  });
});

describe('shouldBeInRound', () => {
  it('uses results when available', () => {
    const round: Round = {
      id: '333-r2',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [
        { personId: 1, ranking: 1, attempts: [], best: 0, average: 0 },
        { personId: 2, ranking: 2, attempts: [], best: 0, average: 0 },
      ],
      extensions: [],
    };

    const test = shouldBeInRound(round);
    expect(test(createMockPerson({ registrantId: 1 }))).toBe(true);
    expect(test(createMockPerson({ registrantId: 3 }))).toBe(false);
  });

  it('uses registration for round 1', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    const test = shouldBeInRound(round);
    const personRegistered = createMockPerson({
      registration: { ...createMockPerson().registration!, eventIds: ['333'] },
    });
    const personNotRegistered = createMockPerson({
      registration: { ...createMockPerson().registration!, eventIds: ['222'] },
    });

    expect(test(personRegistered)).toBe(true);
    expect(test(personNotRegistered)).toBe(false);
  });

  it('returns false for non-first rounds without results', () => {
    const round: Round = {
      id: '333-r2',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    const test = shouldBeInRound(round);
    expect(test(createMockPerson())).toBe(false);
  });
});

describe('personsShouldBeInRound', () => {
  it('filters persons for the round', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    const persons = [
      createMockPerson({
        registrantId: 1,
        registration: { ...createMockPerson().registration!, eventIds: ['333'] },
      }),
      createMockPerson({
        registrantId: 2,
        registration: { ...createMockPerson().registration!, eventIds: ['222'] },
      }),
    ];

    const filtered = personsShouldBeInRound(round)(persons);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].registrantId).toBe(1);
  });
});

describe('findPR', () => {
  it('finds PR by event and type', () => {
    const personalBests = [
      {
        eventId: '333' as const,
        type: 'single' as const,
        best: 1000,
        worldRanking: 100,
        continentalRanking: 50,
        nationalRanking: 10,
      },
      {
        eventId: '333' as const,
        type: 'average' as const,
        best: 1200,
        worldRanking: 150,
        continentalRanking: 60,
        nationalRanking: 15,
      },
    ];

    expect(findPR(personalBests, '333', 'single')).toEqual(personalBests[0]);
    expect(findPR(personalBests, '333', 'average')).toEqual(personalBests[1]);
  });

  it('returns undefined when PR not found', () => {
    const personalBests = [
      {
        eventId: '333' as const,
        type: 'single' as const,
        best: 1000,
        worldRanking: 100,
        continentalRanking: 50,
        nationalRanking: 10,
      },
    ];

    expect(findPR(personalBests, '444', 'single')).toBeUndefined();
    expect(findPR(personalBests, '333', 'average')).toBeUndefined();
  });
});

describe('byPsychsheet', () => {
  it('sorts people with WCA IDs before those without', () => {
    const personWithId = createMockPerson({ wcaId: 'TEST2025' });
    const personWithoutId = createMockPerson({ wcaId: null });

    expect(byPsychsheet('333')(personWithId, personWithoutId)).toBe(-1);
    expect(byPsychsheet('333')(personWithoutId, personWithId)).toBe(1);
  });

  it('sorts people without WCA IDs as equal', () => {
    const person1 = createMockPerson({ wcaId: null });
    const person2 = createMockPerson({ wcaId: null });

    expect(byPsychsheet('333')(person1, person2)).toBe(0);
  });

  it('sorts by average world ranking when both have average PRs', () => {
    const person1 = createMockPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'average',
          best: 1200,
          worldRanking: 100,
          continentalRanking: 50,
          nationalRanking: 10,
        },
      ],
    });
    const person2 = createMockPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'average',
          best: 1400,
          worldRanking: 200,
          continentalRanking: 60,
          nationalRanking: 20,
        },
      ],
    });

    expect(byPsychsheet('333')(person1, person2)).toBe(-100);
    expect(byPsychsheet('333')(person2, person1)).toBe(100);
  });

  it('sorts by single world ranking when no average PRs', () => {
    const person1 = createMockPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'single',
          best: 1000,
          worldRanking: 150,
          continentalRanking: 50,
          nationalRanking: 10,
        },
      ],
    });
    const person2 = createMockPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'single',
          best: 1100,
          worldRanking: 250,
          continentalRanking: 60,
          nationalRanking: 20,
        },
      ],
    });

    expect(byPsychsheet('333')(person1, person2)).toBe(-100);
  });

  it('prioritizes person with average over person without', () => {
    const personWithAverage = createMockPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'average',
          best: 1200,
          worldRanking: 200,
          continentalRanking: 50,
          nationalRanking: 10,
        },
      ],
    });
    const personWithoutAverage = createMockPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'single',
          best: 1000,
          worldRanking: 100,
          continentalRanking: 50,
          nationalRanking: 10,
        },
      ],
    });

    expect(byPsychsheet('333')(personWithAverage, personWithoutAverage)).toBe(-1);
    expect(byPsychsheet('333')(personWithoutAverage, personWithAverage)).toBe(1);
  });
});

describe('byResult', () => {
  const results: Result[] = [
    { personId: 1, ranking: 1, attempts: [], best: 0, average: 0 },
    { personId: 2, ranking: 2, attempts: [], best: 0, average: 0 },
    { personId: 3, ranking: 3, attempts: [], best: 0, average: 0 },
  ];

  it('sorts by ranking in results', () => {
    const person1 = createMockPerson({ registrantId: 1 });
    const person2 = createMockPerson({ registrantId: 2 });

    expect(byResult(results)(person1, person2)).toBe(-1);
    expect(byResult(results)(person2, person1)).toBe(1);
  });

  it('sorts persons without results last', () => {
    const personWithResult = createMockPerson({ registrantId: 1 });
    const personWithoutResult = createMockPerson({ registrantId: 999 });

    expect(byResult(results)(personWithResult, personWithoutResult)).toBeLessThan(0);
  });
});

describe('addAssignmentsToPerson', () => {
  it('adds assignments to person', () => {
    const person = createMockPerson({ assignments: [] });
    const newAssignments = [
      { assignmentCode: 'competitor', activityId: 100, stationNumber: null },
      { assignmentCode: 'staff-judge', activityId: 200, stationNumber: null },
    ];

    const updated = addAssignmentsToPerson(person, newAssignments);
    expect(updated.assignments).toHaveLength(2);
    expect(updated.assignments).toEqual(newAssignments);
  });

  it('appends to existing assignments', () => {
    const person = createMockPerson({
      assignments: [{ assignmentCode: 'competitor', activityId: 100, stationNumber: null }],
    });
    const newAssignments = [
      { assignmentCode: 'staff-judge', activityId: 200, stationNumber: null },
    ];

    const updated = addAssignmentsToPerson(person, newAssignments);
    expect(updated.assignments).toHaveLength(2);
  });
});

describe('removeAssignmentsFromPerson', () => {
  it('removes assignments for specific activity', () => {
    const person = createMockPerson({
      assignments: [
        { assignmentCode: 'competitor', activityId: 100, stationNumber: null },
        { assignmentCode: 'staff-judge', activityId: 200, stationNumber: null },
      ],
    });

    const updated = removeAssignmentsFromPerson(person, 100);
    expect(updated.assignments).toHaveLength(1);
    expect(updated.assignments[0].activityId).toBe(200);
  });

  it('handles person with no assignments', () => {
    const person = createMockPerson({ assignments: undefined });
    const updated = removeAssignmentsFromPerson(person, 100);
    expect(updated.assignments).toEqual([]);
  });
});

describe('upsertAssignmentsOnPerson', () => {
  it('replaces existing assignment for same activity', () => {
    const person = createMockPerson({
      assignments: [
        { assignmentCode: 'competitor', activityId: 100, stationNumber: null },
        { assignmentCode: 'staff-judge', activityId: 200, stationNumber: null },
      ],
    });

    const newAssignments = [
      { assignmentCode: 'staff-scrambler', activityId: 100, stationNumber: null },
    ];

    const updated = upsertAssignmentsOnPerson(person, newAssignments);
    expect(updated.assignments).toHaveLength(2);
    expect(updated.assignments!.find((a) => a.activityId === 100)?.assignmentCode).toBe(
      'staff-scrambler'
    );
  });

  it('adds new assignment when activity not present', () => {
    const person = createMockPerson({
      assignments: [{ assignmentCode: 'competitor', activityId: 100, stationNumber: null }],
    });

    const newAssignments = [
      { assignmentCode: 'staff-judge', activityId: 200, stationNumber: null },
    ];

    const updated = upsertAssignmentsOnPerson(person, newAssignments);
    expect(updated.assignments).toHaveLength(2);
  });
});

describe('mayMakeTimeLimit', () => {
  it('returns persons who may make time limit', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: { centiseconds: 1500, cumulativeRoundIds: [] },
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    const persons = [
      createMockPerson({
        registrantId: 1,
        personalBests: [
          {
            eventId: '333',
            type: 'single',
            best: 1000,
            worldRanking: 100,
            continentalRanking: 50,
            nationalRanking: 10,
          },
        ],
      }),
      createMockPerson({
        registrantId: 2,
        personalBests: [
          {
            eventId: '333',
            type: 'single',
            best: 2000,
            worldRanking: 200,
            continentalRanking: 60,
            nationalRanking: 20,
          },
        ],
      }),
    ];

    const filtered = mayMakeTimeLimit('333', round, persons);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].registrantId).toBe(1);
  });

  it('returns empty array when no time limit', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    expect(mayMakeTimeLimit('333', round, [])).toEqual([]);
  });
});

describe('mayMakeCutoff', () => {
  it('returns persons who may make cutoff', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: null,
      cutoff: { numberOfAttempts: 2, attemptResult: 1500 },
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    const persons = [
      createMockPerson({
        registrantId: 1,
        personalBests: [
          {
            eventId: '333',
            type: 'average',
            best: 1200,
            worldRanking: 100,
            continentalRanking: 50,
            nationalRanking: 10,
          },
        ],
      }),
      createMockPerson({
        registrantId: 2,
        personalBests: [
          {
            eventId: '333',
            type: 'average',
            best: 1800,
            worldRanking: 200,
            continentalRanking: 60,
            nationalRanking: 20,
          },
        ],
      }),
    ];

    const filtered = mayMakeCutoff('333', round, persons);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].registrantId).toBe(1);
  });

  it('returns empty array when no cutoff', () => {
    const round: Round = {
      id: '333-r1',
      format: 'a',
      timeLimit: null,
      cutoff: null,
      advancementCondition: null,
      scrambleSetCount: 1,
      results: [],
      extensions: [],
    };

    expect(mayMakeCutoff('333', round, [])).toEqual([]);
  });
});
