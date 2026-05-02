import { parseActivityCode } from '../domain/activities';
import {
  formatCentiseconds,
  type AdvancementCondition,
  type Event,
  type ParticipationRuleset,
  type Round,
} from '@wca/helpers';

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

export const getDerivedAdvancementCondition = (round: Round): AdvancementCondition | null => {
  const participationSource = getParticipationRuleset(round)?.participationSource;

  if (participationSource?.type !== 'linkedRounds' && participationSource?.type !== 'round') {
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

export const getAdvancementConditionForRound = (event: Event, roundId: string): boolean => {
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
    return (
      participationSource?.type === 'linkedRounds' && participationSource.roundIds.includes(roundId)
    );
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
    return (
      participationSource?.type === 'linkedRounds' && participationSource.roundIds.includes(roundId)
    );
  });

const findPreviousRound = (event: Event, roundId: string): Round | undefined => {
  const currentRoundIndex = event.rounds.findIndex((candidate) => candidate.id === roundId);
  return currentRoundIndex > 0 ? event.rounds[currentRoundIndex - 1] : undefined;
};

const findNextSequentialRound = (event: Event, roundId: string): Round | undefined => {
  const currentRoundIndex = event.rounds.findIndex((candidate) => candidate.id === roundId);
  return currentRoundIndex >= 0 ? event.rounds[currentRoundIndex + 1] : undefined;
};

const findNextSeededRound = (event: Event, roundId: string): Round | undefined =>
  findLinkedTargetRound(event, roundId) ?? findNextSequentialRound(event, roundId);

export const getParticipationSourceTextForRound = (
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
    })} from dual rounds ${sourceRounds}`;
  }

  if (participationSource?.type === 'round') {
    return `${formatAdvancementCondition({
      type: participationSource.resultCondition.type,
      level: participationSource.resultCondition.value,
    })} from previous round`;
  }

  if (participationSource?.type === 'registrations') {
    return 'Open to all registered competitors';
  }

  const previousRound = findPreviousRound(event, roundId);

  if (previousRound && hasLegacyAdvancementCondition(previousRound)) {
    const advancementText = formatAdvancementCondition(previousRound.advancementCondition);
    return advancementText ? `${advancementText} from previous round` : null;
  }

  const linkedTargetRound = findLinkedTargetRound(event, roundId);

  if (!linkedTargetRound) {
    return null;
  }

  return getParticipationSourceTextForRound(event, linkedTargetRound.id);
};

export const getParticipationConditionTextForRound = (
  event: Event,
  roundId: string
): string | null => {
  const round = event.rounds.find((candidate) => candidate.id === roundId);

  if (!round) {
    return null;
  }

  const linkedTargetRound = findLinkedTargetRound(event, roundId);

  if (linkedTargetRound) {
    const linkedTargetSource = getParticipationRuleset(linkedTargetRound)?.participationSource;

    if (linkedTargetSource?.type === 'linkedRounds') {
      const sourceRounds = linkedTargetSource.roundIds.map(formatShortRoundLabel).join(' & ');
      return `${formatAdvancementCondition({
        type: linkedTargetSource.resultCondition.type,
        level: linkedTargetSource.resultCondition.value,
      })} from dual rounds ${sourceRounds} to ${formatLongRoundLabel(linkedTargetRound.id)}`;
    }

    if (linkedTargetSource?.type === 'round') {
      return `${formatAdvancementCondition({
        type: linkedTargetSource.resultCondition.type,
        level: linkedTargetSource.resultCondition.value,
      })} to ${formatLongRoundLabel(linkedTargetRound.id)}`;
    }
  }

  const nextRound = findNextSequentialRound(event, roundId);

  if (!nextRound) {
    return null;
  }

  const nextParticipationSource = getParticipationRuleset(nextRound)?.participationSource;

  if (nextParticipationSource?.type === 'linkedRounds') {
    const sourceRounds = nextParticipationSource.roundIds.map(formatShortRoundLabel).join(' & ');
    return `${formatAdvancementCondition({
      type: nextParticipationSource.resultCondition.type,
      level: nextParticipationSource.resultCondition.value,
    })} from dual rounds ${sourceRounds} to ${formatLongRoundLabel(nextRound.id)}`;
  }

  if (nextParticipationSource?.type === 'round') {
    return `${formatAdvancementCondition({
      type: nextParticipationSource.resultCondition.type,
      level: nextParticipationSource.resultCondition.value,
    })} to ${formatLongRoundLabel(nextRound.id)}`;
  }

  if (hasLegacyAdvancementCondition(round)) {
    const advancementText = formatAdvancementCondition(round.advancementCondition);
    return advancementText ? `${advancementText} to next round` : null;
  }

  return null;
};

export const getNextRoundParticipationTextForRound = (
  event: Event,
  roundId: string
): string | null => {
  const nextRound = findNextSeededRound(event, roundId);

  if (!nextRound) {
    return null;
  }

  return getParticipationSourceTextForRound(event, nextRound.id);
};

export const getDualRoundDetails = (event: Event, roundId: string): DualRoundDetails | null => {
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
