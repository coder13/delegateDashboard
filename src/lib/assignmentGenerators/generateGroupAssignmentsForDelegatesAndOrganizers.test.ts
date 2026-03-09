import { generateGroupAssignmentsForDelegatesAndOrganizers } from './generateGroupAssignmentsForDelegatesAndOrganizers';
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

const organizer = (registrantId: number, name: string) =>
  buildPerson({
    registrantId,
    name,
    wcaUserId: registrantId,
    roles: ['organizer'],
    registration: {
      status: 'accepted',
      eventIds: ['333'],
      isCompeting: true,
      comments: undefined,
      wcaRegistrationId: registrantId,
    },
  });

describe('generateGroupAssignmentsForDelegatesAndOrganizers', () => {
  it('assigns organizers to the latest groups first', () => {
    const groups = [buildGroup(31, 1), buildGroup(32, 2), buildGroup(33, 3)];
    const persons = [organizer(1, 'Alice'), organizer(2, 'Bob')];
    const wcif = buildCompetition(groups, persons);
    const generator = generateGroupAssignmentsForDelegatesAndOrganizers(wcif, '333-r1');

    const assignments = generator ? generator([]) : [];

    expect(assignments).toEqual([
      {
        registrantId: 1,
        assignment: { assignmentCode: 'competitor', activityId: 33, stationNumber: null },
      },
      {
        registrantId: 2,
        assignment: { assignmentCode: 'competitor', activityId: 32, stationNumber: null },
      },
    ]);
  });

  it('returns undefined when the round cannot be found', () => {
    const groups = [buildGroup(31, 1)];
    const persons = [organizer(1, 'Alice')];
    const round = buildRound({ id: '333-r2' });
    const event = buildEvent({ id: '333', rounds: [round] });
    const roundActivity = buildActivity({
      id: 1,
      name: '3x3 Round 2',
      activityCode: '333-r2',
      childActivities: groups,
    });
    const wcif = buildWcifWithEvents([roundActivity], [event], persons);

    const generator = generateGroupAssignmentsForDelegatesAndOrganizers(wcif, '333-r1');

    expect(generator).toBeUndefined();
  });

  it('keeps assignments unchanged when no delegates or organizers are eligible', () => {
    const groups = [buildGroup(31, 1)];
    const persons = [
      buildPerson({
        registrantId: 1,
        name: 'Competitor 1',
        roles: [],
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
    const generator = generateGroupAssignmentsForDelegatesAndOrganizers(wcif, '333-r1');

    const existingAssignments = [
      {
        registrantId: 99,
        assignment: { assignmentCode: 'competitor', activityId: 31, stationNumber: null },
      },
    ];

    const assignments = generator ? generator(existingAssignments) : [];

    expect(assignments).toBe(existingAssignments);
  });
});
