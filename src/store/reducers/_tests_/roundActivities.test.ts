import { updateRoundActivities, updateRoundChildActivities } from './../roundActivities';
import type { Activity, Assignment, Person } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import { buildState, buildWcif } from './helpers';

describe('roundActivities reducers', () => {
  it('updateRoundActivities returns original state when wcif is missing', () => {
    const state = buildState(null);
    const nextState = updateRoundActivities(state, { activities: [] });

    expect(nextState).toBe(state);
  });

  it('updateRoundActivities updates matching activities and marks schedule as changed', () => {
    const activityOne: Activity = {
      id: 1,
      name: 'Round 1',
      activityCode: '333-r1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      childActivities: [],
      extensions: [],
    };
    const activityTwo: Activity = {
      id: 2,
      name: 'Round 2',
      activityCode: '333-r2',
      startTime: '2024-01-01T11:00:00Z',
      endTime: '2024-01-01T12:00:00Z',
      childActivities: [],
      extensions: [],
    };
    const updatedActivityTwo: Activity = {
      ...activityTwo,
      name: 'Round 2 Updated',
    };
    const state = buildState(buildWcif([activityOne, activityTwo]));

    const nextState = updateRoundActivities(state, { activities: [updatedActivityTwo] });

    const nextActivities = nextState.wcif?.schedule.venues[0].rooms[0].activities ?? [];
    expect(nextState.needToSave).toBe(true);
    expect(nextState.changedKeys.has('schedule')).toBe(true);
    expect(nextActivities[0]).toBe(activityOne);
    expect(nextActivities[1]).toBe(updatedActivityTwo);
  });

  it('updateRoundChildActivities updates child activities and keeps other assignments intact', () => {
    const parentActivity: Activity = {
      id: 10,
      name: 'Round 1',
      activityCode: '333-r1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      childActivities: [],
      extensions: [],
    };
    const childActivity: Activity = {
      id: 99,
      name: 'Group 1',
      activityCode: '333-r1-g1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:30:00Z',
      childActivities: [],
      extensions: [],
    };
    const unrelatedAssignment: Assignment = {
      activityId: 42,
      assignmentCode: 'competitor',
      stationNumber: null,
    };
    const person: Person = {
      name: 'Test Person',
      registrantId: 1,
      wcaUserId: 1,
      wcaId: '2024TEST01',
      countryIso2: 'US',
      gender: 'm',
      birthdate: '2000-01-01',
      email: 'test@example.com',
      registration: {
        status: 'accepted',
        eventIds: [],
        isCompeting: true,
        comments: null,
      },
      assignments: [unrelatedAssignment],
      roles: [],
      personalBests: [],
      extensions: [],
      avatar: null,
    };
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

  it('updateRoundChildActivities creates new assignment object when assignment matches child id', () => {
    const parentActivity: Activity = {
      id: 77,
      name: 'Round 1',
      activityCode: '333-r1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      childActivities: [],
      extensions: [],
    };
    const matchingChild: Activity = {
      id: 77,
      name: 'Group 1',
      activityCode: '333-r1-g1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:30:00Z',
      childActivities: [],
      extensions: [],
    };
    const matchingAssignment: Assignment = {
      activityId: 77,
      assignmentCode: 'competitor',
      stationNumber: null,
    };
    const person: Person = {
      name: 'Test Person',
      registrantId: 2,
      wcaUserId: 2,
      wcaId: '2024TEST02',
      countryIso2: 'US',
      gender: 'f',
      birthdate: '2000-01-01',
      email: 'test2@example.com',
      registration: {
        status: 'accepted',
        eventIds: [],
        isCompeting: true,
        comments: null,
      },
      assignments: [matchingAssignment],
      roles: [],
      personalBests: [],
      extensions: [],
      avatar: null,
    };
    const state = buildState(buildWcif([parentActivity], [person]));

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
