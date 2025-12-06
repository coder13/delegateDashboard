import { describe, it, expect } from 'vitest';
import type { Competition } from '@wca/helpers';
import { validateWcif } from './index';
import {
  MISSING_ADVANCEMENT_CONDITION,
  NO_ROUNDS_FOR_ACTIVITY,
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
    venues: [],
  },
  competitorLimit: 100,
  extensions: [],
};

describe('validateWcif', () => {
  it('should return empty array for valid WCIF', () => {
    const wcif: Competition = {
      ...mockWcif,
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
      persons: [
        {
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
          assignments: [
            {
              activityId: 1,
              stationNumber: null,
              assignmentCode: 'competitor',
            },
          ],
          personalBests: [],
          extensions: [],
        },
      ],
    };

    const errors = validateWcif(wcif);

    expect(errors).toHaveLength(0);
  });

  it('should detect multiple types of errors', () => {
    const wcif: Competition = {
      ...mockWcif,
      events: [
        {
          // Event with no rounds
          id: '333',
          rounds: [],
          competitorLimit: null,
          qualification: null,
          extensions: [],
        },
        {
          // Event with missing advancement condition
          id: '222',
          rounds: [
            {
              id: '222-r1',
              format: 'a',
              timeLimit: null,
              cutoff: null,
              advancementCondition: null, // Missing!
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
                    name: '2x2 Round 1',
                    activityCode: '222-r1',
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
      persons: [
        {
          registrantId: 1,
          name: 'Person with Bad Assignment',
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
            eventIds: ['222'],
            status: 'accepted',
            guests: 0,
            comments: '',
            isCompeting: true,
          },
          assignments: [
            {
              activityId: 999, // Non-existent activity
              stationNumber: null,
              assignmentCode: 'competitor',
            },
          ],
          personalBests: [],
          extensions: [],
        },
      ],
    };

    const errors = validateWcif(wcif);

    expect(errors.length).toBeGreaterThan(0);
    
    // Check for event errors
    const noRoundsErrors = errors.filter((e) => e.type === NO_ROUNDS_FOR_ACTIVITY);
    expect(noRoundsErrors.length).toBeGreaterThan(0);
    
    // Check for advancement condition errors
    const advancementErrors = errors.filter((e) => e.type === MISSING_ADVANCEMENT_CONDITION);
    expect(advancementErrors.length).toBeGreaterThan(0);
    
    // Check for person assignment errors
    const assignmentErrors = errors.filter(
      (e) => e.type === MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT
    );
    expect(assignmentErrors.length).toBeGreaterThan(0);
  });

  it('should detect schedule conflicts', () => {
    const wcif: Competition = {
      ...mockWcif,
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
                    name: 'Activity 1',
                    activityCode: '333-r1',
                    startTime: '2024-01-01T09:00:00.000Z',
                    endTime: '2024-01-01T10:00:00.000Z',
                    childActivities: [],
                    extensions: [],
                  },
                  {
                    id: 2,
                    name: 'Activity 2',
                    activityCode: '333-r1',
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
      persons: [
        {
          registrantId: 1,
          name: 'Person with Conflicts',
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
          personalBests: [],
          extensions: [],
        },
      ],
    };

    const errors = validateWcif(wcif);

    const conflictErrors = errors.filter((e) => e.type === PERSON_ASSIGNMENT_SCHEDULE_CONFLICT);
    expect(conflictErrors.length).toBeGreaterThan(0);
  });

  it('should filter out falsy values', () => {
    const wcif: Competition = {
      ...mockWcif,
      events: [],
      persons: [],
    };

    const errors = validateWcif(wcif);

    // Should not contain null, undefined, or false values
    errors.forEach((error) => {
      expect(error).toBeTruthy();
      expect(error).toHaveProperty('type');
      expect(error).toHaveProperty('key');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('data');
    });
  });
});
