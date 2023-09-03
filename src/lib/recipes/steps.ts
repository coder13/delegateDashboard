import { Competition } from '@wca/helpers';
import { getActivities } from './activities';
import { getCluster } from './clusters';
import { AssignmentStep, StepDefinition } from './types';

export const StepLibrary: Record<string, StepDefinition> = {
  GenerateCompetitorAssignmentsForStaff: {
    id: 'GenerateCompetitorAssignmentsForStaff',
    name: 'Generate Competitor Assignments For Staff',
    description:
      'Generates competitor assignments for staff members based on their staff assignments',
    defaults: {
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
            weight: 1,
          },
        ],
      },
    },
  },
  GenerateCompetitorAssignmentsForFirstTimers: {
    id: 'GenerateCompetitorAssignmentsForFirstTimers',
    name: 'Generate Competitor Assignments For First Timers',
    description: 'Generates competitor assignments for first timers',
    defaults: {
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
    },
  },
  GenerateCompetitorAssignments: {
    id: 'GenerateCompetitorAssignments',
    name: 'Generate Competitor Assignments',
    description: 'Generates competitor assignments for everyone else',
    defaults: {
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
            weight: 10,
          },
        ],
      },
    },
  },
  GenerateJudgeAssignmentsForCompetitors: {
    id: 'GenerateJudgeAssignmentsForCompetitors',
    name: 'Generate Judge Assignments For Competitors',
    description:
      'Creates judge assignments for competitors based on their competitor assignments. Judge assignments are generally assigned for the group directly following the competitor assignment.',
    defaults: {
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
  },
  GenerateSingleGroup: {
    id: 'GenerateSingleGroup',
    name: 'Generate Single Group',
    description: 'Generates a single group of competitors',
    defaults: {
      type: 'groups',
      props: {
        count: 1,
      },
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

export const hydrateStep = (wcif: Competition, roundId: string, step: AssignmentStep) => {
  return {
    ...step,
    props: {
      ...step.props,
      cluster: getCluster(wcif, step.props.cluster, roundId),
      activities: getActivities(wcif, step.props.activities, roundId),
    },
  };
};
