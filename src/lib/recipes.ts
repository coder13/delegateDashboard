import { Competition, Round } from '@wca/helpers';
import { findAllActivities } from 'wca-group-generators';
import { activityCodeIsChild } from './activities';
import { acceptedRegistrations, personsShouldBeInRound } from './persons';

export interface StepDefinition {
  id: string;
  name: string;
  description: string;
  defaults: Omit<Step, 'id'>;
}

export interface Step {
  id: string;
  cluster: string;
  activities: string;
  options: any;
  constraints: any[];
  generator: string;
}

export const StepLibrary: Record<string, StepDefinition> = {
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
      generator: 'assignEveryone',
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
  GenerateCompetitorAssignments: {
    id: 'GenerateCompetitorAssignments',
    name: 'Generate Competitor Assignments',
    description: 'Generates competitor assignments for everyone else',
    defaults: {
      cluster: 'personsInRound',
      activities: 'all',
      options: {
        clusterOptions: {
          hasCompetitorAssignment: true,
        },
      },
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

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  defaultSteps: Array<StepDefinition>;
}

export interface RecipeConfig {
  id: string;
  name: string;
  description: string;
  steps: Array<Step>;
}

export const Recipes: RecipeDefinition[] = [
  {
    id: 'pnw',
    name: 'PNW',
    description: 'PNW',
    defaultSteps: [
      StepLibrary.GenerateCompetitorAssignmentsForStaff,
      StepLibrary.GenerateCompetitorAssignmentsForFirstTimers,
      StepLibrary.GenerateCompetitorAssignments,
      StepLibrary.GenerateJudgeAssignmentsForCompetitors,
    ],
  },
];

export const fromRecipeDefinition = (recipe: RecipeDefinition): RecipeConfig => ({
  id: recipe.id,
  name: recipe.name,
  description: recipe.description,
  steps: recipe.defaultSteps.map(fromDefaults),
});

const getCluster = (wcif: Competition, cluster: string, roundId: string) => {
  switch (cluster) {
    case 'personsInRound':
      const round = wcif.events.flatMap((e) => e.rounds).find((r) => r.id === roundId) as Round;
      return personsShouldBeInRound(round)(acceptedRegistrations(wcif.persons));
    default:
      return wcif.persons;
  }
};

const getActivities = (wcif: Competition, activities: string, roundId: string) => {
  const allActivities = findAllActivities(wcif);
  const activitiesForRound = allActivities
    .filter(
      (activity) =>
        activityCodeIsChild(roundId, activity.activityCode) && roundId !== activity.activityCode
    )
    .sort((a, b) => a.activityCode.localeCompare(b.activityCode));
  const lastActivityCode = activitiesForRound[activitiesForRound.length - 1].activityCode;

  switch (activities) {
    case 'all':
      return activitiesForRound;
    case 'allButLastGroup':
      return activitiesForRound.filter((a) => a.activityCode !== lastActivityCode);
    default:
      return activitiesForRound;
  }
};

export const hydrateStep = (wcif: Competition, roundId: string) => (step: Step) => {
  return {
    ...step,
    cluster: getCluster(wcif, step.cluster, roundId),
    activities: getActivities(wcif, step.activities, roundId),
  };
};
