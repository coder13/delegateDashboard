import {
  allChildActivities,
  activityByActivityCode,
  createGroupActivity,
  events,
  findAllActivities,
  findRooms,
  generateNextChildActivityId,
  parseActivityCode,
} from '../domain';
import { updateIn } from '../utils';
import { createGroupAssignment } from '../wcif';
import {
  type Activity,
  type Assignment,
  type Competition,
  type EventId,
  type Person,
  type Room,
} from '@wca/helpers';
import { groupBy } from 'lodash';

export interface CsvRow extends Record<string, string> {
  email: string;
}

export interface ImportData {
  meta: {
    fields: string[];
  };
  data: CsvRow[];
}

export interface ValidationCheck {
  key: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

export interface ParsedAssignment {
  registrantId: number;
  eventId: EventId;
  groupNumber: number;
  activityCode: string;
  assignmentCode: string;
  roomId?: number;
  roundNumber?: number;
}

export const validate =
  (wcif: Competition) =>
  (data: ImportData): ValidationCheck[] => {
    const checks: ValidationCheck[] = [];

    if (data.meta.fields.indexOf('email') === -1) {
      checks.push({
        key: 'email',
        passed: false,
        message: 'Missing email column',
      });
    } else {
      checks.push({
        key: 'email',
        passed: true,
        message: 'Contains email column',
      });
    }

    if (data.data.some((row) => !row.email)) {
      checks.push({
        key: 'email-filled',
        passed: false,
        message: 'Missing email in some rows',
      });
    } else {
      checks.push({
        key: 'email-filled',
        passed: true,
        message: 'All rows have an email defined',
      });
    }

    const eventIds = wcif.events.map((event) => event.id);
    const personsMissingEvents = data.data
      .map((row) => ({
        email: row.email,
        assignments: eventIds
          .map((eventId) => {
            const eventData = row[eventId]?.trim();

            if (!eventData || eventData === '-') {
              return null;
            }

            return {
              eventId,
              data: eventData,
            };
          })
          .filter((eventData) => eventData !== null),
        raw: row,
      }))
      .filter(({ email, assignments }) => {
        const person = wcif.persons.find((p) => p.email === email);
        if (!person) {
          checks.push({
            key: 'person-missing',
            passed: false,
            message: `Person with email ${email} is missing from the WCIF`,
          });
          return true;
        }

        if (
          person.registration?.eventIds?.some(
            (eventId) => !assignments.some((assignment) => assignment?.eventId === eventId)
          )
        ) {
          return true;
        }

        return false;
      });

    if (personsMissingEvents.length > 0) {
      checks.push({
        key: 'has-all-competing-event-column',
        passed: false,
        message: 'Missing competing assignments for some events',
        data: personsMissingEvents,
      });
    } else {
      checks.push({
        key: 'has-all-competing-event-column',
        passed: true,
        message: 'Defines competing assignments for all persons in all events',
      });
    }

    return checks;
  };

export const numberRegex = /^([1-9]\d*)$/i;
export const staffAssignmentRegex = /^(?<assignment>[RSJ])(?<groupNumber>[1-9]\d*)$/i;

export const competitorAssignmentRegexWithoutStage = /^(?<groupNumber>[1-9]\d*)$/i;
export const competitorAssignmentRegexWithStage =
  /^(?<stage>([A-Za-z])+)(?:\s*)(?<groupNumber>[1-9]\d*)$/i;

const generateActivityCode = (eventId: EventId, groupNumber: number) => {
  if (eventId === '333mbf' || eventId === '333fm') {
    return `${eventId}-r1-g${groupNumber}-a1`;
  }

  return `${eventId}-r1-g${groupNumber}`;
};

export const findCompetingAssignment = (
  stages: Room[],
  row: CsvRow,
  person: Person,
  eventId: EventId
): ParsedAssignment => {
  const data = row[eventId]?.trim();

  if (!data || data === '-') {
    throw new Error('Competitor is given no assignment for event they are registered for');
  }

  const matchWithStage = data.match(competitorAssignmentRegexWithStage);
  if (matchWithStage) {
    const { stage, groupNumber } = matchWithStage.groups as { stage: string; groupNumber: string };
    const room = stages.find((s) => s.name.startsWith(stage));

    if (!room) {
      throw new Error(
        `Can't determine stage ${stage} for competitor ${person.name}. Raw Data: ${data}`
      );
    }

    return {
      registrantId: person.registrantId,
      eventId,
      groupNumber: parseInt(groupNumber, 10),
      activityCode: generateActivityCode(eventId, parseInt(groupNumber, 10)),
      assignmentCode: 'competitor',
      roomId: room.id,
    };
  }

  const matchWithoutStage = data.match(competitorAssignmentRegexWithoutStage);

  if (stages.length > 1 && matchWithoutStage) {
    throw new Error('Stage data for competitor assignment is ambiguous');
  }

  if (matchWithoutStage && stages.length === 1) {
    const groupNumber = parseInt(matchWithoutStage.groups?.groupNumber ?? '', 10);
    return {
      registrantId: person.registrantId,
      eventId,
      groupNumber,
      activityCode: generateActivityCode(eventId, groupNumber),
      assignmentCode: 'competitor',
      roomId: stages[0].id,
    };
  }

  throw new Error(`Could not determine competitor assignment`);
};

const StaffAssignmentMap: Record<string, string> = {
  R: 'staff-runner',
  S: 'staff-scrambler',
  J: 'staff-judge',
};

export const findStaffingAssignments = (
  stages: Room[],
  data: ImportData,
  row: CsvRow,
  person: Person,
  eventId: EventId
): ParsedAssignment[] | undefined => {
  const field = data.meta.fields.find((fieldName) => {
    const split = fieldName.split('-');
    return split[0] === eventId && split[1] === 'staff';
  });

  if (!field) {
    return;
  }

  const cellData = row[field]?.trim();

  if (!cellData || cellData === '-') {
    return [];
  }

  const baseAssignmentData: Omit<
    ParsedAssignment,
    'activityCode' | 'groupNumber' | 'assignmentCode'
  > = {
    registrantId: person.registrantId,
    eventId: eventId,
    roundNumber: 1,
  };

  const assignments = cellData
    .trim()
    .split(/[\s*,;\s*]/)
    .map((assignment) => {
      const plainNumberMatch = assignment.match(numberRegex);
      const staffAssignmentMatch = assignment.match(staffAssignmentRegex);

      if (!plainNumberMatch && !staffAssignmentMatch) {
        return null;
      }

      const groupNumber = plainNumberMatch
        ? parseInt(assignment, 10)
        : parseInt((staffAssignmentMatch?.groups as { groupNumber: string }).groupNumber, 10);
      const assignmentCode = staffAssignmentMatch
        ? StaffAssignmentMap[(staffAssignmentMatch.groups as { assignment: string }).assignment]
        : 'staff-judge';

      return {
        ...baseAssignmentData,
        activityCode: generateActivityCode(eventId, groupNumber),
        groupNumber,
        assignmentCode,
        roomId: stages.length === 1 ? stages[0].id : undefined,
      };
    });

  return assignments.filter(Boolean) as ParsedAssignment[];
};

export const generateAssignments = (wcif: Competition, data: ImportData): ParsedAssignment[] => {
  const assignments: ParsedAssignment[] = [];
  const stages = findRooms(wcif);
  const eventIds = wcif.events.map((event) => event.id);

  data.data.forEach((row) => {
    const person = wcif.persons.find((p) => p.email === row.email);

    if (!person || !person.registration?.eventIds) {
      return;
    }

    person.registration.eventIds.forEach((eventId) => {
      const competingAssignment = findCompetingAssignment(stages, row, person, eventId);
      if (competingAssignment) {
        assignments.push(competingAssignment);
      }
    });

    eventIds.forEach((eventId) => {
      const staffingAssignments = findStaffingAssignments(stages, data, row, person, eventId);
      if (staffingAssignments && staffingAssignments.length) {
        assignments.push(...staffingAssignments);
      }
    });
  });

  return assignments;
};

export const determineMissingGroupActivities = (
  wcif: Competition,
  assignments: ParsedAssignment[]
): { activityCode: string; roomId: number }[] => {
  const missingActivities: { activityCode: string; roomId: number }[] = [];
  const stages = findRooms(wcif).map((room) => ({
    room,
    activities: allChildActivities(room as unknown as Activity),
  }));

  assignments
    .sort(
      (a, b) => ['competitor'].indexOf(a.assignmentCode) - ['competitor'].indexOf(b.assignmentCode)
    )
    .forEach((assignment) => {
      if (!assignment.roomId) {
        return;
      }

      if (
        missingActivities.find(
          (activity) =>
            activity.activityCode === assignment.activityCode &&
            activity.roomId === assignment.roomId
        )
      ) {
        return;
      }

      if (stages.length === 1) {
        const activity = stages[0].activities.find(
          (activity) => activity.activityCode === assignment.activityCode
        );
        if (!activity) {
          missingActivities.push({
            activityCode: assignment.activityCode,
            roomId: assignment.roomId,
          });
        }
      } else if (stages.length > 1) {
        const room = stages.find((stage) => stage.room.id === assignment.roomId);
        const activity = room?.activities.find(
          (activity) => activity.activityCode === assignment.activityCode
        );

        if (!activity) {
          missingActivities.push({
            activityCode: assignment.activityCode,
            roomId: assignment.roomId,
          });
        }
      }
    });

  return missingActivities.sort((a, b) => {
    const aParsedActivityCode = parseActivityCode(a.activityCode);
    const bParsedActivityCode = parseActivityCode(b.activityCode);

    if (aParsedActivityCode.eventId === bParsedActivityCode.eventId) {
      return (aParsedActivityCode.groupNumber ?? 0) - (bParsedActivityCode.groupNumber ?? 0);
    } else {
      return (
        events.findIndex((e) => e.id === aParsedActivityCode.eventId) -
        events.findIndex((e) => e.id === bParsedActivityCode.eventId)
      );
    }
  });
};

export const determineStageForAssignments = (
  wcif: Competition,
  assignments: ParsedAssignment[]
): ParsedAssignment[] => {
  const stageCountsByActivityCode = new Map<string, Record<number, number>>();
  const activities = findAllActivities(wcif);

  return assignments.map((assignment) => {
    if (assignment.roomId) {
      return assignment;
    }

    if (assignment.assignmentCode === 'competitor') {
      return assignment;
    }

    const activitiesForCode = activities.filter((activity) =>
      activity.activityCode.startsWith(assignment.activityCode)
    );
    const rooms = activitiesForCode.map(
      (activity) => (activity as Activity & { parent?: Activity & { room: Room } }).parent?.room
    );

    if (stageCountsByActivityCode.has(assignment.activityCode)) {
      const counts = stageCountsByActivityCode.get(assignment.activityCode)!;

      const roomSizes = rooms
        .filter((room): room is Room => !!room)
        .map((room) => ({
          roomId: room.id,
          size: counts[room.id] ?? 0,
        }))
        .sort((a, b) => a.size - b.size);

      const selectedRoomId = roomSizes[0].roomId;
      stageCountsByActivityCode.set(assignment.activityCode, {
        ...counts,
        [selectedRoomId]: (counts[selectedRoomId] ?? 0) + 1,
      });

      return {
        ...assignment,
        roomId: selectedRoomId,
      };
    } else {
      const counts: Record<number, number> = {};
      rooms
        .filter((room): room is Room => !!room)
        .forEach((room) => {
          counts[room.id] = 0;
        });

      if (!rooms[0]) {
        return assignment;
      }

      counts[rooms[0].id] = 1;

      stageCountsByActivityCode.set(assignment.activityCode, counts);

      return {
        ...assignment,
        roomId: rooms[0].id,
      };
    }
  });
};

export const generateMissingGroupActivities = (
  wcif: Competition,
  missingActivities: { activityCode: string; roomId: number }[]
): Competition => {
  const schedule = wcif.schedule;
  const missingActivitiesByRoundId = groupBy(
    missingActivities,
    (activity: { activityCode: string; roomId: number }) => {
      const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
      return `${eventId}-r${roundNumber}`;
    }
  );

  let startingActivityId = generateNextChildActivityId(wcif);

  Object.keys(missingActivitiesByRoundId).forEach((eventRound) => {
    const groups = missingActivitiesByRoundId[eventRound];
    groups.forEach((group: { activityCode: string; roomId: number }) => {
      const { activityCode, roomId } = group;
      const { groupNumber } = parseActivityCode(activityCode);

      const venue = schedule.venues.find((v) => v.rooms.some((room) => room.id === roomId));
      const room = venue?.rooms.find((room) => room.id === roomId);

      const roundActivity = room?.activities.find((activity) =>
        activity.activityCode.startsWith(eventRound)
      );

      if (!roundActivity) {
        throw new Error(`Could not find round activity ${eventRound} in room ${roomId}`);
      }

      if (groupNumber === undefined) {
        return;
      }

      roundActivity.childActivities.push(
        createGroupActivity(
          startingActivityId,
          roundActivity as Activity,
          groupNumber,
          roundActivity.startTime,
          roundActivity.endTime
        )
      );

      startingActivityId += 1;
    });
  });

  return {
    ...wcif,
    schedule,
  };
};

export const balanceStartAndEndTimes = (
  wcif: Competition,
  missingActivities: { activityCode: string; roomId: number }[]
): Competition => {
  return updateIn(wcif, 'schedule', (schedule) => ({
    ...schedule,
    venues: schedule.venues.map((venue) => ({
      ...venue,
      rooms: venue.rooms.map((room) => ({
        ...room,
        activities: room.activities.map((activity) => {
          const groupCount = activity.childActivities.length;
          if (!groupCount) {
            return activity;
          }

          const roundStartDate = new Date(activity.startTime);
          const roundEndDate = new Date(activity.endTime);
          const dateDiff = roundEndDate.getTime() - roundStartDate.getTime();
          const timePerGroup = dateDiff / groupCount;

          return {
            ...activity,
            childActivities: activity.childActivities.map((childActivity) => {
              const missingActivity = missingActivities.find(
                (missing) =>
                  missing.activityCode === childActivity.activityCode && missing.roomId === room.id
              );

              if (!missingActivity) {
                return childActivity;
              }

              const groupNumber = parseActivityCode(childActivity.activityCode).groupNumber ?? 1;

              return {
                ...childActivity,
                startTime: new Date(
                  roundStartDate.getTime() + timePerGroup * (groupNumber - 1)
                ).toISOString(),
                endTime: new Date(
                  roundStartDate.getTime() + timePerGroup * groupNumber
                ).toISOString(),
              };
            }),
          };
        }),
      })),
    })),
  }));
};

export const upsertCompetitorAssignments = (
  wcif: Competition,
  assignments: ParsedAssignment[]
): Competition => {
  const persons = wcif.persons;

  assignments.forEach((assignment) => {
    const person = persons.find((p) => p.registrantId === assignment.registrantId);
    if (!person) {
      return;
    }
    person.assignments = person.assignments ?? [];
    const activity = activityByActivityCode(wcif, assignment.roomId!, assignment.activityCode);

    const newAssignment = createGroupAssignment(
      person.registrantId,
      activity.id,
      assignment.assignmentCode
    ).assignment as Assignment;

    if (person.assignments.find((a) => a.activityId === activity.id)) {
      person.assignments = person.assignments.map((a) =>
        a.activityId === activity.id ? newAssignment : a
      );
    } else {
      person.assignments.push(newAssignment);
    }
  });

  return {
    ...wcif,
    persons,
  };
};
