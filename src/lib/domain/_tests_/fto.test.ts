import { describe, expect, it } from 'vitest';
import {
  activityCodeToName as helperActivityName,
  getEventName,
  getEventResultType,
  type EventId,
} from '@wca/helpers';
import { createGroupActivity as generatorGroupActivity } from 'wca-group-generators';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildWcifWithEvents,
} from '../../../store/reducers/_tests_/helpers';
import { events, eventNameById, shortEventNameById, sortWcifEvents } from '../events';
import { activityCodeToName, hasDistributedAttempts, parseActivityCode } from '../activities';
import { personsRegistered, personsShouldBeInRound } from '../persons';
import { generateCompetingGroupActitivitesForEveryone } from '../../assignmentGenerators/generateCompetingGroupActitivitesForEveryone';
import { generateJudgeAssignmentsFromCompetingAssignments } from '../../assignmentGenerators/generateJudgeAssignmentsFromCompetingAssignments';
import {
  determineMissingGroupActivities,
  generateAssignments,
  generateMissingGroupActivities,
  upsertCompetitorAssignments,
  validate,
} from '../../importExport/import';
import { formatSeedResult } from '../../../dialogs/ConfigureAssignmentsDialog/formatSeedResult';

const eventId: EventId = 'fto';
const round = buildRound({ id: 'fto-r1' });
const event = buildEvent({ id: eventId, rounds: [round] });
const registered = (
  registrantId: number,
  status: 'accepted' | 'pending' = 'accepted',
  eventIds: EventId[] = [eventId]
) =>
  buildPerson({
    registrantId,
    email: `${registrantId}@example.com`,
    registration: {
      wcaRegistrationId: registrantId,
      status,
      eventIds,
      isCompeting: true,
    },
  });

const buildFtoWcif = () =>
  buildWcifWithEvents(
    [
      buildActivity({
        activityCode: 'fto-r1',
        childActivities: [
          buildActivity({ id: 2, activityCode: 'fto-r1-g1' }),
          buildActivity({ id: 3, activityCode: 'fto-r1-g2' }),
        ],
      }),
    ],
    [event],
    [registered(1), registered(2), registered(3, 'pending'), registered(4, 'accepted', ['333'])]
  );

describe('official FTO workflow', () => {
  it('uses the official ID, names, time results and deterministic event order', () => {
    expect(events.filter(({ id }) => id === eventId)).toHaveLength(1);
    expect(eventNameById(eventId)).toBe('Face-Turning Octahedron');
    expect(shortEventNameById(eventId)).toBe('FTO');
    expect(getEventName(eventId)).toBe(eventNameById(eventId));
    expect(getEventResultType(eventId)).toBe('time');
    expect(
      sortWcifEvents([event, buildEvent(), buildEvent({ id: 'clock' })]).map(({ id }) => id)
    ).toEqual(['333', 'clock', 'fto']);
    expect(formatSeedResult(eventId, 'average', 1234)).toBe('12.34');
    expect(formatSeedResult(eventId, 'single', -1)).toBe('DNF');
    expect(formatSeedResult(eventId, 'average')).toBe('-');
  });

  it('names and creates ordinary round/group activities in both helper implementations', () => {
    expect(parseActivityCode('fto-r1-g2')).toMatchObject({
      eventId,
      roundNumber: 1,
      groupNumber: 2,
    });
    expect(hasDistributedAttempts('fto-r1')).toBe(false);
    expect(activityCodeToName('fto-r1-g2')).toBe('Face-Turning Octahedron, Round 1, Group 2');
    expect(helperActivityName('fto-r1-g2')).toBe(activityCodeToName('fto-r1-g2'));
    const activity = generatorGroupActivity(
      2,
      buildActivity({ activityCode: 'fto-r1' }),
      1,
      null,
      null
    );
    expect(activity).toMatchObject({
      activityCode: 'fto-r1-g1',
      name: 'Face-Turning Octahedron, Round 1, Group 1',
    });
  });

  it('generates competing and judging assignments only for accepted FTO registrants', () => {
    const wcif = buildFtoWcif();
    expect(personsRegistered(wcif.persons, eventId).map((p) => p.registrantId)).toEqual([1, 2]);
    expect(personsShouldBeInRound(round)(wcif.persons).map((p) => p.registrantId)).toEqual([1, 2]);
    expect(personsShouldBeInRound(buildRound({ id: 'fto-r2' }))(wcif.persons)).toEqual([]);
    const competing = generateCompetingGroupActitivitesForEveryone(wcif, round.id)!([]);
    expect(competing).toHaveLength(2);
    expect(competing.map((a) => a.registrantId).sort()).toEqual([1, 2]);
    expect(new Set(competing.map((a) => a.assignment.activityId))).toEqual(new Set([2, 3]));
    const judging = generateJudgeAssignmentsFromCompetingAssignments(wcif, round.id)!(competing);
    expect(judging).toHaveLength(2);
    for (const assignment of judging) {
      expect(assignment.assignment.assignmentCode).toBe('staff-judge');
      expect(assignment.assignment.activityId).not.toBe(
        competing.find((a) => a.registrantId === assignment.registrantId)!.assignment.activityId
      );
    }
  });

  it('imports official FTO competitor and staff columns and creates missing groups', () => {
    const wcif = buildWcifWithEvents(
      [buildActivity({ activityCode: 'fto-r1' })],
      [event],
      [registered(1)]
    );
    const data = {
      meta: { fields: ['email', 'fto', 'fto-staff'] },
      data: [{ email: '1@example.com', fto: '1', 'fto-staff': 'S2' }],
    };
    expect(validate(wcif)(data).every((check) => check.passed)).toBe(true);
    const assignments = generateAssignments(wcif, data);
    expect(assignments.map((a) => a.activityCode)).toEqual(['fto-r1-g1', 'fto-r1-g2']);
    const missing = determineMissingGroupActivities(wcif, assignments);
    const withGroups = generateMissingGroupActivities(wcif, missing);
    const updated = upsertCompetitorAssignments(withGroups, assignments);
    expect(updated.persons[0].assignments?.map((a) => a.assignmentCode).sort()).toEqual([
      'competitor',
      'staff-scrambler',
    ]);
    expect(
      updated.schedule.venues[0].rooms[0].activities[0].childActivities.map((a) => a.name)
    ).toEqual([
      'Face-Turning Octahedron, Round 1, Group 1',
      'Face-Turning Octahedron, Round 1, Group 2',
    ]);
  });
});
