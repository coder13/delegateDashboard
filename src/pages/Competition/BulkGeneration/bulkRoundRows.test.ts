import {
  buildBulkRoundRows,
  defaultSelectedRoundIds,
  mergeRoundOrder,
  scheduleOrderedRoundIds,
} from './bulkRoundRows';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildWcifWithEvents,
} from '../../../store/reducers/_tests_/helpers';
import type { AssignmentCode, Competition, EventId } from '@wca/helpers';
import { describe, expect, it } from 'vitest';

const assignment = (activityId: number, assignmentCode: AssignmentCode) => ({
  activityId,
  assignmentCode,
  stationNumber: null,
});

const registration = (registrantId: number, eventIds: EventId[]) => ({
  status: 'accepted' as const,
  eventIds,
  isCompeting: true,
  comments: undefined,
  wcaRegistrationId: registrantId,
});

const buildCompetition = (): Competition => {
  const round333 = buildActivity({
    id: 1,
    activityCode: '333-r1',
    startTime: '2024-01-01T11:00:00Z',
    endTime: '2024-01-01T11:30:00Z',
    childActivities: [
      buildActivity({ id: 101, activityCode: '333-r1-g1' }),
      buildActivity({ id: 102, activityCode: '333-r1-g2' }),
    ],
  });
  const round333Second = buildActivity({
    id: 2,
    activityCode: '333-r2',
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T10:30:00Z',
    childActivities: [buildActivity({ id: 201, activityCode: '333-r2-g1' })],
  });
  const distributedRound = buildActivity({
    id: 3,
    activityCode: '333fm-r1',
    childActivities: [],
  });

  return buildWcifWithEvents(
    [round333, round333Second, distributedRound],
    [
      buildEvent({
        id: '333',
        rounds: [
          buildRound({ id: '333-r1' }),
          buildRound({
            id: '333-r2',
            results: [{ personId: 1, ranking: 1, attempts: [], best: 0, average: 0 }],
          }),
        ],
      }),
      buildEvent({
        id: '333fm' as EventId,
        rounds: [buildRound({ id: '333fm-r1' })],
      }),
    ],
    [
      buildPerson({
        registrantId: 1,
        registration: registration(1, ['333' as EventId]),
        assignments: [assignment(101, 'competitor'), assignment(102, 'staff-judge')],
      }),
      buildPerson({
        registrantId: 2,
        registration: registration(2, ['333' as EventId]),
        assignments: [assignment(201, 'competitor')],
      }),
    ]
  );
};

describe('bulkRoundRows', () => {
  it('builds normal non-distributed round review rows', () => {
    const rows = buildBulkRoundRows(buildCompetition());

    expect(rows.map((row) => row.roundId)).toEqual(['333-r1', '333-r2']);
    expect(rows[0]).toMatchObject({
      label: '333 Round 1',
      roundSize: 2,
      existingGroupCount: 2,
      competitorAssignmentCount: 1,
      staffAssignmentCount: 1,
      warnings: [],
      selectable: true,
    });
    expect(rows[1]).toMatchObject({
      roundSize: 1,
      selectable: true,
    });
    expect(defaultSelectedRoundIds(rows)).toEqual(new Set(['333-r1']));
  });

  it('orders rows by schedule and merges persisted order with current rounds', () => {
    const rows = buildBulkRoundRows(buildCompetition());

    expect(scheduleOrderedRoundIds(rows)).toEqual(['333-r2', '333-r1']);
    expect(mergeRoundOrder(['333-r2', '333-r1', '222-r1'], ['333-r1', 'stale-r1'])).toEqual([
      '333-r1',
      '333-r2',
      '222-r1',
    ]);
  });
});
