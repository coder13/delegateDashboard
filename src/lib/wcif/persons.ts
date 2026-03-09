import { parseActivityCode } from '../domain/activities/activityCode';
import { roundFormatById } from '../domain/events';
import { findPR } from '../domain/persons';
import { type Competition, type Person, type AttemptResult } from '@wca/helpers';

/** WCIF Person Lookup Functions */

/**
 * Finds a result for a person from a specific round
 * @param wcif - The competition WCIF
 * @param roundActivityCode - The round activity code
 * @param personId - The person's registrant ID
 * @returns Object with average and single results, or undefined
 */
export const findResultFromRound = (
  wcif: Competition,
  roundActivityCode: string,
  personId: number
) => {
  const { eventId } = parseActivityCode(roundActivityCode);

  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === roundActivityCode);

  if (!round) {
    return;
  }

  const { format, results } = round;
  const roundFormat = roundFormatById(format);
  const result = results?.find((r) => r.personId === personId);

  if (!result || !roundFormat) {
    return;
  }

  return {
    average: roundFormat.rankingResult === 'average' ? result.average : undefined,
    single: result.best,
  };
};

export type SeedResult = {
  average?: AttemptResult;
  single?: AttemptResult;
};

/**
 * Returns the seed result for a person based on the round
 * Will be an average if it exists if not a single
 * @param wcif - The competition WCIF
 * @param activityCode - The activity code
 * @param person - The person to get seed result for
 * @returns Seed result with average/single, or undefined
 */
export const getSeedResult = (
  wcif: Competition,
  activityCode: string,
  person: Person
): SeedResult | undefined => {
  const { eventId, roundNumber } = parseActivityCode(activityCode);

  if (!roundNumber) {
    return;
  }

  const roundId = `${eventId}-r${roundNumber}`;
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === roundId);
  const roundFormat = roundFormatById(round?.format);

  if (!roundFormat) {
    return;
  }

  // if activity is round 1, then return pr result
  if (roundNumber === 1) {
    const average = findPR(person.personalBests || [], eventId, 'average');
    const single = findPR(person.personalBests || [], eventId, 'single');

    return {
      average: average?.best,
      single: single?.best,
    };
  }

  return findResultFromRound(wcif, `${eventId}-r${roundNumber - 1}`, person.registrantId);
};
