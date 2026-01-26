import {
  type AttemptResult,
  decodeMultiResult,
  type EventId,
  formatCentiseconds,
  formatMultiResult,
  type RankingType,
} from '@wca/helpers';

const isValidResult = (result: AttemptResult | null | undefined) =>
  result !== null && result !== undefined && !Number.isNaN(result as number);

const formatFewestMovesAverage = (result: AttemptResult) => ((result as number) / 100).toFixed(2);

export const formatSeedResult = (
  eventId: EventId,
  rankingType: RankingType,
  result?: AttemptResult
) => {
  if (!result) {
    return '-';
  }

  if (!isValidResult(result)) {
    return undefined;
  }

  if (eventId === '333mbf') {
    return formatMultiResult(decodeMultiResult(result));
  }

  if (eventId === '333fm') {
    return rankingType === 'average'
      ? formatFewestMovesAverage(result)
      : (result as number).toString();
  }

  return formatCentiseconds(result as number);
};
