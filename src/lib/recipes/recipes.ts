import type { ActivityCode, Competition, Round } from '@wca/helpers';
import { StepLibrary, fromDefaults } from './steps';
import type { RecipeConfig, RecipeDefinition, Step } from './types';

export const Recipes: RecipeDefinition[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced',
    defaultSteps: [
      StepLibrary.SpreadDelegates,
      StepLibrary.BalancedCompetitorAssignmentsForEveryone,
      StepLibrary.NoCompetitorAssignmentLeftBehind,
      StepLibrary.GenerateJudgeAssignmentsForCompetitors,
    ],
  },
  {
    id: 'pnw',
    name: 'PNW',
    description: 'PNW',
    defaultSteps: [
      StepLibrary.GenerateSingleGroupForFinal,
      StepLibrary.GenerateCompetitorAssignmentsForStaff,
      StepLibrary.GenerateCompetitorAssignmentsForDelegatesAndOrganizers,
      StepLibrary.GenerateCompetitorAssignmentsForFirstTimers,
      StepLibrary.GenerateCompetitorAssignments,
      StepLibrary.GenerateJudgeAssignmentsForCompetitors,
    ],
  },
  {
    id: 'mca',
    name: 'MCA',
    description: 'MCA',
    defaultSteps: [
      StepLibrary.GenerateFirstTimersInSameGroup,
      StepLibrary.SpreadDelegates,
      StepLibrary.SpreadStaffAcrossGroups,
      StepLibrary.BalancedCompetitorAssignmentsForEveryone,
      StepLibrary.GenerateJudgeAssignmentsForCompetitors,
    ],
  },
];

export const fromRecipeDefinition = (
  recipe: RecipeDefinition,
  { wcif, activityCode }: { wcif: Competition; activityCode: ActivityCode }
): RecipeConfig => ({
  id: recipe.id,
  name: recipe.name,
  description: recipe.description,
  steps: recipe.defaultSteps.map((step) => fromDefaults(step, { wcif, activityCode })) as Step[],
});

export const getPreferredDefaultRecipe = (_wcif: Competition, _round: Round) => {
  return 'pnw';
};
