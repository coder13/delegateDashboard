import { type Competition } from '@wca/helpers';
import { Constraints, Generators } from 'wca-group-generators';
import { findRoundActivitiesById } from '../../lib/wcif/activities';
import { createGroupsAcrossStages } from '../../lib/wcif/groups';
import {
  RecipeConstraints,
  Recipes,
  fromRecipeDefinition,
  hydrateStep,
  optimizeAssignmentsGlobally,
} from '../../lib/recipes';
import { shouldRunGroupStep } from '../../lib/recipes/conditions';
import { mapIn } from '../../lib/utils/utils';
import {
  getRoundConfigExtensionData,
  setRoundConfigExtensionData,
} from '../../lib/wcif/extensions/delegateDashboard/delegateDashboard';
import { type AppState } from '../initialState';
import type { RunRecipePayload, RunRecipesPayload } from '../actions';

const setRoundRecipeConfig = (
  wcif: Competition,
  roundId: string,
  recipeId: string
): Competition => ({
  ...wcif,
  events: wcif.events.map((event) => ({
    ...event,
    rounds: event.rounds.map((round) => {
      if (round.id !== roundId) {
        return round;
      }

      return setRoundConfigExtensionData(round, {
        ...(getRoundConfigExtensionData(round) ?? {}),
        recipe: { id: recipeId },
      });
    }),
  })),
});

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

  const generatedWcif = recipe.steps.reduce<Competition>((accWcif, step) => {
    if (step.type === 'assignments') {
      const generator = (Generators as Record<string, any>)[step.props.generator];
      if (!generator) {
        throw new Error(`Generator ${step.props.generator} not found`);
      }

      const hydratedStep = hydrateStep(accWcif, action.roundId, step);

      const constraints =
        hydratedStep.props.constraints?.map((c) => {
          const constraintFn =
            (RecipeConstraints as Record<string, any>)[c.constraint] ??
            (Constraints as Record<string, any>)[c.constraint];
          if (!constraintFn) {
            throw new Error(`Constraint ${c.constraint} not found`);
          }
          return {
            constraint: constraintFn,
            weight: c.weight,
            options: c.options,
          };
        }) ?? [];

      const generatedWcif = generator.execute({
        wcif: accWcif,
        roundId: action.roundId,
        ...hydratedStep.props,
        constraints,
      }) as Competition;

      if (!hydratedStep.props.globalScore) {
        return generatedWcif;
      }

      if (
        hydratedStep.props.globalScore.maxClusterSize &&
        hydratedStep.props.cluster.length > hydratedStep.props.globalScore.maxClusterSize
      ) {
        return generatedWcif;
      }

      return optimizeAssignmentsGlobally({
        beforeWcif: accWcif,
        wcif: generatedWcif,
        cluster: hydratedStep.props.cluster,
        activities: hydratedStep.props.activities,
        assignmentCode: hydratedStep.props.assignmentCode,
        constraints,
        options: hydratedStep.props.options,
        maxPasses: hydratedStep.props.globalScore.maxPasses,
        maxEvaluations: hydratedStep.props.globalScore.maxEvaluations,
      });
    }

    if (step.type === 'groups') {
      const roundActivities = findRoundActivitiesById(accWcif, action.roundId);
      if (!shouldRunGroupStep(accWcif, action.roundId, roundActivities, step)) {
        return accWcif;
      }

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

  const updatedWcif = setRoundRecipeConfig(generatedWcif, action.roundId, action.recipeId);

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'schedule', 'persons', 'events']),
    wcif: updatedWcif,
  };
}

export function runRecipes(state: AppState, action: RunRecipesPayload): AppState {
  return action.roundIds.reduce<AppState>(
    (accState, roundId) => runRecipe(accState, { roundId, recipeId: action.recipeId }),
    state
  );
}
