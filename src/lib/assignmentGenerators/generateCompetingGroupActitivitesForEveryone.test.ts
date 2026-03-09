import { generateCompetingGroupActitivitesForEveryone } from './generateCompetingGroupActitivitesForEveryone';
import type { Assignment } from '@wca/helpers';
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

const competitor = (registrantId: number, assignments: Assignment[] = []) =>
  buildPerson({
    registrantId,
    name: `Competitor ${registrantId}`,
    wcaUserId: registrantId,
    assignments,
    registration: {
      status: 'accepted',
      eventIds: ['333'],
      isCompeting: true,
      comments: undefined,
      wcaRegistrationId: registrantId,
    },
  });

describe('generateCompetingGroupActitivitesForEveryone', () => {
  it('assigns competitors to the smallest available groups', () => {
    const groups = [buildGroup(10, 1), buildGroup(11, 2)];
    const persons = [competitor(1), competitor(2), competitor(3)];
    const wcif = buildCompetition(groups, persons);
    const generator = generateCompetingGroupActitivitesForEveryone(wcif, '333-r1');

    const assignments = generator ? generator([]) : [];

    expect(assignments).toHaveLength(3);
    const assignedIds = assignments.map((a) => a.assignment.activityId).sort();
    expect(assignedIds).toEqual([10, 10, 11]);
  });

  it('skips competitors who already have a competitor assignment', () => {
    const groups = [buildGroup(20, 1), buildGroup(21, 2)];
    const persons = [
      competitor(1),
      competitor(2),
      competitor(3, [{ activityId: 20, assignmentCode: 'competitor', stationNumber: null }]),
    ];
    const wcif = buildCompetition(groups, persons);
    const generator = generateCompetingGroupActitivitesForEveryone(wcif, '333-r1');

    const assignments = generator ? generator([]) : [];

    expect(assignments).toHaveLength(2);
    expect(assignments.map((a) => a.registrantId).sort()).toEqual([1, 2]);
  });

  it('returns undefined when the event or round is missing', () => {
    const groups = [buildGroup(10, 1)];
    const persons = [competitor(1)];
    const round = buildRound({ id: '333-r2' });
    const event = buildEvent({ id: '333', rounds: [round] });
    const roundActivity = buildActivity({
      id: 1,
      name: '3x3 Round 2',
      activityCode: '333-r2',
      childActivities: groups,
    });
    const wcif = buildWcifWithEvents([roundActivity], [event], persons);

    const generator = generateCompetingGroupActitivitesForEveryone(wcif, '333-r1');

    expect(generator).toBeUndefined();
  });

  it('throws when no groups exist for the round', () => {
    const groups: ReturnType<typeof buildGroup>[] = [];
    const persons = [competitor(1), competitor(2)];
    const wcif = buildCompetition(groups, persons);
    const generator = generateCompetingGroupActitivitesForEveryone(wcif, '333-r1');

    expect(generator).toBeDefined();
    expect(() => generator?.([])).toThrow('No groups found!');
  });
});
