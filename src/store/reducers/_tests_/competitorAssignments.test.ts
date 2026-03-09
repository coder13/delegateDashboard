import { bulkRemovePersonAssignments } from '../competitorAssignments';
import {
  getGroupifierActivityConfig,
  setGroupifierActivityConfig,
} from '../../../lib/wcif/extensions/groupifier';
import type { Assignment } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import { buildActivity, buildPerson, buildState, buildWcif } from './helpers';

describe('competitorAssignments reducers', () => {
  it('bulkRemovePersonAssignments removes featured competitors without assignments', () => {
    const activityOne = setGroupifierActivityConfig(
      buildActivity({ id: 1, name: 'Round 1', activityCode: '333-r1' }),
      { featuredCompetitorWcaUserIds: [10] }
    );
    const activityTwo = setGroupifierActivityConfig(
      buildActivity({ id: 2, name: 'Round 2', activityCode: '333-r2' }),
      { featuredCompetitorWcaUserIds: [10] }
    );
    const person = buildPerson({
      registrantId: 1,
      wcaUserId: 10,
      assignments: [
        { activityId: 1, assignmentCode: 'competitor', stationNumber: null },
        { activityId: 2, assignmentCode: 'competitor', stationNumber: null },
      ] as Assignment[],
    });
    const state = buildState(buildWcif([activityOne, activityTwo], [person]));

    const nextState = bulkRemovePersonAssignments(state, {
      assignments: [{ activityId: 1 }],
    });

    const nextActivities = nextState.wcif?.schedule.venues[0].rooms[0].activities ?? [];
    const updatedActivityOne = nextActivities.find((activity) => activity.id === 1)!;
    const updatedActivityTwo = nextActivities.find((activity) => activity.id === 2)!;

    expect(getGroupifierActivityConfig(updatedActivityOne)?.featuredCompetitorWcaUserIds).toEqual(
      []
    );
    expect(getGroupifierActivityConfig(updatedActivityTwo)?.featuredCompetitorWcaUserIds).toEqual([
      10,
    ]);
  });
});
