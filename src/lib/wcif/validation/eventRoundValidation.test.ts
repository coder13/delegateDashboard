import {
  validateEventHasRounds,
  validateAdvancementConditions,
  validateRoundsHaveScheduleActivities,
  validateEventRounds,
} from './eventRoundValidation';
import {
  MISSING_ADVANCEMENT_CONDITION,
  NO_ROUNDS_FOR_ACTIVITY,
  NO_SCHEDULE_ACTIVITIES_FOR_ROUND,
} from './types';
import type { Competition, Event } from '@wca/helpers';
import { describe, it, expect } from 'vitest';

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
    venues: [],
  },
  series: [],
  competitorLimit: 100,
  extensions: [],
  registrationInfo: {
    openTime: '2024-01-01T00:00:00Z',
    closeTime: '2024-01-02T00:00:00Z',
    baseEntryFee: 0,
    currencyCode: 'USD',
    onTheSpotRegistration: false,
    useWcaRegistration: false,
  },
};

describe('validateEventHasRounds', () => {
  it('should return error when event has no rounds', () => {
    const event: Event = {
      id: '333',
      rounds: [],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const error = validateEventHasRounds(event);

    expect(error).not.toBeNull();
    expect(error?.type).toBe(NO_ROUNDS_FOR_ACTIVITY);
    expect(error?.message).toContain('No rounds specified');
    expect(error?.data.eventId).toBe('333');
  });

  it('should return null when event has rounds', () => {
    const event: Event = {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const error = validateEventHasRounds(event);

    expect(error).toBeNull();
  });
});

describe('validateAdvancementConditions', () => {
  it('should return errors for non-final rounds without advancement conditions', () => {
    const event: Event = {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null, // Missing!
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
        {
          id: '333-r2',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null, // This is final, so OK
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const errors = validateAdvancementConditions(event);

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(MISSING_ADVANCEMENT_CONDITION);
    expect(errors[0].message).toContain('Round 1');
    expect(errors[0].data.activityCode).toBe('333-r1');
  });

  it('should return no errors when all non-final rounds have advancement conditions', () => {
    const event: Event = {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: { type: 'ranking', level: 12 },
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
        {
          id: '333-r2',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const errors = validateAdvancementConditions(event);

    expect(errors).toHaveLength(0);
  });

  it('should accept v2 linked-round advancement derived from a later round participation ruleset', () => {
    const event: Event = {
      id: 'clock',
      rounds: [
        {
          id: 'clock-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 2,
          linkedRounds: ['clock-r1', 'clock-r2'],
          participationRuleset: {
            participationSource: {
              type: 'registrations',
            },
            reservedPlaces: null,
          },
          extensions: [],
        },
        {
          id: 'clock-r2',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 2,
          linkedRounds: ['clock-r1', 'clock-r2'],
          participationRuleset: {
            participationSource: {
              type: 'registrations',
            },
            reservedPlaces: null,
          },
          extensions: [],
        },
        {
          id: 'clock-r3',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 2,
          linkedRounds: null,
          participationRuleset: {
            participationSource: {
              type: 'linkedRounds',
              roundIds: ['clock-r1', 'clock-r2'],
              resultCondition: {
                type: 'percent',
                scope: 'average',
                value: 75,
              },
            },
            reservedPlaces: null,
          },
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const errors = validateAdvancementConditions(event);

    expect(errors).toHaveLength(0);
  });

  it('should return no errors for event with single round', () => {
    const event: Event = {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const errors = validateAdvancementConditions(event);

    expect(errors).toHaveLength(0);
  });
});

describe('validateRoundsHaveScheduleActivities', () => {
  it('should return errors when rounds have no schedule activities', () => {
    const event: Event = {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const wcif: Competition = {
      ...mockWcif,
      events: [event],
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
                activities: [], // No activities
                extensions: [],
              },
            ],
            extensions: [],
          },
        ],
      },
    };

    const errors = validateRoundsHaveScheduleActivities(wcif, event);

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(NO_SCHEDULE_ACTIVITIES_FOR_ROUND);
    expect(errors[0].data.activityCode).toBe('333-r1');
  });

  it('should return no errors when rounds have schedule activities', () => {
    const event: Event = {
      id: '333',
      rounds: [
        {
          id: '333-r1',
          format: 'a',
          timeLimit: null,
          cutoff: null,
          advancementCondition: null,
          results: [],
          scrambleSetCount: 1,
          extensions: [],
        },
      ],
      competitorLimit: null,
      qualification: null,
      extensions: [],
    };

    const wcif: Competition = {
      ...mockWcif,
      events: [event],
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
                ],
                extensions: [],
              },
            ],
            extensions: [],
          },
        ],
      },
    };

    const errors = validateRoundsHaveScheduleActivities(wcif, event);

    expect(errors).toHaveLength(0);
  });
});

describe('validateEventRounds', () => {
  it('should return all event and round validation errors', () => {
    const wcif: Competition = {
      ...mockWcif,
      events: [
        {
          id: '333',
          rounds: [],
          competitorLimit: null,
          qualification: null,
          extensions: [],
        },
        {
          id: '222',
          rounds: [
            {
              id: '222-r1',
              format: 'a',
              timeLimit: null,
              cutoff: null,
              advancementCondition: null,
              results: [],
              scrambleSetCount: 1,
              extensions: [],
            },
            {
              id: '222-r2',
              format: 'a',
              timeLimit: null,
              cutoff: null,
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
      schedule: {
        startDate: '2024-01-01',
        numberOfDays: 1,
        venues: [],
      },
    };

    const errors = validateEventRounds(wcif);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.type === NO_ROUNDS_FOR_ACTIVITY)).toBe(true);
    expect(errors.some((e) => e.type === MISSING_ADVANCEMENT_CONDITION)).toBe(true);
  });
});
