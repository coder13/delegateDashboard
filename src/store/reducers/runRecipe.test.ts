import { runRecipe } from './runRecipe';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildState,
  buildWcifWithEvents,
} from './_tests_/helpers';
import {
  parseActivityCode,
  type Activity,
  type Assignment,
  type AssignmentCode,
  type Competition,
  type EventId,
  type Person,
} from '@wca/helpers';
import { describe, expect, it } from 'vitest';

interface CompetitionOptions {
  groupCount?: number;
  stageCount?: number;
  includeGroups?: boolean;
}

const acceptedRegistration = (registrantId: number) => ({
  status: 'accepted' as const,
  eventIds: ['333' as EventId],
  isCompeting: true,
  comments: undefined,
  wcaRegistrationId: registrantId,
});

const personalBest = (worldRanking: number, best: number) => ({
  eventId: '333' as EventId,
  type: 'average' as const,
  best,
  worldRanking,
  continentalRanking: worldRanking,
  nationalRanking: worldRanking,
});

const assignment = (activityId: number, assignmentCode: AssignmentCode): Assignment => ({
  activityId,
  assignmentCode,
  stationNumber: null,
});

const competitor = (registrantId: number, overrides: Partial<Person> = {}) =>
  buildPerson({
    registrantId,
    name: `Competitor ${registrantId}`,
    wcaUserId: registrantId,
    registration: acceptedRegistration(registrantId),
    personalBests: [personalBest(registrantId, 1000 + registrantId)],
    ...overrides,
  });

const buildGroup = (id: number, groupNumber: number, stageNumber: number): Activity =>
  buildActivity({
    id,
    name: `Stage ${stageNumber} Group ${groupNumber}`,
    activityCode: `333-r1-g${groupNumber}`,
    startTime: `2024-01-01T10:0${groupNumber}:00Z`,
    endTime: `2024-01-01T10:1${groupNumber}:00Z`,
  });

const buildRoundActivity = (
  stageNumber: number,
  groupCount: number,
  includeGroups: boolean
): Activity =>
  buildActivity({
    id: stageNumber,
    name: `3x3 Round 1 Stage ${stageNumber}`,
    activityCode: '333-r1',
    childActivities: includeGroups
      ? Array.from({ length: groupCount }, (_, index) =>
          buildGroup(stageNumber * 100 + index + 1, index + 1, stageNumber)
        )
      : [],
  });

const buildCompetition = (
  persons: Person[],
  { groupCount = 3, stageCount = 1, includeGroups = true }: CompetitionOptions = {}
): Competition => {
  const round = buildRound({ id: '333-r1' });
  const event = buildEvent({ id: '333', rounds: [round] });
  const roundActivities = Array.from({ length: stageCount }, (_, index) =>
    buildRoundActivity(index + 1, groupCount, includeGroups)
  );
  const wcif = buildWcifWithEvents(roundActivities, [event], persons);

  return {
    ...wcif,
    schedule: {
      ...wcif.schedule,
      venues: [
        {
          ...wcif.schedule.venues[0],
          rooms: roundActivities.map((roundActivity, index) => ({
            id: index + 1,
            name: `Stage ${index + 1}`,
            color: '#000',
            extensions: [],
            activities: [roundActivity],
          })),
        },
      ],
    },
  };
};

const runRecipeById = (
  recipeId: string,
  persons: Person[],
  options: CompetitionOptions = {}
): Competition =>
  runRecipe(buildState(buildCompetition(persons, options)), {
    roundId: '333-r1',
    recipeId,
  }).wcif as Competition;

const runPnwRecipe = (persons: Person[], options: CompetitionOptions = {}) =>
  runRecipeById('pnw', persons, options);

const personById = (wcif: Competition, registrantId: number) =>
  wcif.persons.find((person) => person.registrantId === registrantId);

const competitorAssignment = (person: Person | undefined) =>
  person?.assignments?.find((assignment) => assignment.assignmentCode === 'competitor');

const allActivities = (wcif: Competition) =>
  wcif.schedule.venues.flatMap((venue) =>
    venue.rooms.flatMap((room) =>
      room.activities.flatMap((activity) => [activity, ...(activity.childActivities ?? [])])
    )
  );

const roomForActivity = (wcif: Competition, activityId: number) =>
  wcif.schedule.venues
    .flatMap((venue) => venue.rooms)
    .find((room) =>
      room.activities.some(
        (activity) =>
          activity.id === activityId ||
          activity.childActivities?.some((childActivity) => childActivity.id === activityId)
      )
    );

const activityForAssignment = (wcif: Competition, person: Person | undefined) => {
  const assignment = competitorAssignment(person);
  if (!assignment) return undefined;

  return allActivities(wcif).find((activity) => activity.id === assignment.activityId);
};

