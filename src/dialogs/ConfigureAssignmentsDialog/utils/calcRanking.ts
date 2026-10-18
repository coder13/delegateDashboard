import type { Person, ResultValue } from '@wca/helpers';

export function calcRanking(
  person: Person & {
    seedResult?: {
      average?: ResultValue;
      single?: ResultValue;
    };
  },
  lastPerson?: Person & {
    seedResult?: {
      ranking?: number;
      average?: ResultValue;
      single?: ResultValue;
    };
  }
) {
  if (!lastPerson?.seedResult?.ranking) {
    return 1;
  }

  if (
    (lastPerson?.seedResult?.average &&
      person.seedResult?.average !== lastPerson.seedResult.average) ||
    (lastPerson?.seedResult?.single && person.seedResult?.single !== lastPerson.seedResult.single)
  ) {
    return lastPerson.seedResult.ranking + 1;
  }

  return lastPerson.seedResult.ranking;
}
