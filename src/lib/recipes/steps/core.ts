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
          weight: 2,
          options: {
            persons: 'cluster',
          },
        },
        {
          constraint: 'balancedGroupSize',
          weight: 1,
          options: {
            persons: 'cluster',
          },
        },
      ],
    },
  }),
};

export const BalancedCompetitorAssignmentsForEveryone: StepDefinition = {
  id: 'BalancedCompetitorAssignmentsForEveryone',
  name: 'Balanced Competitor Assignments For Everyone',
  description:
    'Splits up the remaining people without competitor assignments and assigns groups by speed',
  defaults: () => ({
    type: 'assignments',
    props: {
      generator: 'assignEveryone',
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'doesNotHaveAssignmentInRound',
            value: 'competitor',
          },
        ],
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
      options: {
        mode: 'balanced2',
      },
      constraints: [
        // {
        //   constraint: 'uniqueAssignment',
        //   weight: 1,
        // },
        // {
        //   constraint: 'mustNotHaveOtherAssignments',
        //   weight: 1,
        // },
        // {
        //   constraint: 'balancedGroupSize',
        //   weight: 1,
        //   options: 'cluster',
        // },
      ],
    },
  }),
};
