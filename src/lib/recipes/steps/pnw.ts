import { StepDefinition } from '../types';

export const GenerateCompetitorAssignmentsForStaff: StepDefinition = {
  id: 'GenerateCompetitorAssignmentsForStaff',
  name: 'Generate Competitor Assignments For Staff',
  description:
    'Generates competitor assignments for staff members based on their staff assignments',
  defaults: () => ({
    type: 'assignments',
    props: {
      generator: 'assignEveryone',
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasAssignmentInRound',
            value: 'staff-*',
          },
        ],
        sort: {
          by: 'speed',
          direction: 'asc',
        },
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
          constraint: 'sameStageAsOtherAssignments',
          weight: 5,
        },
        {
          constraint: 'maximizeBreaks',
          weight: 10,
        },
        {
          constraint: 'assignmentsNextToEachother',
          weight: 2,
        },
        {
          constraint: 'avoidConflictingNames',
          weight: 10,
        },
      ],
    },
  }),
};

export const GenerateCompetitorAssignmentsForFirstTimers: StepDefinition = {
  id: 'GenerateCompetitorAssignmentsForFirstTimers',
  name: 'Generate Competitor Assignments For First Timers',
  description: 'Generates competitor assignments for first timers',
  defaults: () => ({
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
        sort: {
          by: 'speed',
          direction: 'asc',
        },
      },
      assignmentCode: 'competitor',
      activities: { base: 'all', options: { tail: 1 } },
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
          constraint: 'avoidConflictingNames',
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

export const GenerateCompetitorAssignments: StepDefinition = {
  id: 'GenerateCompetitorAssignments',
  name: 'Generate Competitor Assignments',
  description: 'Generates competitor assignments for everyone else',
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
          direction: 'asc',
        },
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
          constraint: 'avoidConflictingNames',
          weight: 10,
        },
        {
          constraint: 'balancedGroupSize',
          weight: 5,
        },
        {
          constraint: 'balancedSpeed',
          weight: 5,
        },
      ],
    },
  }),
};

export const GenerateJudgeAssignmentsForCompetitors: StepDefinition = {
  id: 'GenerateJudgeAssignmentsForCompetitors',
  name: 'Generate Judge Assignments For Competitors',
  description:
    'Creates judge assignments for competitors based on their competitor assignments. Judge assignments are generally assigned for the group directly following the competitor assignment.',
  defaults: () => ({
    type: 'assignments',
    props: {
      generator: 'assignEveryone',
      assignmentCode: 'staff-judge',
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasAssignmentInRound',
            value: 'competitor',
          },
          {
            key: 'doesNotHaveAssignmentInRound',
            value: 'staff-*',
          },
        ],
        sort: {
          by: 'speed',
          direction: 'asc',
        },
      },
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
          constraint: 'sameStageAsOtherAssignments',
          weight: 5,
        },
        {
          constraint: 'shouldFollowCompetitorAssignment',
          weight: 10,
        },
      ],
    },
  }),
};
