export const advancingCompetitors = (advancementCondition, count) => {
  if (advancementCondition.type === 'percent') {
    return Math.round((advancementCondition.level / 100) * count)
  } else if (advancementCondition.type === 'ranking') {
    return Math.min(count, advancementCondition.level)
  }
}