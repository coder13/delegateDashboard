import { StepDefinition } from '../types';

const PNW_BALANCED_GROUP_SIZE_WEIGHT = 20;
const PNW_ASSIGNMENT_GAP_WEIGHT = 10;
const PNW_ASSIGNMENT_GAP_OPTIONS = {
  gapCapMinutes: 120,
  noGapPenalty: 100,
};
const PNW_GLOBAL_SCORE = {
  maxPasses: 1,
  maxEvaluations: 250,
  maxClusterSize: 80,
};

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
          by: 'mostConstrained',
          direction: 'desc',
        },
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
      options: {
        mode: 'symmetric',
      },
      globalScore: PNW_GLOBAL_SCORE,
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
          constraint: 'shouldHelpAfterCompeting',
          weight: 20,
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
          constraint: 'maximizeAssignmentGaps',
          weight: PNW_ASSIGNMENT_GAP_WEIGHT,
          options: PNW_ASSIGNMENT_GAP_OPTIONS,
        },
        {
          constraint: 'assignmentsNextToEachother',
          weight: 2,
        },
        {
          constraint: 'avoidConflictingNames',
          weight: 10,
        },
        {
          constraint: 'avoidSimilarFirstNames',
          weight: 10,
        },
        {
          constraint: 'balancedGroupSize',
          weight: PNW_BALANCED_GROUP_SIZE_WEIGHT,
        },
      ],
    },
  }),
};

export const GenerateCompetitorAssignmentsForDelegatesAndOrganizers: StepDefinition = {
  id: 'GenerateCompetitorAssignmentsForDelegatesAndOrganizers',
  name: 'Generate Competitor Assignments For Delegates And Organizers',
  description:
    'Generates competitor assignments for delegates and organizers, preferring later groups first',
  defaults: () => ({
    type: 'assignments',
    props: {
      generator: 'assignEveryone',
      cluster: {
        base: 'personsInRound',
        filters: [
          {
            key: 'hasRole',
            value: ['delegate', 'trainee-delegate', 'organizer'],
          },
          {
            key: 'doesNotHaveAssignmentInRound',
            value: 'competitor',
          },
        ],
        sort: {
          by: 'mostConstrained',
          direction: 'desc',
        },
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
      options: {
        mode: 'symmetric',
      },
      globalScore: PNW_GLOBAL_SCORE,
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
          constraint: 'preferLaterGroups',
          weight: 20,
        },
        {
          constraint: 'maximizeAssignmentGaps',
          weight: PNW_ASSIGNMENT_GAP_WEIGHT,
          options: PNW_ASSIGNMENT_GAP_OPTIONS,
        },
        {
          constraint: 'balancedGroupNumberSize',
          weight: 15,
          options: {
            persons: 'cluster',
          },
        },
        {
          constraint: 'balancedGroupSize',
          weight: PNW_BALANCED_GROUP_SIZE_WEIGHT,
        },
        {
          constraint: 'avoidConflictingNames',
          weight: 1,
        },
        {
          constraint: 'avoidSimilarFirstNames',
          weight: 1,
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
          by: 'mostConstrained',
          direction: 'desc',
        },
      },
      assignmentCode: 'competitor',
      activities: { base: 'all', options: { tail: 1 } },
      options: {
        mode: 'symmetric',
      },
      globalScore: PNW_GLOBAL_SCORE,
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
          constraint: 'maximizeAssignmentGaps',
          weight: PNW_ASSIGNMENT_GAP_WEIGHT,
          options: PNW_ASSIGNMENT_GAP_OPTIONS,
        },
        {
          constraint: 'avoidConflictingNames',
          weight: 1,
        },
        {
          constraint: 'avoidSimilarFirstNames',
          weight: 1,
        },
        {
          constraint: 'balancedGroupSize',
          weight: PNW_BALANCED_GROUP_SIZE_WEIGHT,
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
          by: 'mostConstrained',
          direction: 'desc',
        },
      },
      assignmentCode: 'competitor',
      activities: { base: 'all' },
      options: {
        mode: 'symmetric',
      },
      globalScore: PNW_GLOBAL_SCORE,
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
          constraint: 'maximizeAssignmentGaps',
          weight: PNW_ASSIGNMENT_GAP_WEIGHT,
          options: PNW_ASSIGNMENT_GAP_OPTIONS,
        },
        {
          constraint: 'avoidConflictingNames',
          weight: 10,
        },
        {
          constraint: 'avoidSimilarFirstNames',
          weight: 40,
        },
        {
          constraint: 'balancedGroupSize',
          weight: PNW_BALANCED_GROUP_SIZE_WEIGHT,
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
          constraint: 'onlyMultipleGroupRounds',
          weight: 1,
        },
        {
          constraint: 'mustNotHaveRoles',
          weight: 1,
          options: {
            roles: ['delegate', 'trainee-delegate', 'organizer'],
          },
        },
        {
          constraint: 'sameStageAsOtherAssignments',
          weight: 5,
        },
        {
          constraint: 'maximizeAssignmentGaps',
          weight: PNW_ASSIGNMENT_GAP_WEIGHT,
          options: PNW_ASSIGNMENT_GAP_OPTIONS,
        },
        {
          constraint: 'shouldFollowCompetitorAssignment',
          weight: 10,
        },
      ],
    },
  }),
};
