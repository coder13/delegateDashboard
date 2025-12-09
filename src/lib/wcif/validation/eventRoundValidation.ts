import { activityCodeToName, findAllRoundActivities } from '../../domain';
import {
  MISSING_ADVANCEMENT_CONDITION,
  NO_ROUNDS_FOR_ACTIVITY,
  NO_SCHEDULE_ACTIVITIES_FOR_ROUND,
  type ValidationError,
} from './types';
import type { Competition, Event } from '@wca/helpers';
import { flatMap } from 'lodash';

/**
 * Validates that an event has at least one round configured
 */
export const validateEventHasRounds = (event: Event): ValidationError | null => {
  if (event.rounds.length === 0) {
    return {
      type: NO_ROUNDS_FOR_ACTIVITY,
      key: [NO_ROUNDS_FOR_ACTIVITY, event.id].join('-'),
      message: `No rounds specified for ${activityCodeToName(event.id)}.`,
      data: {
        eventId: event.id,
      },
    };
  }
  return null;
};

/**
 * Validates that all non-final rounds have advancement conditions
 */
export const validateAdvancementConditions = (event: Event): ValidationError[] => {
  return flatMap(event.rounds.slice(0, -1), (round) =>
    round.advancementCondition
      ? []
      : [
          {
            type: MISSING_ADVANCEMENT_CONDITION,
            key: [MISSING_ADVANCEMENT_CONDITION, event.id, round.id].join('-'),
            message: `No advancement condition specified for ${activityCodeToName(round.id)}.`,
            data: {
              eventId: event.id,
              activityCode: round.id,
            },
          },
        ]
  );
};

/**
 * Validates that all rounds have corresponding schedule activities
 */
export const validateRoundsHaveScheduleActivities = (
  wcif: Competition,
  event: Event
): ValidationError[] => {
  const allRoundActivities = findAllRoundActivities(wcif);

  return flatMap(event.rounds, (round) => {
    const hasScheduleActivity = allRoundActivities.some((activity) =>
      activity.activityCode.startsWith(round.id)
    );

    return hasScheduleActivity
      ? []
      : [
          {
            type: NO_SCHEDULE_ACTIVITIES_FOR_ROUND,
            key: [NO_SCHEDULE_ACTIVITIES_FOR_ROUND, event.id, round.id].join('-'),
            message: `No schedule activities for ${activityCodeToName(round.id)}.`,
            data: {
              eventId: event.id,
              activityCode: round.id,
            },
          },
        ];
  });
};

/**
 * Validates all event and round-related requirements
 */
export const validateEventRounds = (wcif: Competition): ValidationError[] => {
  return flatMap(wcif.events, (event) => {
    const noRoundsError = validateEventHasRounds(event);
    if (noRoundsError) {
      return [noRoundsError];
    }

    const advancementErrors = validateAdvancementConditions(event);
    const scheduleActivityErrors = validateRoundsHaveScheduleActivities(wcif, event);

    return [...advancementErrors, ...scheduleActivityErrors];
  });
};
