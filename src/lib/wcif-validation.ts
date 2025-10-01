import { Activity, Assignment, Competition, Person, Room } from '@wca/helpers';
import {
  activitiesOverlap,
  activityCodeToName,
  findActivityById,
  findAllActivities,
  findAllRoundActivities,
  roomByActivity,
} from './activities';
import { acceptedRegistrations } from './persons';
import { flatMap, pluralizeWord } from './utils';

export const MISSING_ADVANCEMENT_CONDITION = 'missing_advancement_condition';
export const NO_SCHEDULE_ACTIVITIES_FOR_ROUND = 'no_schedule_activities_for_round';
export const NO_ROUNDS_FOR_ACTIVITY = 'no_rounds_for_activity';
export const MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT = 'missing_activity_for_person_assignment';
export const PERSON_ASSIGNMENT_SCHEDULE_CONFLICT = 'person_assignment_schedule_conflict';

interface WcifError {
  type: string;
  key: string;
  message: string;
  data: any;
}

interface ConflictingAssignment {
  id: string;
  assignmentA: Assignment & { activity: Activity; room: Room };
  assignmentB: Assignment & { activity: Activity; room: Room };
}

export const validateWcif = (wcif: Competition): WcifError[] => {
  const { events, persons } = wcif;

  const eventRoundErrors = flatMap(events, (event) => {
    if (event.rounds.length === 0)
      return [
        {
          type: NO_ROUNDS_FOR_ACTIVITY,
          key: [NO_ROUNDS_FOR_ACTIVITY, event.id].join('-'),
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
              key: [MISSING_ADVANCEMENT_CONDITION, event.id, round.id].join('-'),
              message: `No advancement condition specified for ${activityCodeToName(round.id)}.`,
              data: {
                eventId: event.id,
                activityCode: round.id,
              },
            },
          ]
    );

    const roundActivityErrors = flatMap(event.rounds, (round) => {
      return findAllRoundActivities(wcif).filter((a) => a.activityCode.startsWith(round.id))
        .length > 0
        ? []
        : [
            {
              type: NO_SCHEDULE_ACTIVITIES_FOR_ROUND,
              key: [MISSING_ADVANCEMENT_CONDITION, event.id, round.id].join('-'),
              message: `No schedule activities for ${activityCodeToName(round.id)}.`,
              data: {
                eventId: event.id,
                activityCode: round.id,
              },
            },
          ];
    });
    return [...advancementConditionErrors, ...roundActivityErrors];
  });

  const personAssignmentMissingActivityErrors: WcifError[] = [];

  const allActivityIds = findAllActivities(wcif).map((activity) => activity.id);

  acceptedRegistrations(persons).forEach((person) => {
    if (!person.assignments) return;
    
    person.assignments.forEach((assignment) => {
      if (allActivityIds.indexOf(assignment.activityId) > -1) {
        return;
      }

      personAssignmentMissingActivityErrors.push({
        type: MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
        key: [
          MISSING_ACTIVITY_FOR_PERSON_ASSIGNMENT,
          person.registrantId,
          assignment.activityId,
        ].join('-'),
        message: `${person.name} (id: ${person.registrantId}) has assignment for activity that does not exist`,
        data: {
          person,
          assignment,
        },
      });
    });
  });

  const personAssignmentScheduleConflicts: WcifError[] = [];
  acceptedRegistrations(persons).forEach((person) => {
    if (!person.assignments) return;
    
    const conflictingAssignments: ConflictingAssignment[] = [];

    person.assignments.forEach((assignment, index) => {
      const activity = findActivityById(wcif, assignment.activityId);
      if (!activity) return;

      const otherAssignments = person.assignments!.slice(index + 1);
      return otherAssignments.forEach((otherAssignment) => {
        const otherActivity = findActivityById(wcif, otherAssignment.activityId);
        if (!otherActivity || !activitiesOverlap(activity, otherActivity)) {
          return;
        }

        const roomA = roomByActivity(wcif, assignment.activityId);
        const roomB = roomByActivity(wcif, otherAssignment.activityId);
        
        if (!roomA || !roomB) return;

        conflictingAssignments.push({
          id: [
            person.registrantId,
            assignment.activityId,
            assignment.assignmentCode,
            otherAssignment.activityId,
            otherAssignment.assignmentCode,
          ].join('-'),
          assignmentA: {
            ...assignment,
            activity,
            room: roomA,
          },
          assignmentB: {
            ...otherAssignment,
            activity: otherActivity,
            room: roomB,
          },
        });
      });
    });

    if (conflictingAssignments.length === 0) {
      return;
    }

    personAssignmentScheduleConflicts.push({
      type: PERSON_ASSIGNMENT_SCHEDULE_CONFLICT,
      key: [PERSON_ASSIGNMENT_SCHEDULE_CONFLICT, person.registrantId].join('-'),
      message: `${person.name} (id: ${person.registrantId}) has ${
        conflictingAssignments.length
      } conflicting ${pluralizeWord(conflictingAssignments.length, 'assignment', 'assignments')}`,
      data: {
        person,
        conflictingAssignments,
      },
    });
  });

  return [
    ...eventRoundErrors,
    ...personAssignmentMissingActivityErrors,
    ...personAssignmentScheduleConflicts,
  ].filter(Boolean);
};
