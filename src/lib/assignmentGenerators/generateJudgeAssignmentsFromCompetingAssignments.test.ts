import { generateJudgeAssignmentsFromCompetingAssignments } from './generateJudgeAssignmentsFromCompetingAssignments';
import type { Activity, Competition, Person, Round } from '@wca/helpers';
import { describe, expect, it } from 'vitest';

const roundActivity: Activity = {
  id: 1,
  name: '3x3x3 Round 1',
  activityCode: '333-r1',
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T11:00:00Z',
  childActivities: [],
  extensions: [],
};

const round: Round = {
  id: '333-r1',
  format: 'a',
  timeLimit: null,
  cutoff: null,
  advancementCondition: null,
  scrambleSetCount: 1,
  results: [],
  extensions: [],
};

const createGroupActivities = (count: number): Activity[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: idx + 2,
    name: `Group ${idx + 1}`,
    activityCode: `333-r1-g${idx + 1}`,
    startTime: '2024-01-01T10:00:00Z',
    endTime: '2024-01-01T11:00:00Z',
    childActivities: [],
    extensions: [],
  }));

const competitor = (registrantId: number, competingActivityId: number): Person => ({
  registrantId,
  name: `Competitor ${registrantId}`,
  assignments: [{ assignmentCode: 'competitor', activityId: competingActivityId }],
  registration: { status: 'accepted', eventIds: ['333'] },
});

const buildCompetition = (groupCount: number, persons: Person[]): Competition => {
  const groups = createGroupActivities(groupCount);

  return {
    formatVersion: 'v1.0',
    id: 'test-comp',
    name: 'Test Competition',
    shortName: 'Test',
    persons,
    events: [
      {
        id: '333',
        rounds: [round],
        competitorLimit: null,
        qualification: null,
        extensions: [],
      },
    ],
    schedule: {
      startDate: '2024-01-01',
      numberOfDays: 1,
      venues: [
        {
          id: 1,
          name: 'Main Venue',
          latitudeMicrodegrees: 0,
          longitudeMicrodegrees: 0,
          countryIso2: 'US',
          timezone: 'America/New_York',
          extensions: [],
          rooms: [
            {
              id: 10,
              name: 'Main Room',
              color: '#000',
              extensions: [],
              activities: [{ ...roundActivity, childActivities: groups }],
            },
          ],
        },
      ],
    },
    competitorLimit: null,
    extensions: [],
  };
};

describe('generateJudgeAssignmentsFromCompetingAssignments', () => {
  it('does not generate judge assignments when only one group exists', () => {
    const wcif = buildCompetition(1, [competitor(1, 2)]);
    const generator = generateJudgeAssignmentsFromCompetingAssignments(wcif, '333-r1');

    const generatedAssignments = generator ? generator([]) : [];

    expect(generatedAssignments).toEqual([]);
  });

  it('assigns judging duties to the next group when multiple groups exist', () => {
    const persons = [competitor(1, 2), competitor(2, 3)];
    const wcif = buildCompetition(2, persons);
    const generator = generateJudgeAssignmentsFromCompetingAssignments(wcif, '333-r1');

    const generatedAssignments = generator ? generator([]) : [];

    expect(generatedAssignments).toEqual([
      {
        registrantId: 1,
        assignment: { assignmentCode: 'staff-judge', activityId: 3, stationNumber: null },
      },
      {
        registrantId: 2,
        assignment: { assignmentCode: 'staff-judge', activityId: 2, stationNumber: null },
      },
    ]);
  });
});