const competitorGroupNumber = (wcif: Competition, person: Person | undefined) => {
  const activity = activityForAssignment(wcif, person);
  if (!activity) return undefined;

  return parseActivityCode(activity.activityCode).groupNumber;
};

const competitorStageNumber = (wcif: Competition, person: Person | undefined) => {
  const assignment = competitorAssignment(person);
  if (!assignment) return undefined;

  return roomForActivity(wcif, assignment.activityId)?.id;
};

const competitorCombo = (wcif: Competition, person: Person | undefined) => {
  const stageNumber = competitorStageNumber(wcif, person);
  const groupNumber = competitorGroupNumber(wcif, person);

  return stageNumber && groupNumber ? `${stageNumber}:${groupNumber}` : undefined;
};

const valuesById = <T,>(wcif: Competition, registrantIds: number[], value: (person: Person) => T) =>
  registrantIds.map((registrantId) => value(personById(wcif, registrantId) as Person));

const countBy = <T extends string | number | symbol>(values: T[]) =>
  values.reduce<Record<T, number>>(
    (counts, value) => ({
      ...counts,
      [value]: (counts[value] ?? 0) + 1,
    }),
    {} as Record<T, number>
  );

const maxMinusMin = (counts: Record<string | number, number>) => {
  const values = Object.values(counts);
  return Math.max(...values) - Math.min(...values);
};

const firstTimerCountsByGroup = (wcif: Competition) =>
  wcif.persons.reduce<Record<number, number>>((counts, person) => {
    if (person.wcaId) return counts;

    const groupNumber = competitorGroupNumber(wcif, person);
    if (!groupNumber) return counts;

    return {
      ...counts,
      [groupNumber]: (counts[groupNumber] ?? 0) + 1,
    };
  }, {});

const assignmentCount = (person: Person | undefined, assignmentCode: AssignmentCode) =>
  person?.assignments?.filter(
    (personAssignment) => personAssignment.assignmentCode === assignmentCode
  ).length ?? 0;

