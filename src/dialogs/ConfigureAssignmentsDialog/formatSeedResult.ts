import {
  type ResultValue,
  decodeMultiResult,
  type EventId,
  formatCentiseconds,
  formatMultiResult,
  type RankingType,
} from '@wca/helpers';

const isValidResult = (result: ResultValue | null | undefined) =>
  result !== null && result !== undefined && !Number.isNaN(result as number);

const formatFewestMovesAverage = (result: ResultValue) => (result / 100).toFixed(2);

export const formatSeedResult = (
  eventId: EventId,
  rankingType: RankingType,
  result?: ResultValue
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
