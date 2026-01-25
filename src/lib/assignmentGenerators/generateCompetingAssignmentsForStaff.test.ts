import { generateCompetingAssignmentsForStaff } from './generateCompetingAssignmentsForStaff';
import { describe, expect, it } from 'vitest';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildWcifWithEvents,
} from '../../store/reducers/_tests_/helpers';

const buildGroup = (id: number, groupNumber: number) =>
  buildActivity({
    id,
    name: `Group ${groupNumber}`,
    activityCode: `333-r1-g${groupNumber}`,
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:30:00Z',
  });

const buildCompetition = (
  groups: ReturnType<typeof buildGroup>[],
  persons: ReturnType<typeof buildPerson>[]
) => {
  const round = buildRound({ id: '333-r1' });
  const event = buildEvent({ id: '333', rounds: [round] });
  const roundActivity = buildActivity({
    id: 1,
    name: '3x3 Round 1',
    activityCode: '333-r1',
    childActivities: groups,
  });

  return buildWcifWithEvents([roundActivity], [event], persons);
};

const staff = (registrantId: number, activityId: number) =>
  buildPerson({
    registrantId,
    name: `Staff ${registrantId}`,
    wcaUserId: registrantId,
    assignments: [{ activityId, assignmentCode: 'staff-judge', stationNumber: null }],
    registration: {
      status: 'accepted',
      eventIds: ['333'],
      isCompeting: true,
      comments: undefined,
      wcaRegistrationId: registrantId,
    },
  });

describe('generateCompetingAssignmentsForStaff', () => {
  it('assigns staff to the previous group for competing', () => {
    const groups = [buildGroup(11, 1), buildGroup(12, 2), buildGroup(13, 3)];
    const persons = [staff(1, 12)];
    const wcif = buildCompetition(groups, persons);
    const generator = generateCompetingAssignmentsForStaff(wcif, '333-r1');

    const assignments = generator ? generator() : [];

    expect(assignments).toEqual([
      {
        registrantId: 1,
        assignment: { assignmentCode: 'competitor', activityId: 11, stationNumber: null },
      },
    ]);
  });

  it('returns undefined when no staff have eligible assignments', () => {
    const groups = [buildGroup(11, 1), buildGroup(12, 2)];
    const persons = [
      buildPerson({
        registrantId: 1,
        name: 'Competitor 1',
        registration: {
          status: 'accepted',
          eventIds: ['333'],
          isCompeting: true,
          comments: undefined,
          wcaRegistrationId: 1,
        },
      }),
    ];
    const wcif = buildCompetition(groups, persons);

    const generator = generateCompetingAssignmentsForStaff(wcif, '333-r1');

    expect(generator).toBeUndefined();
  });

  it('skips staff when no valid previous group can be computed', () => {
    const oddGroup = buildActivity({
      id: 11,
      name: 'Odd Group',
      activityCode: '333-r1',
    });
    const round = buildRound({ id: '333-r1' });
    const event = buildEvent({ id: '333', rounds: [round] });
    const roundActivity = buildActivity({
      id: 1,
      name: '3x3 Round 1',
      activityCode: '333-r1',
      childActivities: [oddGroup],
    });
    const person = staff(1, 11);
    const wcif = buildWcifWithEvents([roundActivity], [event], [person]);

    const generator = generateCompetingAssignmentsForStaff(wcif, '333-r1');
    const assignments = generator ? generator() : [];

    expect(assignments).toEqual([]);
  });

  it('returns undefined when the round is missing', () => {
    const round = buildRound({ id: '333-r2' });
    const event = buildEvent({ id: '333', rounds: [round] });
    const wcif = buildWcifWithEvents([], [event], []);

    const generator = generateCompetingAssignmentsForStaff(wcif, '333-r1');

    expect(generator).toBeUndefined();
  });
});
