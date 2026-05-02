import { parseActivityCode } from '../domain/activities';
import { type AdvancementCondition, type Event, type ParticipationRuleset, type Round } from '@wca/helpers';

const hasLegacyAdvancementCondition = (
  round: Round
): round is Round & { advancementCondition: AdvancementCondition } =>
  round.advancementCondition !== null;

export const getParticipationRuleset = (round: Round): ParticipationRuleset | null =>
  round.participationRuleset ?? null;

export const usesRegistrationParticipation = (round: Round): boolean => {
  const participationSource = getParticipationRuleset(round)?.participationSource;

  if (participationSource?.type === 'registrations') {
    return true;
  }

  return parseActivityCode(round.id).roundNumber === 1;
};

export const getDerivedAdvancementCondition = (
  round: Round
): AdvancementCondition | null => {
  const participationSource = getParticipationRuleset(round)?.participationSource;

  if (participationSource?.type !== 'linkedRounds') {
    return null;
  }

  return {
    type: participationSource.resultCondition.type,
    level: participationSource.resultCondition.value,
  };
};

export const getAdvancementConditionForRound = (
  event: Event,
  roundId: string
): AdvancementCondition | null => {
  const round = event.rounds.find((candidate) => candidate.id === roundId);

  if (!round) {
    return null;
  }

  if (hasLegacyAdvancementCondition(round)) {
    return round.advancementCondition;
  }

  const nextRound = event.rounds.find((candidate) => {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;
    return participationSource?.type === 'linkedRounds' && participationSource.roundIds.includes(roundId);
  });

  return nextRound ? getDerivedAdvancementCondition(nextRound) : null;
};
