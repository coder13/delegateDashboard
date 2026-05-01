import { updateRoundActivities, updateRoundChildActivities } from './../roundActivities';
import type { Assignment } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import { buildActivity, buildPerson, buildState, buildWcif } from './helpers';

describe('roundActivities reducers', () => {
  it('updateRoundActivities returns original state when wcif is missing', () => {
    const state = buildState(null);
    const nextState = updateRoundActivities(state, { activities: [] });

    expect(nextState).toBe(state);
  });

  it('updateRoundActivities updates matching activities and marks schedule as changed', () => {
    const activityOne = buildActivity({ id: 1, name: 'Round 1', activityCode: '333-r1' });
    const activityTwo = buildActivity({ id: 2, name: 'Round 2', activityCode: '333-r2' });
    const updatedActivityTwo = { ...activityTwo, name: 'Round 2 Updated' };
    const state = buildState(buildWcif([activityOne, activityTwo]));

    const nextState = updateRoundActivities(state, { activities: [updatedActivityTwo] });

    const nextActivities = nextState.wcif?.schedule.venues[0].rooms[0].activities ?? [];
    expect(nextState.needToSave).toBe(true);
    expect(nextState.changedKeys.has('schedule')).toBe(true);
    expect(nextActivities[0]).toBe(activityOne);
    expect(nextActivities[1]).toEqual(updatedActivityTwo);
  });

  it('updateRoundActivities strips extraneous properties (e.g. room) from stored activities', () => {
    const activityOne = buildActivity({ id: 1, name: 'Round 1', activityCode: '333-r1' });
    const room = { id: 10, name: 'Room A', color: '#000', extensions: [], activities: [activityOne] };
    // Simulate ActivityWithRoom: an activity with an extra `room` reference attached internally
    const activityWithRoom = { ...activityOne, name: 'Round 1 Updated', room };
    const state = buildState(buildWcif([activityOne]));

    const nextState = updateRoundActivities(state, { activities: [activityWithRoom] });

    const nextActivity = nextState.wcif?.schedule.venues[0].rooms[0].activities[0];
    expect(nextActivity).not.toHaveProperty('room');
    expect(nextActivity).toEqual(expect.objectContaining({ id: 1, name: 'Round 1 Updated' }));
  });

  it('updateRoundChildActivities updates child activities and keeps other assignments intact', () => {
    const parentActivity = buildActivity({ id: 10, name: 'Round 1', activityCode: '333-r1' });
    const childActivity = buildActivity({ id: 99, name: 'Group 1', activityCode: '333-r1-g1' });
    const unrelatedAssignment: Assignment = {
      activityId: 42,
      assignmentCode: 'competitor',
      stationNumber: null,
    };
    const person = buildPerson({
      registrantId: 1,
      assignments: [unrelatedAssignment],
      registration: {
        status: 'accepted',
        eventIds: [],
        isCompeting: true,
        comments: undefined,
        wcaRegistrationId: 1,
      },
    });
    const state = buildState(buildWcif([parentActivity], [person]));

    const nextState = updateRoundChildActivities(state, {
      activityId: parentActivity.id,
      childActivities: [childActivity],
    });

    const nextActivities = nextState.wcif?.schedule.venues[0].rooms[0].activities ?? [];
    const nextAssignments = nextState.wcif?.persons[0].assignments ?? [];
    expect(nextState.needToSave).toBe(true);
    expect(nextState.changedKeys.has('schedule')).toBe(true);
    expect(nextActivities[0].childActivities).toEqual([childActivity]);
    expect(nextAssignments[0]).toBe(unrelatedAssignment);
  });

  it('updateRoundChildActivities remaps assignments when a child activity is replaced with a new id', () => {
    const parentActivity = buildActivity({ id: 77, name: 'Round 1', activityCode: '333-r1' });
    const existingChild = buildActivity({ id: 55, name: 'Group 1', activityCode: '333-r1-g1' });
    const matchingChild = buildActivity({ id: 77, name: 'Group 1', activityCode: '333-r1-g1' });
    const matchingAssignment: Assignment = {
      activityId: 55,
      assignmentCode: 'competitor',
      stationNumber: null,
    };
    const person = buildPerson({
      registrantId: 2,
      assignments: [matchingAssignment],
      registration: {
        status: 'accepted',
        eventIds: [],
        isCompeting: true,
        comments: undefined,
        wcaRegistrationId: 2,
      },
    });
    const state = buildState(buildWcif([{ ...parentActivity, childActivities: [existingChild] }], [person]));

    const nextState = updateRoundChildActivities(state, {
      activityId: parentActivity.id,
      childActivities: [matchingChild],
    });

    const nextAssignment = nextState.wcif?.persons[0].assignments?.[0];
    expect(nextAssignment).not.toBe(matchingAssignment);
    expect(nextAssignment).toEqual({
      ...matchingAssignment,
      activityId: matchingChild.id,
    });
  });
});
