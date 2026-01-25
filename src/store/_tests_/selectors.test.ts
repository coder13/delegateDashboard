import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
} from '../selectors';
import type { Assignment } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import { buildActivity, buildPerson, buildState, buildWcif } from '../reducers/_tests_/helpers';

describe('selectors', () => {
  it('selects persons assigned to any group for a round', () => {
    const childActivity = buildActivity({ id: 2, name: 'Group 1', activityCode: '333-r1-g1' });
    const parentActivity = buildActivity({
      id: 1,
      name: 'Round 1',
      activityCode: '333-r1',
      childActivities: [childActivity],
    });
    const otherActivity = buildActivity({ id: 3, name: 'Other Round', activityCode: '222-r1' });
    const personOne = buildPerson({
      registrantId: 1,
      assignments: [
        { activityId: 2, assignmentCode: 'competitor', stationNumber: null },
      ] as Assignment[],
    });
    const personTwo = buildPerson({
      registrantId: 2,
      assignments: [
        { activityId: 2, assignmentCode: 'staff-judge', stationNumber: null },
      ] as Assignment[],
    });
    const personThree = buildPerson({
      registrantId: 3,
      assignments: [
        { activityId: 3, assignmentCode: 'competitor', stationNumber: null },
      ] as Assignment[],
    });
    const state = buildState(
      buildWcif([parentActivity, otherActivity], [personOne, personTwo, personThree])
    );

    const assigned = selectPersonsAssignedForRound(state, '333-r1');

    expect(assigned.map((person) => person.registrantId).sort()).toEqual([1, 2]);
  });

  it('selects only competitors for a round', () => {
    const childActivity = buildActivity({ id: 4, name: 'Group 1', activityCode: '333-r1-g1' });
    const parentActivity = buildActivity({
      id: 5,
      name: 'Round 1',
      activityCode: '333-r1',
      childActivities: [childActivity],
    });
    const personOne = buildPerson({
      registrantId: 1,
      assignments: [
        { activityId: 4, assignmentCode: 'competitor', stationNumber: null },
      ] as Assignment[],
    });
    const personTwo = buildPerson({
      registrantId: 2,
      assignments: [
        { activityId: 4, assignmentCode: 'staff-judge', stationNumber: null },
      ] as Assignment[],
    });
    const state = buildState(buildWcif([parentActivity], [personOne, personTwo]));

    const competitors = selectPersonsHavingCompetitorAssignmentsForRound(state, '333-r1');

    expect(competitors.map((person) => person.registrantId)).toEqual([1]);
  });
});
