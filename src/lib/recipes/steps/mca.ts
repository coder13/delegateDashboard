import { parseActivityCode } from '@wca/helpers';
import { findGroupActivitiesByRound } from '../../activities';
import { StepDefinition } from '../types';

export const GenerateFirstTimersInSameGroup: StepDefinition = {
  id: 'GenerateFirstTimersInSameGroup',
  name: 'Assign First Timers In The Same Group',
  description: 'Assigns first timers to the same group',
  defaults: (wcif, activityCode) => {
    const groups = findGroupActivitiesByRound(wcif, activityCode);

    // get activities that represent the first group
    const activityIds = groups
      .filter((g) => {
        const parsedActivityCode = parseActivityCode(g.activityCode);
        return parsedActivityCode.groupNumber === 1;
      })
      .map((group) => group.id);

    return {
      type: 'assignments',
      props: {
        generator: 'assignEveryone',
        cluster: {
          base: 'personsInRound',
          filters: [
            {
              key: 'isFirstTimer',
              value: true,
            },
          ],
        },
        assignmentCode: 'competitor',
        activities: {
          base: 'all',
          activityIds,
        },
        options: {
          mode: 'symmetric',
        },
        constraints: [
          {
            constraint: 'uniqueAssignment',
            weight: 1,
          },
          {
            constraint: 'mustNotHaveOtherAssignments',
            weight: 1,
          },
          {
            constraint: 'balancedGroupSize',
            weight: 1,
          },
        ],
      },
    };
  },
};
