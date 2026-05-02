import { parseActivityCode } from '../domain/activities';
import { formatCentiseconds, type AdvancementCondition, type Event, type ParticipationRuleset, type Round } from '@wca/helpers';

export interface DualRoundDetails {
  linkedRoundIds: string[];
  targetRoundId: string;
  isSourceRound: boolean;
  isTargetRound: boolean;
}

const hasLegacyAdvancementCondition = (
  round: Round
): round is Round & { advancementCondition: AdvancementCondition } =>
  round.advancementCondition != null;

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

export const formatAdvancementCondition = (
  advancementCondition: AdvancementCondition | null | undefined
): string => {
  if (!advancementCondition) {
    return '';
  }

  const { type, level } = advancementCondition;

  switch (type) {
    case 'ranking':
      return `Top ${level}`;
    case 'percent':
      return `Top ${level}%`;
    case 'attemptResult':
      if (level === -2) {
        return '> DNS';
      }

      if (level === -1) {
        return '> DNF';
      }

      return `< ${formatCentiseconds(level)}`;
    default:
      return '';
  }
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

  return getParticipationRuleset(round) !== null;
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

const formatShortRoundLabel = (roundId: string): string => {
  const { roundNumber } = parseActivityCode(roundId);
  return roundNumber ? `R${roundNumber}` : roundId;
};

const formatLongRoundLabel = (roundId: string): string => {
  const { roundNumber } = parseActivityCode(roundId);
  return roundNumber ? `round ${roundNumber}` : roundId;
};

const findLinkedTargetRound = (event: Event, roundId: string): Round | undefined =>
  event.rounds.find((candidate) => {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;
    return participationSource?.type === 'linkedRounds' && participationSource.roundIds.includes(roundId);
  });

export const getParticipationConditionTextForRound = (
  event: Event,
  roundId: string
): string | null => {
  const round = event.rounds.find((candidate) => candidate.id === roundId);

  if (!round) {
    return null;
  }

  const participationSource = getParticipationRuleset(round)?.participationSource;

  if (participationSource?.type === 'linkedRounds') {
    const sourceRounds = participationSource.roundIds.map(formatShortRoundLabel).join(' & ');
    return `${formatAdvancementCondition({
      type: participationSource.resultCondition.type,
      level: participationSource.resultCondition.value,
    })} from dual rounds ${sourceRounds} to ${formatLongRoundLabel(round.id)}`;
  }

  if (hasLegacyAdvancementCondition(round)) {
    const currentRoundIndex = event.rounds.findIndex((candidate) => candidate.id === roundId);
    const nextRound = currentRoundIndex >= 0 ? event.rounds[currentRoundIndex + 1] : undefined;
    const advancementText = formatAdvancementCondition(round.advancementCondition);

    return nextRound && advancementText
      ? `${advancementText} to ${formatLongRoundLabel(nextRound.id)}`
      : null;
  }

  const linkedTargetRound = findLinkedTargetRound(event, roundId);

  if (!linkedTargetRound) {
    return null;
  }

  return getParticipationConditionTextForRound(event, linkedTargetRound.id);
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

export const isAlwaysVisibleRound = (event: Event, round: Round): boolean => {
  const { roundNumber } = parseActivityCode(round.id);

  if (roundNumber === 1) {
    return true;
  }

  const dualRoundDetails = getDualRoundDetails(event, round.id);
  return Boolean(dualRoundDetails?.isSourceRound && usesRegistrationParticipation(round));
};
