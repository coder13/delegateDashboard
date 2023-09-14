import { StepDefinition } from '../types';

export const GenerateSingleGroup: StepDefinition = {
  id: 'GenerateSingleGroup',
  name: 'Generate Single Group',
  description: 'Generates a single group of competitors',
  defaults: () => ({
    type: 'groups',
    props: {
      count: 1,
    },
  }),
};

export const SpreadDelegates: StepDefinition = {
  id: 'SpreadDelegateCompetitorAssignments',
  name: 'Spread Delegate Competitor Assignments',
  description: 'Spreads delegates across groups',
  defaults: () => ({
    type: 'assignments',
    props: {
      generator: 'assignEveryone',
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasRole',
            value: ['delegate', 'trainee-delegate'],
          },
        ],
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
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
          constraint: 'balancedGroupNumberSize',
          weight: 1,
          options: {
            persons: 'cluster',
          },
        },
      ],
    },
  }),
};
