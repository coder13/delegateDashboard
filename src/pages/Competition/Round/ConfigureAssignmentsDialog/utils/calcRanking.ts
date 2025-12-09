import type { AttemptResult, Person } from '@wca/helpers';

export function calcRanking(
  person: Person & {
    seedResult?: {
      average?: AttemptResult;
      single?: AttemptResult;
    };
  },
  lastPerson?: Person & {
    seedResult?: {
      ranking?: number;
      average?: AttemptResult;
      single?: AttemptResult;
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
