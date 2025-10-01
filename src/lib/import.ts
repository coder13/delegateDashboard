import { Activity, ActivityCode, Competition, EventId, Person, Room } from '@wca/helpers';
import {
  findRooms,
  allChildActivities,
  parseActivityCode,
  generateNextChildActivityId,
  createGroupActivity,
  activityByActivityCode,
  findAllActivities,
} from './activities';
import { events } from './events';
import { groupBy, mapIn } from './utils';

interface ValidationCheck {
  key: string;
  passed: boolean;
  message: string;
  data?: any;
}

interface CSVMeta {
  fields: string[];
}

interface CSVRow {
  email: string;
  [key: string]: string;
}

interface CSVData {
  meta: CSVMeta;
  data: CSVRow[];
}

interface Assignment {
  registrantId: number;
  eventId: EventId;
  groupNumber: number;
  activityCode: string;
  assignmentCode: string;
  roomId?: number;
  roundNumber?: number;
}

interface RoomWithActivities {
  room: Room;
  activities: Activity[];
}

interface MissingActivity {
  activityCode: string;
  groupNumber: number;
  eventId: EventId;
  roundNumber: number;
  roomId: number;
}

export const validate = (wcif: Competition) => (data: CSVData): ValidationCheck[] => {
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

  const eventsList = wcif.events.map((event) => event.id);
  const personsMissingEvents = data.data
    .map((row) => ({
      email: row.email,
      assignments: eventsList
        .map((eventId) => {
          const data = row[eventId].trim();

          if (!data || data === '-') {
            return null;
          }

          return {
            eventId,
            data,
          };
        })
        .filter((data) => data !== null),
      raw: row,
    }))
    .filter(({ email, assignments, raw }) => {
      const person = wcif.persons.find((person) => person.email === email);
      if (!person) {
        checks.push({
          key: 'person-missing',
          passed: false,
          message: `Person with email ${email} is missing from the WCIF`,
        });
        return true;
      }

      if (
        person.registration?.eventIds.some(
          (eventId) => !assignments.some((assignment) => assignment!.eventId === eventId)
        )
      ) {
        return true;
      }

      return false;
    });

  // Find situation where a person does not have a value for their event column
  // TODO: cross reference with person's registered events
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

const generateActivityCode = (eventId: EventId, groupNumber: number): string => {
  if (eventId === '333mbf' || eventId === '333fm') {
    return `${eventId}-r1-g${groupNumber}-a1`;
  }

  return `${eventId}-r1-g${groupNumber}`;
};

/**
 * Requires that the CSV row has a field that is exactly the eventId
 */
export const findCompetingAssignment = (
  stages: Room[],
  row: CSVRow,
  person: Person,
  eventId: EventId
): Assignment => {
  const data = row[eventId].trim();

  if (!data || data === '-') {
    throw new Error('Competitor is given no assignment for event they are registered for');
  }

  const matchWithStage = data.match(competitorAssignmentRegexWithStage);
  if (matchWithStage) {
    const { stage, groupNumber } = matchWithStage.groups!;
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

  if (stages.length > 2 && matchWithoutStage) {
    throw new Error('Stage data for competitor assignment is ambiguous');
  }

  if (matchWithoutStage && stages.length === 1) {
    const groupNumber = parseInt(matchWithoutStage.groups!.groupNumber, 10);
    return {
      registrantId: person.registrantId,
      eventId,
      groupNumber,
      activityCode: generateActivityCode(eventId, groupNumber),
      assignmentCode: 'competitor',
      roomId: stages[0].id,
    };
  }

  console.log(175, {
    data,
    person,
    eventId,
  });
  throw new Error(`Could not determine competitor assignment`);
};

const StaffAssignmentMap: Record<string, string> = {
  R: 'staff-runner',
  S: 'staff-scrambler',
  J: 'staff-judge',
};

export const findStaffingAssignments = (
  stages: Room[],
  data: CSVData,
  row: CSVRow,
  person: Person,
  eventId: EventId
): Assignment[] => {
  const field = data.meta.fields.find((field) => {
    const split = field.split('-');
    return split[0] === eventId && split[1] === 'staff';
  });

  if (!field) {
    return [];
  }

  const cellData = row[field].trim();

  // No staff assignment
  if (!cellData || cellData === '-') {
    return [];
  }

  const baseAssignmentData = {
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
        : parseInt(staffAssignmentMatch!.groups!.groupNumber, 10);
      const assignmentCode = staffAssignmentMatch
        ? StaffAssignmentMap[staffAssignmentMatch.groups!.assignment]
        : 'staff-judge';

      return {
        ...baseAssignmentData,
        activityCode: generateActivityCode(eventId, groupNumber),
        groupNumber,
        assignmentCode,
        roomId: stages.length === 1 ? stages[0].id : undefined,
      } as Assignment;
    })
    .filter((a): a is Assignment => a !== null);

  return assignments;
};

/**
 * Translates CSV contents to competitor assignments and also lists missing group activities
 */
export const generateAssignments = (wcif: Competition, data: CSVData): Assignment[] => {
  const assignments: Assignment[] = [];
  const stages = findRooms(wcif);
  const eventIds = wcif.events.map((event) => event.id);

  data.data.forEach((row) => {
    const person = wcif.persons.find((person) => person.email === row.email);

    if (!person) {
      return;
    }

    // Do not create competing assignments for events a person has not registered for
    person.registration?.eventIds.forEach((eventId) => {
      try {
        const competingAssignment = findCompetingAssignment(stages, row, person, eventId);
        if (competingAssignment) {
          assignments.push(competingAssignment);
        }
      } catch (e) {
        throw e;
      }
    });

    // There's a possibility that a person is assigned to staff events they're not registered for.
    eventIds.forEach((eventId) => {
      try {
        const staffingAssignments = findStaffingAssignments(stages, data, row, person, eventId);
        if (staffingAssignments && staffingAssignments.length) {
          assignments.push(...staffingAssignments);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });

  return assignments;
};

export const determineMissingGroupActivities = (
  wcif: Competition,
  assignments: Assignment[]
): MissingActivity[] => {
  const missingActivities: MissingActivity[] = [];
  const stages: RoomWithActivities[] = findRooms(wcif).map((room) => ({
    room,
    activities: allChildActivities(room as any),
  }));

  assignments
    // sort assignments to process competitor assignments first
    .sort(
      (a, b) => ['competitor'].indexOf(a.assignmentCode) - ['competitor'].indexOf(b.assignmentCode)
    )
    .forEach((assignment) => {
      if (!assignment.roomId) {
        return;
      }

      const stage = stages.find((stage) => stage.room.id === assignment.roomId);

      if (!stage) {
        return;
      }

      const activity = stage.activities.find((activity) =>
        activity.activityCode.startsWith(assignment.activityCode)
      );

      if (!activity) {
        const existingMissingActivity = missingActivities.find(
          (missingActivity) =>
            missingActivity.activityCode === assignment.activityCode &&
            missingActivity.roomId === assignment.roomId
        );

        if (existingMissingActivity) {
          return;
        }

        const parsedActivityCode = parseActivityCode(assignment.activityCode);
        missingActivities.push({
          activityCode: assignment.activityCode,
          groupNumber: assignment.groupNumber,
          eventId: parsedActivityCode.eventId,
          roundNumber: parsedActivityCode.roundNumber!,
          roomId: assignment.roomId,
        });
      }
    });

  return missingActivities;
};

export const determineStageForAssignments = (
  wcif: Competition,
  assignments: Assignment[]
): Assignment[] => {
  const stages: RoomWithActivities[] = findRooms(wcif).map((room) => ({
    room,
    activities: allChildActivities(room as any),
  }));

  const competingAssignments = assignments.filter(
    (assignment) => assignment.assignmentCode === 'competitor'
  );

  assignments
    .filter(
      (assignment) =>
        !assignment.roomId &&
        competingAssignments.some(
          (competingAssignment) =>
            competingAssignment.registrantId === assignment.registrantId &&
            competingAssignment.eventId === assignment.eventId &&
            competingAssignment.groupNumber === assignment.groupNumber
        )
    )
    .forEach((assignment) => {
      const matchingCompetingAssignment = competingAssignments.find(
        (competingAssignment) =>
          competingAssignment.registrantId === assignment.registrantId &&
          competingAssignment.eventId === assignment.eventId &&
          competingAssignment.groupNumber === assignment.groupNumber
      );

      if (!matchingCompetingAssignment) {
        return;
      }

      assignment.roomId = matchingCompetingAssignment.roomId;
    });

  return assignments;
};

export const generateMissingGroupActivities = (
  wcif: Competition,
  missingActivities: MissingActivity[]
): Competition => {
  const groupedMissingActivities = groupBy(missingActivities, (activity) => activity.eventId);

  Object.keys(groupedMissingActivities).forEach((eventId) => {
    const event = wcif.events.find((event) => event.id === eventId);

    if (!event) {
      return;
    }

    const groupedByRoundMissingActivities = groupBy(
      groupedMissingActivities[eventId],
      (activity) => activity.roundNumber
    );

    Object.keys(groupedByRoundMissingActivities).forEach((roundNumber) => {
      const round = event.rounds.find((round) => round.id === `${eventId}-r${roundNumber}`);

      if (!round) {
        return;
      }

      const groupedByRoomMissingActivities = groupBy(
        groupedByRoundMissingActivities[roundNumber],
        (activity) => activity.roomId
      );

      Object.keys(groupedByRoomMissingActivities).forEach((roomId) => {
        const room = findRooms(wcif).find((room) => room.id === parseInt(roomId, 10));

        if (!room) {
          return;
        }

        const roundActivity = activityByActivityCode(wcif, parseInt(roomId, 10), `${eventId}-r${roundNumber}`);

        if (!roundActivity) {
          return;
        }

        groupedByRoomMissingActivities[roomId].forEach((missingActivity) => {
          const newActivity = createGroupActivity(
            generateNextChildActivityId(wcif),
            roundActivity,
            missingActivity.groupNumber,
            roundActivity.startTime,
            roundActivity.endTime
          );

          room.activities.push(newActivity);
        });
      });
    });
  });

  return wcif;
};

export const balanceStartAndEndTimes = (
  wcif: Competition,
  missingActivities: MissingActivity[]
): Competition => {
  const groupedMissingActivities = groupBy(missingActivities, (activity) => activity.eventId);

  Object.keys(groupedMissingActivities).forEach((eventId) => {
    const event = wcif.events.find((event) => event.id === eventId);

    if (!event) {
      return;
    }

    const groupedByRoundMissingActivities = groupBy(
      groupedMissingActivities[eventId],
      (activity) => activity.roundNumber
    );

    Object.keys(groupedByRoundMissingActivities).forEach((roundNumber) => {
      const round = event.rounds.find((round) => round.id === `${eventId}-r${roundNumber}`);

      if (!round) {
        return;
      }

      const roundActivities = findAllActivities(wcif).filter((activity) =>
        activity.activityCode.startsWith(`${eventId}-r${roundNumber}`)
      );

      if (roundActivities.length === 0) {
        return;
      }

      const startTime = Math.min(...roundActivities.map((a) => new Date(a.startTime).getTime()));
      const endTime = Math.max(...roundActivities.map((a) => new Date(a.endTime).getTime()));

      roundActivities.forEach((activity) => {
        activity.startTime = new Date(startTime).toISOString();
        activity.endTime = new Date(endTime).toISOString();
      });
    });
  });

  return wcif;
};

export const upsertCompetitorAssignments = (
  wcif: Competition,
  assignments: Assignment[]
): Competition => {
  const competingAssignments = assignments.filter(
    (assignment) => assignment.assignmentCode === 'competitor'
  );

  competingAssignments.forEach((assignment) => {
    const person = wcif.persons.find((person) => person.registrantId === assignment.registrantId);

    if (!person) {
      return;
    }

    const activity = findAllActivities(wcif).find((activity) =>
      activity.activityCode.startsWith(assignment.activityCode)
    );

    if (!activity) {
      return;
    }

    const existingAssignment = person.assignments?.find(
      (a) => a.activityId === activity.id && a.assignmentCode === assignment.assignmentCode
    );

    if (existingAssignment) {
      return;
    }

    if (!person.assignments) {
      person.assignments = [];
    }

    person.assignments.push({
      activityId: activity.id,
      assignmentCode: assignment.assignmentCode,
      stationNumber: null,
    });
  });

  return wcif;
};
