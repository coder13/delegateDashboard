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
import { createGroupAssignment } from './groups';
import { groupBy, mapIn } from './utils';

export const validate = (wcif) => (data) => {
  const checks = [];

  if (!data.meta.fields.indexOf('email') === -1) {
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

  const events = wcif.events.map((event) => event.id);
  const personsMissingEvents = data.data
    .map((row) => ({
      email: row.email,
      assignments: events
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
        person.registration.eventIds.some(
          (eventId) => !assignments.some((assignment) => assignment.eventId === eventId)
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

const generateActivityCode = (eventId, groupNumber) => {
  if (eventId === '333mbf' || eventId === '333fm') {
    return `${eventId}-r1-g${groupNumber}-a1`;
  }

  return `${eventId}-r1-g${groupNumber}`;
};

/**
 * Requires that the CSV row has a field that is exactly the eventId
 * @param {*} stages
 * @param {*} row
 * @param {*} person
 * @param {*} eventId
 * @returns
 */
export const findCompetingAssignment = (stages, row, person, eventId) => {
  const data = row[eventId].trim();

  if (!data || data === '-') {
    throw new Error('Competitor is given no assignment for event they are registered for');
  }

  const matchWithStage = data.match(competitorAssignmentRegexWithStage);
  if (matchWithStage) {
    const { stage, groupNumber } = matchWithStage.groups;
    const room = stages.find((s) => s.name.startsWith(stage));

    if (!room) {
      throw new Error(
        `Can't determine stage ${stage} for competitor ${person.name}. Raw Data: ${data}`
      );
    }

    return {
      registrantId: person.registrantId,
      eventId,
      groupNumber,
      activityCode: generateActivityCode(eventId, groupNumber),
      assignmentCode: 'competitor',
      roomId: room.id,
    };
  }

  const matchWithoutStage = data.match(competitorAssignmentRegexWithoutStage);

  if (stages.length > 2 && matchWithoutStage) {
    throw new Error('Stage data for competitor assignment is ambiguous');
  }

  if (matchWithoutStage && stages.length === 1) {
    const groupNumber = parseInt(matchWithoutStage.groups.groupNumber, 10);
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

const StaffAssignmentMap = {
  R: 'staff-runner',
  S: 'staff-scrambler',
  J: 'staff-judge',
};

export const findStaffingAssignments = (stages, data, row, person, eventId) => {
  const field = data.meta.fields.find((field) => {
    const split = field.split('-');
    return split[0] === eventId && split[1] === 'staff';
  });

  if (!field) {
    return;
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
        : parseInt(staffAssignmentMatch.groups.groupNumber, 10);
      const assignmentCode = staffAssignmentMatch
        ? StaffAssignmentMap[staffAssignmentMatch.groups.assignment]
        : 'staff-judge';

      return {
        ...baseAssignmentData,
        activityCode: generateActivityCode(eventId, groupNumber),
        groupNumber,
        assignmentCode,
        roomId: stages.length === 1 ? stages[0].id : undefined,
      };
    });

  return assignments.filter(Boolean);
};

/**
 * Translates CSV contents to competitor assignments and also lists missing group activities
 * @param {*} wcif
 * @param {*} data
 * @param {*} cb
 * @returns
 */
export const generateAssignments = (wcif, data) => {
  const assignments = [];
  const stages = findRooms(wcif);
  const eventIds = wcif.events.map((event) => event.id);

  data.data.forEach((row) => {
    const person = wcif.persons.find((person) => person.email === row.email);

    // Do not create competing assignments for events a person has not registered for
    person.registration.eventIds.forEach((eventId) => {
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

export const determineMissingGroupActivities = (wcif, assignments) => {
  const missingActivities = [];
  const stages = findRooms(wcif).map((room) => ({
    room,
    activities: allChildActivities(room),
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

      if (
        missingActivities.find(
          (activity) =>
            activity.activityCode === assignment.activityCode &&
            activity.roomId === assignment.roomId
        )
      ) {
        return;
      }

      // Both the WCIF and assignment data are in sync on how many stages there are
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
        const activity = room.activities.find(
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
      return aParsedActivityCode.groupNumber - bParsedActivityCode.groupNumber;
    } else {
      return (
        events.findIndex((e) => e.id === aParsedActivityCode.eventId) -
        events.findIndex((e) => e.id === bParsedActivityCode.eventId)
      );
    }
  });
};

/**
 * Returns assignments
 */
export const determineStageForAssignments = (wcif, assignments) => {
  const stageCountsByActivityCode = new Map();
  const activities = findAllActivities(wcif);

  return assignments.map((assignment) => {
    if (assignment.roomId) {
      return assignment;
    }

    if (assignment.assignmentCode === 'competitor') {
      // Not going to edit
      return assignment;
    }

    const activitiesForCode = activities.filter((activity) =>
      activity.activityCode.startsWith(assignment.activityCode)
    );
    const rooms = activitiesForCode.map((activity) => activity.parent.room);

    if (stageCountsByActivityCode.has(assignment.activityCode)) {
      const counts = stageCountsByActivityCode.get(assignment.activityCode);

      const roomSizes = rooms
        .map((room) => ({
          roomId: room.id,
          size: counts[room.id],
        }))
        .sort((a, b) => a.size - b.size);

      const selectedRoomId = roomSizes[0].roomId;
      stageCountsByActivityCode.set(assignment.activityCode, {
        ...counts,
        [selectedRoomId]: counts[selectedRoomId] + 1,
      });

      return {
        ...assignment,
        roomId: roomSizes[0].roomId,
      };
    } else {
      // Initialize counts
      const counts = {};
      rooms.forEach((room) => {
        counts[room.id] = 0;
      });

      if (!rooms[0]) {
        debugger;
      }

      // Set count for current room to 1
      counts[rooms[0].id] = 1;

      // save it
      stageCountsByActivityCode.set(assignment.activityCode, counts);

      return {
        ...assignment,
        roomId: rooms[0].id,
      };
    }
  });
};

/**
 *
 * @param {*} wcif
 * @param {*} missingActivities
 * @returns WCIF with missing activities added
 */
export const generateMissingGroupActivities = (wcif, missingActivities) => {
  const schedule = wcif.schedule;
  const missingActivitiesByRoundId = groupBy(missingActivities, (activity) => {
    const { eventId, roundNumber } = parseActivityCode(activity.activityCode); //.split('-').slice(0, 2).join('-');
    return `${eventId}-r${roundNumber}`;
  });

  let startingActivityId = generateNextChildActivityId(wcif);

  Object.keys(missingActivitiesByRoundId).forEach((eventRound) => {
    const groups = missingActivitiesByRoundId[eventRound];
    groups.forEach((group) => {
      const { activityCode, roomId } = group;
      const { groupNumber } = parseActivityCode(activityCode);

      const venue = schedule.venues.find((venue) => venue.rooms.some((room) => room.id === roomId));
      const room = venue.rooms.find((room) => room.id === roomId);

      const roundActivity = room.activities.find((activity) =>
        activity.activityCode.startsWith(eventRound)
      );

      if (!roundActivity) {
        throw new Error(`Could not find round activity ${eventRound} in room ${roomId}`);
      }

      roundActivity.childActivities.push(
        createGroupActivity(startingActivityId, roundActivity, groupNumber)
      );

      startingActivityId += 1;
    });
  });

  return {
    ...wcif,
    schedule,
  };
};

export const balanceStartAndEndTimes = (wcif, missingActivities) => {
  return mapIn(wcif, ['schedule', 'venues'], (venue) =>
    mapIn(venue, ['rooms'], (room) => {
      return mapIn(room, ['activities'], (activity) => {
        const groupCount = activity.childActivities.length;
        if (!groupCount) {
          return activity;
        }

        const roundStartDate = new Date(activity.startTime);
        const roundEndDate = new Date(activity.endTime);
        const dateDiff = roundEndDate - roundStartDate;
        const timePerGroup = dateDiff / groupCount;

        return mapIn(activity, ['childActivities'], (childActivity) => {
          const missingActivity = missingActivities.find(
            (missing) =>
              missing.activityCode === childActivity.activityCode && missing.roomId === room.id
          );

          if (!missingActivity) {
            return childActivity;
          }

          const groupNumber = parseActivityCode(childActivity.activityCode).groupNumber;

          return {
            ...childActivity,
            startTime: new Date(
              roundStartDate.getTime() + timePerGroup * (groupNumber - 1)
            ).toISOString(),
            endTime: new Date(roundStartDate.getTime() + timePerGroup * groupNumber).toISOString(),
          };
        });
      });
    })
  );
};

/**
 *
 * @param {*} wcif
 * @param {*} assignments
 * @returns WCIF with assignments added
 */
export const upsertCompetitorAssignments = (wcif, assignments) => {
  const persons = wcif.persons;

  assignments.forEach((assignment) => {
    const person = persons.find((person) => person.registrantId === assignment.registrantId);
    const activity = activityByActivityCode(wcif, assignment.roomId, assignment.activityCode);

    const newAssignment = createGroupAssignment(
      person.registrantId,
      activity.id,
      assignment.assignmentCode
    ).assignment;

    if (person.assignments.find((assignment) => assignment.activityId === activity.id)) {
      person.assignments = person.assignments.map((assignment) =>
        assignment.activityId === activity.id ? newAssignment : assignment
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
