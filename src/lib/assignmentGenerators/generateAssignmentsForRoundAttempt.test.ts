import { generateAssignmentsForRoundAttempt } from './generateAssignmentsForRoundAttempt';
import type { Assignment } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildWcifWithEvents,
} from '../../store/reducers/_tests_/helpers';

const buildAttemptActivity = (id: number, attemptNumber: number) =>
  buildActivity({
    id,
    name: `Attempt ${attemptNumber}`,
    activityCode: `333fm-r1-a${attemptNumber}`,
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T11:00:00Z',
  });

const buildCompetition = (
  attemptActivities: ReturnType<typeof buildAttemptActivity>[],
  persons: ReturnType<typeof buildPerson>[]
) => {
  const round = buildRound({ id: '333fm-r1', format: '3' });
  const event = buildEvent({ id: '333fm', rounds: [round] });
  const roundActivity = buildActivity({
    id: 1,
    name: '3x3 Fewest Moves Round 1',
    activityCode: '333fm-r1',
    childActivities: attemptActivities,
  });

  return buildWcifWithEvents([roundActivity], [event], persons);
};

const competitor = (registrantId: number, assignments: Assignment[] = []) =>
  buildPerson({
    registrantId,
    name: `Competitor ${registrantId}`,
    wcaUserId: registrantId,
    assignments,
    registration: {
      status: 'accepted',
      eventIds: ['333fm'],
      isCompeting: true,
      comments: undefined,
      wcaRegistrationId: registrantId,
    },
  });

describe('generateAssignmentsForRoundAttempt', () => {
  it('assigns all competitors directly to the attempt activity', () => {
    const attemptActivities = [buildAttemptActivity(10, 1)];
    const persons = [competitor(1), competitor(2), competitor(3)];
    const wcif = buildCompetition(attemptActivities, persons);
    const generator = generateAssignmentsForRoundAttempt(wcif, '333fm-r1-a1');

    const assignments = generator ? generator([]) : [];

    expect(assignments).toHaveLength(3);
    expect(assignments.every((a) => a.assignment.activityId === 10)).toBe(true);
    expect(assignments.every((a) => a.assignment.assignmentCode === 'competitor')).toBe(true);
    expect(assignments.map((a) => a.registrantId).sort()).toEqual([1, 2, 3]);
  });

  it('distributes competitors across multiple attempt activities (multi-room)', () => {
    // Two rooms, each with attempt 1
    const round = buildRound({ id: '333fm-r1', format: '3' });
    const event = buildEvent({ id: '333fm', rounds: [round] });
    const attempt1Room1 = buildAttemptActivity(10, 1);
    const attempt1Room2 = buildAttemptActivity(11, 1);
    const roundActivity1 = buildActivity({
      id: 1,
      name: '3x3 Fewest Moves Round 1',
      activityCode: '333fm-r1',
      childActivities: [attempt1Room1],
    });
    const roundActivity2 = buildActivity({
      id: 2,
      name: '3x3 Fewest Moves Round 1',
      activityCode: '333fm-r1',
      childActivities: [attempt1Room2],
    });
    const persons = [competitor(1), competitor(2), competitor(3), competitor(4)];

    const wcif = {
      ...buildWcifWithEvents([roundActivity1], [event], persons),
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
            rooms: [
              {
                id: 10,
                name: 'Room A',
                color: '#000',
                extensions: [],
                activities: [roundActivity1],
              },
              {
                id: 11,
                name: 'Room B',
                color: '#000',
                extensions: [],
                activities: [roundActivity2],
              },
            ],
          },
        ],
      },
    };

    const generator = generateAssignmentsForRoundAttempt(wcif, '333fm-r1-a1');
    const assignments = generator ? generator([]) : [];

    expect(assignments).toHaveLength(4);
    // Should be distributed: 2 to each room's attempt activity
    const countRoom1 = assignments.filter((a) => a.assignment.activityId === 10).length;
    const countRoom2 = assignments.filter((a) => a.assignment.activityId === 11).length;
    expect(countRoom1).toBe(2);
    expect(countRoom2).toBe(2);
  });

  it('skips competitors who already have a competitor assignment to the attempt', () => {
    const attemptActivities = [buildAttemptActivity(10, 1)];
    const persons = [
      competitor(1),
      competitor(2),
      competitor(3, [{ activityId: 10, assignmentCode: 'competitor', stationNumber: null }]),
    ];
    const wcif = buildCompetition(attemptActivities, persons);
    const generator = generateAssignmentsForRoundAttempt(wcif, '333fm-r1-a1');

    const assignments = generator ? generator([]) : [];

    expect(assignments).toHaveLength(2);
    expect(assignments.map((a) => a.registrantId).sort()).toEqual([1, 2]);
  });

  it('returns undefined when the round is missing', () => {
    const round = buildRound({ id: '333fm-r2', format: '3' });
    const event = buildEvent({ id: '333fm', rounds: [round] });
    const attemptActivity = buildAttemptActivity(10, 1);
    const roundActivity = buildActivity({
      id: 1,
      activityCode: '333fm-r2',
      childActivities: [attemptActivity],
    });
    const wcif = buildWcifWithEvents([roundActivity], [event], [competitor(1)]);

    const generator = generateAssignmentsForRoundAttempt(wcif, '333fm-r1-a1');

    expect(generator).toBeUndefined();
  });

  it('returns undefined when no attempt activities are found in the schedule', () => {
    // The round exists but there are no attempt activities in the schedule
    const round = buildRound({ id: '333fm-r1', format: '3' });
    const event = buildEvent({ id: '333fm', rounds: [round] });
    const roundActivity = buildActivity({
      id: 1,
      activityCode: '333fm-r1',
      childActivities: [],
    });
    const wcif = buildWcifWithEvents([roundActivity], [event], [competitor(1)]);

    const generator = generateAssignmentsForRoundAttempt(wcif, '333fm-r1-a1');

    expect(generator).toBeUndefined();
  });

  it('works for 333mbf', () => {
    const round = buildRound({ id: '333mbf-r1', format: '3' });
    const event = buildEvent({ id: '333mbf', rounds: [round] });
    const attemptActivity = buildActivity({
      id: 20,
      activityCode: '333mbf-r1-a1',
      name: 'Multi-Blind Round 1 Attempt 1',
    });
    const roundActivity = buildActivity({
      id: 1,
      activityCode: '333mbf-r1',
      childActivities: [attemptActivity],
    });
    const persons = [
      buildPerson({
        registrantId: 1,
        registration: {
          status: 'accepted',
          eventIds: ['333mbf'],
          isCompeting: true,
          comments: undefined,
          wcaRegistrationId: 1,
        },
      }),
    ];
    const wcif = buildWcifWithEvents([roundActivity], [event], persons);

    const generator = generateAssignmentsForRoundAttempt(wcif, '333mbf-r1-a1');
    const assignments = generator ? generator([]) : [];

    expect(assignments).toHaveLength(1);
    expect(assignments[0].assignment.activityId).toBe(20);
    expect(assignments[0].assignment.assignmentCode).toBe('competitor');
  });
});
