import { parseActivityCode } from '../domain/activities';
import { type AdvancementCondition, type Event, type ParticipationRuleset, type Round } from '@wca/helpers';

export interface DualRoundDetails {
  linkedRoundIds: string[];
  targetRoundId: string;
  isSourceRound: boolean;
  isTargetRound: boolean;
}

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
): boolean => {
  const round = event.rounds.find((candidate) => candidate.id === roundId);

  if (!round) {
    return false;
  }

  if (hasLegacyAdvancementCondition(round)) {
    return true;
  }

  const nextRound = event.rounds.find((candidate) => {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;
    return participationSource?.type === 'linkedRounds' && participationSource.roundIds.includes(roundId);
  });

  return Boolean(nextRound);
};

export const getDisplayAdvancementConditionForRound = (
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

export const getDualRoundDetails = (
  event: Event,
  roundId: string
): DualRoundDetails | null => {
  for (const candidate of event.rounds) {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;

    if (participationSource?.type !== 'linkedRounds' || participationSource.roundIds.length < 2) {
      continue;
    }

    if (candidate.id === roundId) {
      return {
        linkedRoundIds: participationSource.roundIds,
        targetRoundId: candidate.id,
        isSourceRound: false,
        isTargetRound: true,
      };
    }

    if (participationSource.roundIds.includes(roundId)) {
      return {
        linkedRoundIds: participationSource.roundIds,
        targetRoundId: candidate.id,
        isSourceRound: true,
        isTargetRound: false,
      };
    }
  }

  return null;
};
