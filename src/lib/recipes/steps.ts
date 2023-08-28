import { Competition } from '@wca/helpers';
import { getActivities } from './activities';
import { getCluster } from './clusters';
import { Step, StepDefinition } from './types';

export const StepLibrary: Record<string, StepDefinition> = {
  GenerateCompetitorAssignmentsForStaff: {
    id: 'GenerateCompetitorAssignmentsForStaff',
    name: 'Generate Competitor Assignments For Staff',
    description:
      'Generates competitor assignments for staff members based on their staff assignments',
    defaults: {
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasAssignmentInRound',
            value: 'staff-*',
          },
        ],
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
      options: {},
      generator: 'assignEveryone',
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
          weight: 1,
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
          weight: 1,
        },
      ],
    },
  },
  GenerateCompetitorAssignmentsForFirstTimers: {
    id: 'GenerateCompetitorAssignmentsForFirstTimers',
    name: 'Generate Competitor Assignments For First Timers',
    description: 'Generates competitor assignments for first timers',
    defaults: {
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'isFirstTimer',
            value: true,
          },
        ],
      },
      generator: 'assignEveryone',
      assignmentCode: 'competitor',
      activities: { base: 'all', options: { tail: -1 } },
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
          weight: 1,
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
          weight: 1,
        },
      ],
    },
  },
  GenerateCompetitorAssignments: {
    id: 'GenerateCompetitorAssignments',
    name: 'Generate Competitor Assignments',
    description: 'Generates competitor assignments for everyone else',
    defaults: {
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasCompetitorAssignment',
            value: false,
          },
        ],
      },
      generator: 'assignEveryone',
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
          constraint: 'avoidConflictingNames',
          weight: 50,
        },
        {
          constraint: 'balancedGroupSize',
          weight: 1,
        },
      ],
    },
  },
  GenerateJudgeAssignmentsForCompetitors: {
    id: 'GenerateJudgeAssignmentsForCompetitors',
    name: 'Generate Judge Assignments For Competitors',
    description:
      'Creates judge assignments for competitors based on their competitor assignments. Judge assignments are generally assigned for the group directly following the competitor assignment.',
    defaults: {
      generator: 'assignEveryone',
      assignmentCode: 'staff-judge',
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasCompetitorAssignment',
            value: true,
          },
        ],
      },
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
          constraint: 'balancedGroupSize',
          weight: 1,
        },
        {
          constraint: 'sameStageAsOtherAssignments',
          weight: 5,
        },
        {
          constraint: 'shouldFollowCompetitorAssignment',
          weight: 1,
        },
      ],
    },
  },
};

export const Steps = Object.keys(StepLibrary).reduce((acc, key) => {
  return [...acc, StepLibrary[key]];
}, []);

export const fromDefaults = (step: StepDefinition) => ({
  id: step.id,
  ...step.defaults,
});

export const hydrateStep = (wcif: Competition, roundId: string) => (step: Step) => {
  return {
    ...step,
    cluster: getCluster(wcif, step.cluster, roundId),
    activities: getActivities(wcif, step.activities, roundId),
  };
};
