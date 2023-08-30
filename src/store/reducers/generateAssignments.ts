import { Competition } from '@wca/helpers';
import { Generators, Generator, Constraints } from 'wca-group-generators';
import { hydrateStep } from '../../lib/recipes';

export function generateAssignments(state: { wcif: Competition }, action) {
  console.log(13, action);

  const wcif = action.recipe.steps.reduce((wcif, step) => {
    const hydratedStep = hydrateStep(wcif, action.roundId, step);
    console.log(58, hydratedStep);

    const generator = Generators[step.generator] as Generator;

    if (!generator) {
      throw new Error(`Generator ${step.generator} not found`);
    }

    const constraints =
      hydratedStep.props.constraints.map((c) => {
        if (!Constraints[c.constraint]) {
          throw new Error(`Constraint ${c.constraint} not found`);
        }

        return {
          constraint: Constraints[c.constraint],
          weight: c.weight,
        };
      }) || [];

    return generator.execute({
      wcif,
      ...hydratedStep.props,
      constraints,
    });
  }, state.wcif);

  return {
    ...state,
    wcif,
  };
}
