import { activityCodeToName, allActivities, roundActivities } from './activities';
import { acceptedRegistrations } from './persons';
import { flatMap } from './utils';

export const MISSING_ADVANCEMENT_CONDITION = 'missing_advancement_condition';
export const NO_SCHEDULE_ACTIVITIES_FOR_ROUND = 'no_schedule_activities_for_round';
export const NO_ROUNDS_FOR_ACTIVITY = 'no_rounds_for_activity';
export const MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT = 'missing_activity_for_person_assignment';

export const validateWcif = (wcif) => {
  const { events, persons } = wcif;

  const eventRoundErrors = flatMap(events, (event) => {
    if (event.rounds.length === 0)
      return [
        {
          type: NO_ROUNDS_FOR_ACTIVITY,
          message: `No rounds specified for ${activityCodeToName(event.id)}.`,
          data: {
            eventId: event.id,
          },
        },
      ];

    const advancementConditionErrors = flatMap(event.rounds.slice(0, -1), (round) =>
      round.advancementCondition
        ? []
        : [
            {
              type: MISSING_ADVANCEMENT_CONDITION,
              message: `No advancement condition specified for ${activityCodeToName(round.id)}.`,
              data: {
                eventId: event.id,
                activityCode: round.id,
              },
            },
          ]
    );

    const roundActivityErrors = flatMap(event.rounds, (round) =>
      roundActivities(wcif, round.id).length > 0
        ? []
        : [
            {
              type: NO_SCHEDULE_ACTIVITIES_FOR_ROUND,
              message: `No schedule activities for ${activityCodeToName(round.id)}.`,
              data: {
                eventId: event.id,
                activityCode: round.id,
              },
            },
          ]
    );
    return [...advancementConditionErrors, ...roundActivityErrors];
  });

  const personAssignmentMissingActivityErrors = [];

  const allActivityIds = allActivities(wcif).map((activity) => activity.id);

  acceptedRegistrations(persons).forEach((person) => {
    person.assignments.forEach((assignment) => {
      if (allActivityIds.indexOf(assignment.activityId) === -1) {
        personAssignmentMissingActivityErrors.push({
          type: MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
          message: `${person.name} (id: ${person.registrantId}) has assignment for activity that does not exist`,
          data: {
            person,
            assignment,
          },
        });
      }
    });
  });

  return [...eventRoundErrors, ...personAssignmentMissingActivityErrors];
};