describe('runRecipe', () => {
  it('assigns every finalist into the generated group for one-group finals', () => {
    const wcif = runPnwRecipe(
      Array.from({ length: 4 }, (_, index) => competitor(index + 1)),
      { includeGroups: false }
    );

    expect(wcif.schedule.venues[0].rooms[0].activities[0].childActivities).toHaveLength(1);
    expect(wcif.persons.map((person) => competitorGroupNumber(wcif, person))).toEqual([
      1, 1, 1, 1,
    ]);
    expect(wcif.persons.map((person) => assignmentCount(person, 'staff-judge'))).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it('assigns staff competitors before staff assignments so they help after competing', () => {
    const wcif = runPnwRecipe([
      competitor(1, {
        name: 'Staff In Middle Group',
        assignments: [{ activityId: 102, assignmentCode: 'staff-judge', stationNumber: null }],
      }),
      competitor(2, {
        name: 'Staff In First Group',
        assignments: [{ activityId: 101, assignmentCode: 'staff-judge', stationNumber: null }],
      }),
      competitor(3),
      competitor(4),
    ]);

    expect(competitorGroupNumber(wcif, personById(wcif, 1))).toBe(1);
    expect(competitorGroupNumber(wcif, personById(wcif, 2))).toBe(3);
  });

  it('balances five delegates across group numbers and stages in a two-group two-stage round', () => {
    const wcif = runPnwRecipe(
      Array.from({ length: 5 }, (_, index) =>
        competitor(index + 1, {
          roles: [index === 1 ? 'trainee-delegate' : 'delegate'],
        })
      ),
      { groupCount: 2, stageCount: 2 }
    );

    const delegateIds = [1, 2, 3, 4, 5];
    const groupNumbers = valuesById(wcif, delegateIds, (person) =>
      competitorGroupNumber(wcif, person)
    ).filter(Boolean) as number[];
    const stageNumbers = valuesById(wcif, delegateIds, (person) =>
      competitorStageNumber(wcif, person)
    ).filter(Boolean) as number[];

    expect(new Set(groupNumbers)).toEqual(new Set([1, 2]));
    expect(new Set(stageNumbers)).toEqual(new Set([1, 2]));
    expect(maxMinusMin(countBy(groupNumbers))).toBeLessThanOrEqual(1);
    expect(maxMinusMin(countBy(stageNumbers))).toBeLessThanOrEqual(1);
  });

  it('puts three delegates in different group numbers in a five-group two-stage round', () => {
    const wcif = runPnwRecipe(
      Array.from({ length: 3 }, (_, index) =>
        competitor(index + 1, {
          roles: [index === 2 ? 'organizer' : 'delegate'],
        })
      ),
      { groupCount: 5, stageCount: 2 }
    );

    const delegateIds = [1, 2, 3];
    const groupNumbers = valuesById(wcif, delegateIds, (person) =>
      competitorGroupNumber(wcif, person)
    );
    const combos = valuesById(wcif, delegateIds, (person) => competitorCombo(wcif, person));

    expect(new Set(groupNumbers).size).toBe(3);
    expect(new Set(combos).size).toBe(3);
  });

  it('keeps first timers out of the last group and distributes them evenly across eligible groups', () => {
    const firstTimers = Array.from({ length: 6 }, (_, index) =>
      competitor(index + 1, {
        name: `First Timer ${index + 1}`,
        wcaId: null,
        personalBests: [],
      })
    );
    const experiencedCompetitors = Array.from({ length: 6 }, (_, index) =>
      competitor(index + 7, {
        name: `Experienced ${index + 1}`,
      })
    );

    const wcif = runPnwRecipe([...firstTimers, ...experiencedCompetitors]);
    const firstTimerCounts = firstTimerCountsByGroup(wcif);

    expect(firstTimerCounts[3] ?? 0).toBe(0);
    expect(Math.abs((firstTimerCounts[1] ?? 0) - (firstTimerCounts[2] ?? 0))).toBeLessThanOrEqual(
      1
    );
  });

  it('fills missing assignments when scrambler, runner, and competitor assignments already exist', () => {
    const preAssignedCompetitors = [
      competitor(1, {
        assignments: [assignment(101, 'competitor')],
      }),
      competitor(2, {
        assignments: [assignment(102, 'competitor')],
      }),
      competitor(3, {
        assignments: [assignment(201, 'competitor')],
      }),
    ];
    const staffAssignments = [101, 102, 201, 202].flatMap((activityId, activityIndex) =>
      Array.from({ length: 4 }, (_, offset) => {
        const registrantId = 4 + activityIndex * 4 + offset;
        const assignmentCode = offset < 2 ? 'staff-scrambler' : 'staff-runner';

        return competitor(registrantId, {
          assignments: [assignment(activityId, assignmentCode)],
        });
      })
    );
    const unassignedCompetitors = Array.from({ length: 5 }, (_, index) =>
      competitor(20 + index)
    );
    const initialPersons = [
      ...preAssignedCompetitors,
      ...staffAssignments,
      ...unassignedCompetitors,
    ];

    const wcif = runPnwRecipe(initialPersons, { groupCount: 2, stageCount: 2 });

    for (const initialPerson of initialPersons) {
      const updatedPerson = personById(wcif, initialPerson.registrantId);
      expect(assignmentCount(updatedPerson, 'competitor')).toBe(1);

      for (const initialAssignment of initialPerson.assignments ?? []) {
        expect(updatedPerson?.assignments).toContainEqual(initialAssignment);
      }
    }

    for (const staffPerson of staffAssignments) {
      const updatedPerson = personById(wcif, staffPerson.registrantId);
      expect(assignmentCount(updatedPerson, 'staff-judge')).toBe(0);
    }

    for (const person of [...preAssignedCompetitors, ...unassignedCompetitors]) {
      const updatedPerson = personById(wcif, person.registrantId);
      expect(assignmentCount(updatedPerson, 'staff-judge')).toBe(1);
    }
  });

  it('spreads the fastest competitors across different groups', () => {
    const wcif = runPnwRecipe(
      Array.from({ length: 9 }, (_, index) =>
        competitor(index + 1, {
          name: `Seeded Competitor ${index + 1}`,
          personalBests: [personalBest(index + 1, 1000 + index)],
        })
      )
    );

    const fastestThreeGroups = valuesById(wcif, [1, 2, 3], (person) =>
      competitorGroupNumber(wcif, person)
    );

    expect(new Set(fastestThreeGroups).size).toBe(3);
  });

  it('keeps repeated Luke and Michael-name variants out of the same group/stage combo', () => {
    const lukeNames = ['Luke Adams', 'Luke Baker', 'Luke Clark', 'Luke Davis', 'Luke Evans'];
    const michaelNames = [
      'Michael Frost',
      'Micheal Grant',
      'Mikel Harris',
      'Mykel Irwin',
      'Mikael Jones',
      'Mickel King',
    ];
    const wcif = runPnwRecipe(
      [...lukeNames, ...michaelNames].map((name, index) => competitor(index + 1, { name })),
      { groupCount: 3, stageCount: 2 }
    );

    const lukeCombos = valuesById(wcif, [1, 2, 3, 4, 5], (person) =>
      competitorCombo(wcif, person)
    );
    const michaelCombos = valuesById(wcif, [6, 7, 8, 9, 10, 11], (person) =>
      competitorCombo(wcif, person)
    );

    expect(new Set(lukeCombos).size).toBe(lukeCombos.length);
    expect(new Set(michaelCombos).size).toBe(michaelCombos.length);
  });
});
