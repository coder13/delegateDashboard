import type { Activity, AssignmentCode, Competition, Person } from '@wca/helpers';
import {
  Constraints,
  Generators,
  type Constraint,
  type ConstraintAndWeight,
  type Generator,
} from 'wca-group-generators';
import { findRoundActivitiesById } from '../wcif/activities';
import { createGroupsAcrossStages } from '../wcif/groups';
import {
  getRoundConfigExtensionData,
  setRoundConfigExtensionData,
} from '../wcif/extensions/delegateDashboard/delegateDashboard';
import { mapIn } from '../utils/utils';
import { countPeopleWithImmediateHelpingThenCompetingAssignments } from './bulkGenerationDiagnostics';
import { shouldRunGroupStep } from './conditions';
import { RecipeConstraints } from './constraints';
import { optimizeAssignmentsGlobally } from './globalScoring';
import { Recipes, fromRecipeDefinition } from './recipes';
import { hydrateStep } from './steps';
import type { AssignmentStep, ConstraintProps, Step } from './types';

export interface RunRecipeOnWcifPayload {
  roundId: string;
  recipeId: string;
}

export interface RunRecipesOnWcifPayload {
  roundIds: string[];
  recipeId: string;
}

export interface BulkGenerationProgress {
  phase: 'generating' | 'fixing' | 'staff';
  roundId?: string;
}

interface OptimizationContext {
  roundId: string;
  stepId: string;
  cluster: Person[];
  activities: Activity[];
  assignmentCode: AssignmentCode;
  constraints: ConstraintAndWeight[];
  options?: Record<string, unknown>;
  maxPasses?: number;
  maxEvaluations?: number;
  maxClusterSize?: number;
}

interface RunRecipeStepsOnWcifPayload extends RunRecipeOnWcifPayload {
  stepFilter?: (step: Step) => boolean;
  onOptimizationContext?: (context: OptimizationContext) => void;
}

const isCompetitorAssignmentStep = (step: Step) =>
  step.type === 'assignments' && step.props.assignmentCode === 'competitor';

const isStaffAssignmentStep = (step: Step) =>
  step.type === 'assignments' && step.props.assignmentCode !== 'competitor';

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

const setRoundRecipeConfigs = (wcif: Competition, roundIds: string[], recipeId: string) =>
  roundIds.reduce(
    (accWcif, roundId) => setRoundRecipeConfig(accWcif, roundId, recipeId),
    wcif
  );

const resolveConstraints = (constraints: ConstraintProps[] | undefined): ConstraintAndWeight[] =>
  constraints?.map((constraintConfig) => {
    const constraintFn =
      (RecipeConstraints as Record<string, Constraint | undefined>)[constraintConfig.constraint] ??
      (Constraints as unknown as Record<string, Constraint | undefined>)[
        constraintConfig.constraint
      ];
    if (!constraintFn) {
      throw new Error(`Constraint ${constraintConfig.constraint} not found`);
    }
    return {
      constraint: constraintFn,
      weight: constraintConfig.weight,
      options: constraintConfig.options,
    };
  }) ?? [];

const runAssignmentStepOnWcif = (
  wcif: Competition,
  roundId: string,
  step: AssignmentStep,
  onOptimizationContext?: (context: OptimizationContext) => void
) => {
  const generator = (Generators as unknown as Record<string, Generator | undefined>)[
    step.props.generator
  ];
  if (!generator) {
    throw new Error(`Generator ${step.props.generator} not found`);
  }

  const hydratedStep = hydrateStep(wcif, roundId, step);
  const constraints = resolveConstraints(hydratedStep.props.constraints);

  if (hydratedStep.props.globalScore) {
    onOptimizationContext?.({
      roundId,
      stepId: hydratedStep.id,
      cluster: hydratedStep.props.cluster,
      activities: hydratedStep.props.activities,
      assignmentCode: hydratedStep.props.assignmentCode,
      constraints,
      options: hydratedStep.props.options,
      maxPasses: hydratedStep.props.globalScore.maxPasses,
      maxEvaluations: hydratedStep.props.globalScore.maxEvaluations,
      maxClusterSize: hydratedStep.props.globalScore.maxClusterSize,
    });
  }

  const generatedWcif = generator.execute({
    wcif,
    roundId,
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
    beforeWcif: wcif,
    wcif: generatedWcif,
    cluster: hydratedStep.props.cluster,
    activities: hydratedStep.props.activities,
    assignmentCode: hydratedStep.props.assignmentCode,
    constraints,
    options: hydratedStep.props.options,
    maxPasses: hydratedStep.props.globalScore.maxPasses,
    maxEvaluations: hydratedStep.props.globalScore.maxEvaluations,
  });
};

