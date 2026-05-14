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
        sort: {
          by: 'speed',
          direction: 'asc',
        }
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
        sort: {
          by: 'speed',
          direction: 'desc',
        }
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
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
          constraint: 'mustNotHaveConflictingAssignments',
          weight: 1,
        },
        {
          constraint: 'groupBySpeed',
          weight: 20,
        },
        {
          constraint: 'restrictActivitySize',
          weight: 1,
          options: {
            maxSize: 'average',
          },
        },
        {
          constraint: 'balancedGroupSize',
          weight: 1,
        },
      ],
    },
  }),
};

export const NoCompetitorAssignmentLeftBehind: StepDefinition = {
  id: 'NoCompetitorAssignmentLeftBehind',
  name: 'No Competitor Assignment Left Behind',
  description:
    'Assigns the remaining people without competitor assignments to a group',
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
        sort: {
          by: 'speed',
          direction: 'desc',
        }
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
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
          constraint: 'mustNotHaveConflictingAssignments',
          weight: 1,
        },
        {
          constraint: 'balancedGroupSize',
          weight: 1,
        },
      ],
    },
  }),
};
