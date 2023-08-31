import { StepLibrary, fromDefaults } from './steps';
import { RecipeConfig, RecipeDefinition } from './types';

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
