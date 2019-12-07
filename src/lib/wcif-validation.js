import { flatMap } from './utils';
import { activityCodeToName, roundActivities } from './activities';

export const validateWcif = wcif => {
  const { events } = wcif;
  const eventRoundErrors = flatMap(events, event => {
    if (event.rounds.length === 0)
      return [`No rounds specified for ${activityCodeToName(event.id)}.`];
    const advancementConditionErrors = flatMap(
      event.rounds.slice(0, -1),
      round =>
        round.advancementCondition
          ? []
          : [
              `No advancement condition specified for ${activityCodeToName(
                round.id
              )}.`,
            ]
    );
    const roundActivityErrors = flatMap(event.rounds, round =>
      roundActivities(wcif, round.id).length > 0
        ? []
        : [`No schedule activities for ${activityCodeToName(round.id)}.`]
    );
    return [...advancementConditionErrors, ...roundActivityErrors];
  });
  return eventRoundErrors;
};
