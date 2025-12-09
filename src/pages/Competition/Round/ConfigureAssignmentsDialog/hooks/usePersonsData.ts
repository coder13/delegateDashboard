import {
  acceptedRegistration,
  byPROrResult,
  getSeedResult,
  isOrganizerOrDelegate,
  registeredForEvent,
  shouldBeInRound,
} from '../../../../../lib/domain/persons';
import type { CompetitorSort, PersonWithSeedResult } from '../types';
import { calcRanking } from '../utils/calcRanking';
import type { Competition, Event, EventId, Round } from '@wca/helpers';
import { useMemo } from 'react';

export function usePersonsData(
  wcif: Competition | null,
  event: Event | undefined,
  round: Round,
  activityCode: string,
  roundNumber: number,
  showAllCompetitors: boolean,
  showCompetitorsNotInRound: boolean,
  competitorSort: CompetitorSort,
  eventId: EventId
): PersonWithSeedResult[] {
  const isRegistered = useMemo(() => registeredForEvent(eventId), [eventId]);

  return useMemo(() => {
    if (!wcif?.persons || !event) {
      return [];
    }

    const personsWithSeedResult = wcif.persons
      .filter((p) => {
        // if competitor does not have an accepted registration, do not show them
        if (!acceptedRegistration(p)) {
          return false;
        }

        // If we want to show every anyways, return true
        if (showCompetitorsNotInRound) {
          return true;
        }

        // Else make sure they are registered and should be in the round.
        return isRegistered(p) && round && shouldBeInRound(round)(p);
      })
      .map((person) => ({
        ...person,
        seedResult: getSeedResult(wcif, activityCode, person),
      }))
      .sort((a, b) => byPROrResult(event, roundNumber)(a, b));

    return personsWithSeedResult
      .reduce<Array<(typeof personsWithSeedResult)[number] & { seedResult: { ranking: number } }>>(
        (persons, person) => {
          const lastPerson = persons[persons.length - 1];

          return [
            ...persons,
            {
              ...person,
              seedResult: {
                ...person.seedResult,
                ranking: calcRanking(person, lastPerson),
              },
            },
          ];
        },
        []
      )
      .filter(
        (p) =>
          showAllCompetitors ||
          isOrganizerOrDelegate(p) ||
          p.roles?.some((r) => r.indexOf('staff') > -1)
      )
      .sort((a, b) => {
        if (competitorSort === 'speed') {
          return 0;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    activityCode,
    competitorSort,
    event,
    isRegistered,
    round,
    roundNumber,
    showAllCompetitors,
    showCompetitorsNotInRound,
    wcif,
  ]);
}
