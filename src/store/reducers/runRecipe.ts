import { runBulkRecipesOnWcif, runRecipeOnWcif } from '../../lib/recipes/runRecipeOnWcif';
import { type AppState } from '../initialState';
import type { RunRecipePayload, RunRecipesPayload } from '../actions';

/**
 * Run a built-in recipe to generate groups and/or assignments for a round.
 */
export function runRecipe(state: AppState, action: RunRecipePayload): AppState {
  if (!state.wcif) return state;

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule', 'persons', 'events']),
    wcif: runRecipeOnWcif(state.wcif, action),
  };
}

export function runRecipes(state: AppState, action: RunRecipesPayload): AppState {
  if (!state.wcif) return state;

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule', 'persons', 'events']),
    wcif: runBulkRecipesOnWcif(state.wcif, action),
  };
}
