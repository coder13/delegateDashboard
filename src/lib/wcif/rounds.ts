import { parseActivityCode } from '../domain/activities';
import {
  formatCentiseconds,
  type Event,
  type ParticipationRuleset,
  type ResultCondition,
  type Round,
} from '@wca/helpers';

export interface DualRoundDetails {
  linkedRoundIds: string[];
  targetRoundId: string;
  isSourceRound: boolean;
  isTargetRound: boolean;
}

export const getParticipationRuleset = (round: Round): ParticipationRuleset | null =>
  round.participationRuleset;

export const usesRegistrationParticipation = (round: Round): boolean => {
  const participationSource = getParticipationRuleset(round)?.participationSource;

  if (participationSource?.type === 'registrations') {
    return true;
  }

  return parseActivityCode(round.id).roundNumber === 1;
};

export const getDerivedAdvancementCondition = (round: Round): ResultCondition | null => {
  const participationSource = getParticipationRuleset(round)?.participationSource;

  if (participationSource?.type !== 'linkedRounds' && participationSource?.type !== 'round') {
    return null;
  }

  return participationSource.resultCondition;
};

export const formatAdvancementCondition = (
  advancementCondition: ResultCondition | null | undefined
): string => {
  if (!advancementCondition) {
    return '';
  }

  const { type, value } = advancementCondition;

  switch (type) {
    case 'ranking':
      return `Top ${value}`;
    case 'percent':
      return `Top ${value}%`;
    case 'resultAchieved':
      if (value === null) {
        return 'Any result';
      }

      if (value === -2) {
        return '> DNS';
      }

      if (value === -1) {
        return '> DNF';
      }

      return `< ${formatCentiseconds(value)}`;
    default:
      return '';
  }
};

export const getAdvancementConditionForRound = (event: Event, roundId: string): boolean => {
  return event.rounds.some((candidate) => {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;

    return (
      (participationSource?.type === 'round' && participationSource.roundId === roundId) ||
      (participationSource?.type === 'linkedRounds' &&
        participationSource.roundIds.includes(roundId))
    );
  });
};

export const getDisplayAdvancementConditionForRound = (
  event: Event,
  roundId: string
): ResultCondition | null => {
  const nextRound = event.rounds.find((candidate) => {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;
    return (
      (participationSource?.type === 'round' && participationSource.roundId === roundId) ||
      (participationSource?.type === 'linkedRounds' &&
        participationSource.roundIds.includes(roundId))
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

const findSeededTargetRound = (event: Event, roundId: string): Round | undefined =>
  event.rounds.find((candidate) => {
    const participationSource = getParticipationRuleset(candidate)?.participationSource;
    return (
      (participationSource?.type === 'round' && participationSource.roundId === roundId) ||
      (participationSource?.type === 'linkedRounds' &&
        participationSource.roundIds.includes(roundId))
    );
  });

const conditionText = (condition: ResultCondition | null): string =>
  formatAdvancementCondition(condition);

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
    return `${conditionText(participationSource.resultCondition)} from dual rounds ${sourceRounds}`;
  }

  if (participationSource?.type === 'round') {
    return `${conditionText(participationSource.resultCondition)} from previous round`;
  }

  if (participationSource?.type === 'registrations') {
    return 'Open to all registered competitors';
  }

  return null;
};

export const getParticipationConditionTextForRound = (
  event: Event,
  roundId: string
): string | null => {
  const round = event.rounds.find((candidate) => candidate.id === roundId);

  if (!round) {
    return null;
  }

  const nextRound = findSeededTargetRound(event, roundId);

  if (!nextRound) {
    return null;
  }

  const nextParticipationSource = getParticipationRuleset(nextRound)?.participationSource;

  if (nextParticipationSource?.type === 'linkedRounds') {
    const sourceRounds = nextParticipationSource.roundIds.map(formatShortRoundLabel).join(' & ');
    return `${conditionText(nextParticipationSource.resultCondition)} from dual rounds ${sourceRounds} to ${formatLongRoundLabel(nextRound.id)}`;
  }

  if (nextParticipationSource?.type === 'round') {
    return `${conditionText(nextParticipationSource.resultCondition)} to ${formatLongRoundLabel(nextRound.id)}`;
  }

  return null;
};

export const getNextRoundParticipationTextForRound = (
  event: Event,
  roundId: string
): string | null => {
  const nextRound = findSeededTargetRound(event, roundId);

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
