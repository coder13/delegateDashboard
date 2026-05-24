import type { Activity, Competition } from '@wca/helpers';
import type { GroupStep } from './types';

const isFinalRound = (wcif: Competition, roundId: string) => {
  const event = wcif.events.find((candidateEvent) =>
    candidateEvent.rounds.some((round) => round.id === roundId)
  );
  if (!event) return false;

  return event.rounds[event.rounds.length - 1]?.id === roundId;
};

const hasGroupActivities = (roundActivities: Activity[]) =>
  roundActivities.some((roundActivity) => (roundActivity.childActivities ?? []).length > 0);

export const shouldRunGroupStep = (
  wcif: Competition,
  roundId: string,
  roundActivities: Activity[],
  step: GroupStep
) => {
  switch (step.props.condition) {
    case 'missingGroupsInFinalRound':
      return isFinalRound(wcif, roundId) && !hasGroupActivities(roundActivities);
    default:
      return true;
  }
};
