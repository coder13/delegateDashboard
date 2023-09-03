import { Competition } from '@wca/helpers';
import { Generators, Generator, Constraints } from 'wca-group-generators';
import { findRoundActivitiesById } from '../../lib/activities';
import { createGroupsAcrossStages } from '../../lib/groups';
import { hydrateStep } from '../../lib/recipes';
import { mapIn } from '../../lib/utils';

export function generateAssignments(state: { wcif: Competition }, action) {
  const wcif = action.recipe.steps.reduce((wcif, step) => {
    if (step.type === 'assignments') {
      const generator = Generators[step.props.generator] as Generator;

      if (!generator) {
        throw new Error(`Generator ${step.props.generator} not found`);
      }
      const hydratedStep = hydrateStep(wcif, action.roundId, step);
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
    } else if (step.type === 'groups') {
      const roundActivities = findRoundActivitiesById(wcif, action.roundId);
      const roundActivitiesWithGroups = createGroupsAcrossStages(wcif, roundActivities, {
        spreadGroupsAcrossAllStages: true,
        groups: step.props.count,
      });

      return {
        ...wcif,
        schedule: mapIn(wcif.schedule, ['venues'], (venue) =>
          mapIn(venue, ['rooms'], (room) =>
            mapIn(room, ['activities'], (activity) =>
              roundActivitiesWithGroups.find((roundActivity) => roundActivity.id === activity.id)
                ? roundActivitiesWithGroups.find(
                    (roundActivity) => roundActivity.id === activity.id
                  )
                : activity
            )
          )
        ),
      };
    }

    return wcif;
  }, state.wcif);

  return {
    ...state,
    wcif,
  };
}
