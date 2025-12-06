interface PercentAdvancementCondition {
  type: 'percent';
  level: number;
}

interface RankingAdvancementCondition {
  type: 'ranking';
  level: number;
}

type AdvancementCondition = PercentAdvancementCondition | RankingAdvancementCondition;

/**
 * @returns number of advancing competitors
 */
export const advancingCompetitors = (
  advancementCondition: AdvancementCondition,
  count: number
): number => {
  if (advancementCondition.type === 'percent') {
    return Math.round((advancementCondition.level / 100) * count);
  } else if (advancementCondition.type === 'ranking') {
    return Math.min(count, advancementCondition.level);
  }
  return 0;
};
