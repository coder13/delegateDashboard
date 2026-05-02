import { buildCopyRoundAssignments } from './dualRoundAssignments';
import { buildActivity, buildPerson, buildWcifWithEvents, buildEvent, buildRound } from '../../../../store/reducers/_tests_/helpers';
import { describe, expect, it } from 'vitest';

describe('buildCopyRoundAssignments', () => {
  it('copies assignments from one linked round to another by room and group number', () => {
    const round1 = buildActivity({
      id: 100,
      activityCode: 'clock-r1',
      childActivities: [
        buildActivity({ id: 101, activityCode: 'clock-r1-g1', childActivities: [] }),
        buildActivity({ id: 102, activityCode: 'clock-r1-g2', childActivities: [] }),
      ],
    });
    const round2 = buildActivity({
      id: 200,
      activityCode: 'clock-r2',
      childActivities: [
        buildActivity({ id: 201, activityCode: 'clock-r2-g1', childActivities: [] }),
        buildActivity({ id: 202, activityCode: 'clock-r2-g2', childActivities: [] }),
      ],
    });
    const person = buildPerson({
      registrantId: 7,
      assignments: [
        { activityId: 101, assignmentCode: 'competitor', stationNumber: 3 },
        { activityId: 102, assignmentCode: 'staff-judge', stationNumber: null },
      ],
    });

    const wcif = buildWcifWithEvents(
      [round1, round2],
      [
        buildEvent({ id: 'clock', rounds: [buildRound({ id: 'clock-r1' }), buildRound({ id: 'clock-r2' })] }),
      ],
      [person]
    );

    const result = buildCopyRoundAssignments(wcif, 'clock-r1', 'clock-r2');

    expect(result.targetActivityIds).toEqual([201, 202]);
    expect(result.copiedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(result.assignments).toEqual([
      {
        registrantId: 7,
        assignment: { activityId: 201, assignmentCode: 'competitor', stationNumber: 3 },
      },
      {
        registrantId: 7,
        assignment: { activityId: 202, assignmentCode: 'staff-judge', stationNumber: null },
      },
    ]);
  });
});
