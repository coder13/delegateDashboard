import reducer from '../reducer';
import { ActionType } from '../actions';
import type { Assignment } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import { buildActivity, buildPerson, buildState, buildWcif } from '../reducers/_tests_/helpers';

describe('store reducer', () => {
  it('updates assignment activity ids when editing activities', () => {
    const activity = buildActivity({ id: 1, name: 'Round 1', activityCode: '333-r1' });
    const person = buildPerson({
      assignments: [
        { activityId: 1, assignmentCode: 'competitor', stationNumber: null },
      ] as Assignment[],
    });
    const state = buildState(buildWcif([activity], [person]));

    const nextState = reducer(state, {
      type: ActionType.EDIT_ACTIVITY,
      where: { id: 1 },
      what: { id: 99, name: 'Round 1 Updated' },
    });

    const nextActivity = nextState.wcif?.schedule.venues[0].rooms[0].activities[0];
    const nextAssignment = nextState.wcif?.persons[0].assignments?.[0];

    expect(nextState.changedKeys.has('schedule')).toBe(true);
    expect(nextState.changedKeys.has('persons')).toBe(true);
    expect(nextActivity?.id).toBe(99);
    expect(nextAssignment?.activityId).toBe(99);
  });
});
