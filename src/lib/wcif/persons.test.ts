import { describe, expect, it } from 'vitest';
import { findResultFromRound, getSeedResult } from './persons';
import type { Competition, Person, Result, Round } from '@wca/helpers';

const buildRound = (overrides: Partial<Round>): Round => ({
  id: '333-r1',
  format: 'a',
  timeLimit: null,
  cutoff: null,
  advancementCondition: null,
  results: [],
  scrambleSetCount: 1,
  extensions: [],
  ...overrides,
});

const buildWcif = (rounds: Round[]): Competition =>
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
      venues: [],
    },
    events: [
      {
        id: '333',
        rounds,
        competitorLimit: null,
        qualification: null,
        extensions: [],
      },
    ],
    persons: [],
    extensions: [],
  }) as unknown as Competition;

const buildPerson = (overrides: Partial<Person>): Person => ({
  registrantId: 1,
  name: 'Test Person',
  wcaUserId: 1,
  wcaId: '2024TEST01',
  countryIso2: 'US',
  gender: 'm',
  birthdate: '2000-01-01',
  email: 'test@example.com',
  registration: {
    status: 'accepted',
    eventIds: ['333'],
    isCompeting: true,
    comments: undefined,
    wcaRegistrationId: 1,
  },
  assignments: [],
  roles: [],
  personalBests: [],
  extensions: [],
  avatar: null,
  ...overrides,
});

describe('wcif persons helpers', () => {
  it('finds results for a round when present', () => {
    const results: Result[] = [
      { personId: 1, best: 1200, average: 1500, ranking: 1, attempts: [] },
      { personId: 2, best: 1400, average: 1600, ranking: 2, attempts: [] },
    ];
    const wcif = buildWcif([buildRound({ id: '333-r1', format: 'a', results })]);

    expect(findResultFromRound(wcif, '333-r1', 1)).toEqual({
      average: 1500,
      single: 1200,
    });
  });

  it('returns only single when format ranks by single', () => {
    const results: Result[] = [{ personId: 1, best: 900, average: 1200, ranking: 1, attempts: [] }];
    const wcif = buildWcif([buildRound({ id: '333-r1', format: '3', results })]);

    expect(findResultFromRound(wcif, '333-r1', 1)).toEqual({
      average: undefined,
      single: 900,
    });
  });

  it('returns undefined when the round or result is missing', () => {
    const wcif = buildWcif([buildRound({ id: '333-r1' })]);

    expect(findResultFromRound(wcif, '333-r2', 1)).toBeUndefined();
    expect(findResultFromRound(wcif, '333-r1', 999)).toBeUndefined();
  });

  it('returns PRs for round 1 seeding', () => {
    const person = buildPerson({
      personalBests: [
        {
          eventId: '333',
          type: 'average',
          best: 1500,
          worldRanking: 10,
          continentalRanking: 5,
          nationalRanking: 1,
        },
        {
          eventId: '333',
          type: 'single',
          best: 900,
          worldRanking: 8,
          continentalRanking: 3,
          nationalRanking: 1,
        },
      ],
    });
    const wcif = buildWcif([buildRound({ id: '333-r1', format: 'a' })]);

    expect(getSeedResult(wcif, '333-r1', person)).toEqual({
      average: 1500,
      single: 900,
    });
  });

  it('returns previous round results for later rounds', () => {
    const previousResults: Result[] = [
      { personId: 1, best: 850, average: 1000, ranking: 1, attempts: [] },
    ];
    const wcif = buildWcif([
      buildRound({ id: '333-r1', format: 'a', results: previousResults }),
      buildRound({ id: '333-r2', format: 'a', results: [] }),
    ]);
    const person = buildPerson({ registrantId: 1 });

    expect(getSeedResult(wcif, '333-r2', person)).toEqual({
      average: 1000,
      single: 850,
    });
  });

  it('returns undefined when no round number or format exists', () => {
    const wcif = buildWcif([buildRound({ id: '333-r1', format: undefined })]);
    const person = buildPerson({});

    expect(getSeedResult(wcif, '333', person)).toBeUndefined();
    expect(getSeedResult(wcif, '333-r1', person)).toBeUndefined();
  });
});