const runGroupStepOnWcif = (wcif: Competition, roundId: string, step: Step) => {
  if (step.type !== 'groups') {
    return wcif;
  }

  const roundActivities = findRoundActivitiesById(wcif, roundId);
  if (!shouldRunGroupStep(wcif, roundId, roundActivities, step)) {
    return wcif;
  }

  const roundActivitiesWithGroups = createGroupsAcrossStages(wcif, roundActivities, {
    spreadGroupsAcrossAllStages: true,
    groups: step.props.count,
  });
  const roundActivitiesWithGroupsById = new Map(
    roundActivitiesWithGroups.map((activity) => [activity.id, activity])
  );

  return {
    ...wcif,
    schedule: mapIn(wcif.schedule, 'venues', (venue) =>
      mapIn(venue, 'rooms', (room) =>
        mapIn(room, 'activities', (activity) =>
          roundActivitiesWithGroupsById.get(activity.id) ?? activity
        )
      )
    ),
  } as Competition;
};

const recipeStepsFor = (wcif: Competition, recipeId: string, roundId: string) => {
  const recipeDef = Recipes.find((recipe) => recipe.id === recipeId);
  if (!recipeDef) {
    throw new Error(`Recipe ${recipeId} not found`);
  }

  return fromRecipeDefinition(recipeDef, { wcif, activityCode: roundId }).steps;
};

const runRecipeStepsOnWcif = (
  wcif: Competition,
  { roundId, recipeId, stepFilter, onOptimizationContext }: RunRecipeStepsOnWcifPayload
): Competition =>
  recipeStepsFor(wcif, recipeId, roundId)
    .filter(stepFilter ?? (() => true))
    .reduce<Competition>((accWcif, step) => {
      if (step.type === 'assignments') {
        return runAssignmentStepOnWcif(accWcif, roundId, step, onOptimizationContext);
      }

      return runGroupStepOnWcif(accWcif, roundId, step);
    }, wcif);

const optimizeCapturedContexts = (
  wcif: Competition,
  baseWcif: Competition,
  contexts: OptimizationContext[]
) => {
  let optimizedWcif = wcif;

  for (let pass = 0; pass < 2; pass += 1) {
    for (const context of contexts) {
      if (context.maxClusterSize && context.cluster.length > context.maxClusterSize) {
        continue;
      }

      optimizedWcif = optimizeAssignmentsGlobally({
        beforeWcif: baseWcif,
        wcif: optimizedWcif,
        cluster: context.cluster,
        activities: context.activities,
        assignmentCode: context.assignmentCode,
        constraints: context.constraints,
        options: context.options,
        maxPasses: context.maxPasses,
        maxEvaluations: context.maxEvaluations,
      });
    }
  }

  return optimizedWcif;
};

export const runRecipeOnWcif = (wcif: Competition, action: RunRecipeOnWcifPayload): Competition =>
  setRoundRecipeConfig(
    runRecipeStepsOnWcif(wcif, action),
    action.roundId,
    action.recipeId
  );

export const runRecipesOnWcif = (
  wcif: Competition,
  action: RunRecipesOnWcifPayload
): Competition =>
  action.roundIds.reduce(
    (accWcif, roundId) => runRecipeOnWcif(accWcif, { roundId, recipeId: action.recipeId }),
    wcif
  );

export const runBulkRecipesOnWcif = (
  wcif: Competition,
  {
    recipeId,
    roundIds,
    onProgress,
  }: RunRecipesOnWcifPayload & {
    onProgress?: (progress: BulkGenerationProgress) => void;
  }
): Competition => {
  const competitorOptimizationContexts: OptimizationContext[] = [];
  const staffOptimizationContexts: OptimizationContext[] = [];
  let generatedWcif = wcif;

  for (const roundId of roundIds) {
    onProgress?.({ phase: 'generating', roundId });
    generatedWcif = runRecipeStepsOnWcif(generatedWcif, {
      roundId,
      recipeId,
      stepFilter: (step) => step.type === 'groups' || isCompetitorAssignmentStep(step),
      onOptimizationContext: (context) => {
        if (context.assignmentCode === 'competitor') {
          competitorOptimizationContexts.push(context);
        }
      },
    });
  }

  if (competitorOptimizationContexts.length) {
    onProgress?.({ phase: 'fixing' });
    generatedWcif = optimizeCapturedContexts(
      generatedWcif,
      wcif,
      competitorOptimizationContexts
    );
  }

  for (const roundId of roundIds) {
    onProgress?.({ phase: 'staff', roundId });
    generatedWcif = runRecipeStepsOnWcif(generatedWcif, {
      roundId,
      recipeId,
      stepFilter: isStaffAssignmentStep,
      onOptimizationContext: (context) => {
        if (context.assignmentCode !== 'competitor') {
          staffOptimizationContexts.push(context);
        }
      },
    });
  }

  if (staffOptimizationContexts.length) {
    onProgress?.({ phase: 'fixing' });
    generatedWcif = optimizeCapturedContexts(generatedWcif, wcif, staffOptimizationContexts);
  }

  const completedWcif = setRoundRecipeConfigs(generatedWcif, roundIds, recipeId);

  // eslint-disable-next-line no-console
  console.debug(
    '[BulkGeneration] competitors with immediate helping -> competing assignments:',
    countPeopleWithImmediateHelpingThenCompetingAssignments(completedWcif)
  );

  return completedWcif;
};
