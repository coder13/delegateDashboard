interface Step {
  id: string;
  name: string;
  description: string;
  defaults: {
    cluster: string;
    activities: string;
    options: any;
    constraints: any[];
  };
}

const StepLibrary: Record<string, Step> = {
  GenerateCompetitorAssignmentsForStaff: {
    id: 'GenerateCompetitorAssignmentsForStaff',
    name: 'Generate Competitor Assignments For Staff',
    description:
      'Generates competitor assignments for staff members based on their staff assignments',
    defaults: {
      cluster: 'personsInRound',
      activities: 'all',
      options: {
        clusterOptions: {
          hasStaffAssignment: true,
        },
      },
      constraints: [
        {
          constraint: 'uniqueAssignment',
          weight: 1,
        },
        {
          constraint: 'mustNotHaveOtherAssignmentsConstraint',
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
      cluster: 'personsInRound',
      activities: 'allButLastGroup',
      options: {
        clusterOptions: {
          firstTimer: true,
        },
      },
      constraints: [
        {
          constraint: 'uniqueAssignment',
          weight: 1,
        },
        {
          constraint: 'mustNotHaveOtherAssignmentsConstraint',
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
    description: 'Generates competitor assignments for competitors',
    defaults: {
      cluster: 'personsInRound',
      activities: 'all',
      options: {
        clusterOptions: {
          hasCompetitorAssignment: true,
        },
      },
      constraints: [
        {
          constraint: 'uniqueAssignment',
          weight: 1,
        },
        {
          constraint: 'mustNotHaveOtherAssignmentsConstraint',
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
      cluster: 'personsInRound',
      activities: 'all',
      options: {
        clusterOptions: {
          hasCompetitorAssignment: true,
        },
      },
      constraints: [
        {
          constraint: 'uniqueAssignment',
          weight: 1,
        },
        {
          constraint: 'mustNotHaveOtherAssignmentsConstraint',
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
  acc[key] = key;
  return acc;
}, {});

export const fromDefaults = (step: Step) => ({
  id: step.id,
  ...step.defaults,
});

export interface Recipe {
  id: string;
  name: string;
  description: string;
  defaultSteps: Array<
    {
      id: string;
    } & Step['defaults']
  >;
}

export const Recipes: Recipe[] = [
  {
    id: 'pnw',
    name: 'PNW',
    description: 'PNW',
    defaultSteps: [
      fromDefaults(StepLibrary.GenerateCompetitorAssignmentsForStaff),
      fromDefaults(StepLibrary.GenerateCompetitorAssignmentsForFirstTimers),
      fromDefaults(StepLibrary.GenerateCompetitorAssignments),
      fromDefaults(StepLibrary.GenerateJudgeAssignmentsForCompetitors),
    ],
  },
];
