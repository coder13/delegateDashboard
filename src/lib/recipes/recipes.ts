import { ActivityCode, Competition } from '@wca/helpers';
import { StepLibrary, fromDefaults } from './steps';
import { RecipeConfig, RecipeDefinition, Step } from './types';

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
  {
    id: 'pnw-1-group-finals',
    name: 'PNW 1 group final',
    description: 'Makes a single group of competitors for finals',
    defaultSteps: [StepLibrary.GenerateSingleGroup, StepLibrary.GenerateCompetitorAssignments],
  },
  {
    id: 'mca-test',
    name: 'MCA Test',
    description: 'MCA Test',
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
