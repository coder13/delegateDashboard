import { type Competition } from '@wca/helpers';
import { Constraints, Generators } from 'wca-group-generators';
import { findRoundActivitiesById } from '../../lib/wcif/activities';
import { createGroupsAcrossStages } from '../../lib/wcif/groups';
import { Recipes, fromRecipeDefinition, hydrateStep } from '../../lib/recipes';
import { mapIn } from '../../lib/utils/utils';
import { type AppState } from '../initialState';
import type { RunRecipePayload } from '../actions';

/**
 * Run a built-in recipe to generate groups and/or assignments for a round.
 * Restores the legacy "recipe" workflow based on wca-group-generators.
 */
export function runRecipe(state: AppState, action: RunRecipePayload): AppState {
  if (!state.wcif) return state;

  const wcif = state.wcif as unknown as Competition;
  const recipeDef = Recipes.find((r) => r.id === action.recipeId);
  if (!recipeDef) {
    throw new Error(`Recipe ${action.recipeId} not found`);
  }

  const recipe = fromRecipeDefinition(recipeDef, { wcif, activityCode: action.roundId });

  const updatedWcif = recipe.steps.reduce<Competition>((accWcif, step) => {
    if (step.type === 'assignments') {
      const generator = (Generators as Record<string, any>)[step.props.generator];
      if (!generator) {
        throw new Error(`Generator ${step.props.generator} not found`);
      }

      const hydratedStep = hydrateStep(accWcif, action.roundId, step);

      const constraints =
        hydratedStep.props.constraints?.map((c) => {
          const constraintFn = (Constraints as Record<string, any>)[c.constraint];
          if (!constraintFn) {
            throw new Error(`Constraint ${c.constraint} not found`);
          }
          return {
            constraint: constraintFn,
            weight: c.weight,
          };
        }) ?? [];

      return generator.execute({
        wcif: accWcif,
        roundId: action.roundId,
        ...hydratedStep.props,
        constraints,
      }) as Competition;
    }

    if (step.type === 'groups') {
      const roundActivities = findRoundActivitiesById(accWcif, action.roundId);
      const roundActivitiesWithGroups = createGroupsAcrossStages(accWcif, roundActivities, {
        spreadGroupsAcrossAllStages: true,
        groups: step.props.count,
      });

      return {
        ...accWcif,
        schedule: mapIn(accWcif.schedule, 'venues', (venue) =>
          mapIn(venue, 'rooms', (room) =>
            mapIn(room, 'activities', (activity) =>
              roundActivitiesWithGroups.find((ra) => ra.id === activity.id)
                ? (roundActivitiesWithGroups.find((ra) => ra.id === activity.id) as any)
                : activity
            )
          )
        ),
      } as Competition;
    }

    return accWcif;
  }, wcif);

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule', 'persons', 'events']),
    wcif: updatedWcif,
  };
}
