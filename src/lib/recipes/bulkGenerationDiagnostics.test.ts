import { buildActivity, buildPerson, buildWcif } from '../../store/reducers/_tests_/helpers';
import { countPeopleWithImmediateHelpingThenCompetingAssignments } from './bulkGenerationDiagnostics';
import { describe, expect, it } from 'vitest';

describe('bulkGenerationDiagnostics', () => {
  it('counts people with immediate helping then competing assignments', () => {
    const wcif = buildWcif(
      [
        buildActivity({
          id: 1,
          activityCode: '333-r1',
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T11:00:00Z',
          childActivities: [
            buildActivity({
              id: 101,
              activityCode: '333-r1-g1',
              startTime: '2024-01-01T10:00:00Z',
              endTime: '2024-01-01T10:15:00Z',
            }),
            buildActivity({
              id: 102,
              activityCode: '333-r1-g2',
              startTime: '2024-01-01T10:15:00Z',
              endTime: '2024-01-01T10:30:00Z',
            }),
            buildActivity({
              id: 103,
              activityCode: '333-r1-g3',
              startTime: '2024-01-01T10:45:00Z',
              endTime: '2024-01-01T11:00:00Z',
            }),
          ],
        }),
      ],
      [
        buildPerson({
          registrantId: 1,
          assignments: [
            { activityId: 101, assignmentCode: 'staff-judge', stationNumber: null },
            { activityId: 102, assignmentCode: 'competitor', stationNumber: null },
          ],
        }),
        buildPerson({
          registrantId: 2,
          assignments: [
            { activityId: 101, assignmentCode: 'staff-runner', stationNumber: null },
            { activityId: 103, assignmentCode: 'competitor', stationNumber: null },
          ],
        }),
        buildPerson({
          registrantId: 3,
          assignments: [
            { activityId: 101, assignmentCode: 'competitor', stationNumber: null },
            { activityId: 102, assignmentCode: 'staff-judge', stationNumber: null },
          ],
        }),
      ]
    );

    expect(countPeopleWithImmediateHelpingThenCompetingAssignments(wcif)).toBe(1);
  });

  it('excludes immediate help then compete assignments within two-group rounds', () => {
    const wcif = buildWcif(
      [
        buildActivity({
          id: 1,
          activityCode: '333-r1',
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T10:30:00Z',
          childActivities: [
            buildActivity({
              id: 101,
              activityCode: '333-r1-g1',
              startTime: '2024-01-01T10:00:00Z',
              endTime: '2024-01-01T10:15:00Z',
            }),
            buildActivity({
              id: 102,
              activityCode: '333-r1-g2',
              startTime: '2024-01-01T10:15:00Z',
              endTime: '2024-01-01T10:30:00Z',
            }),
          ],
        }),
        buildActivity({
          id: 2,
          activityCode: '222-r1',
          startTime: '2024-01-01T11:00:00Z',
          endTime: '2024-01-01T11:45:00Z',
          childActivities: [
            buildActivity({
              id: 201,
              activityCode: '222-r1-g1',
              startTime: '2024-01-01T11:00:00Z',
              endTime: '2024-01-01T11:15:00Z',
            }),
            buildActivity({
              id: 202,
              activityCode: '222-r1-g2',
              startTime: '2024-01-01T11:15:00Z',
              endTime: '2024-01-01T11:30:00Z',
            }),
            buildActivity({
              id: 203,
              activityCode: '222-r1-g3',
              startTime: '2024-01-01T11:30:00Z',
              endTime: '2024-01-01T11:45:00Z',
            }),
          ],
        }),
      ],
      [
        buildPerson({
          registrantId: 1,
          assignments: [
            { activityId: 101, assignmentCode: 'staff-judge', stationNumber: null },
            { activityId: 102, assignmentCode: 'competitor', stationNumber: null },
          ],
        }),
        buildPerson({
          registrantId: 2,
          assignments: [
            { activityId: 201, assignmentCode: 'staff-judge', stationNumber: null },
            { activityId: 202, assignmentCode: 'competitor', stationNumber: null },
          ],
        }),
      ]
    );

    expect(countPeopleWithImmediateHelpingThenCompetingAssignments(wcif)).toBe(1);
  });

  it('counts unique group numbers when excluding two-group rounds across multiple stages', () => {
    const wcif = buildWcif(
      [
        buildActivity({
          id: 1,
          activityCode: 'clock-r1',
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T10:30:00Z',
          childActivities: [
            buildActivity({
              id: 101,
              activityCode: 'clock-r1-g1',
              startTime: '2024-01-01T10:00:00Z',
              endTime: '2024-01-01T10:15:00Z',
            }),
            buildActivity({
              id: 102,
              activityCode: 'clock-r1-g2',
              startTime: '2024-01-01T10:15:00Z',
              endTime: '2024-01-01T10:30:00Z',
            }),
          ],
        }),
        buildActivity({
          id: 2,
          activityCode: 'clock-r1',
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T10:30:00Z',
          childActivities: [
            buildActivity({
              id: 201,
              activityCode: 'clock-r1-g1',
              startTime: '2024-01-01T10:00:00Z',
              endTime: '2024-01-01T10:15:00Z',
            }),
            buildActivity({
              id: 202,
              activityCode: 'clock-r1-g2',
              startTime: '2024-01-01T10:15:00Z',
              endTime: '2024-01-01T10:30:00Z',
            }),
          ],
        }),
      ],
      [
        buildPerson({
          registrantId: 1,
          assignments: [
            { activityId: 101, assignmentCode: 'staff-judge', stationNumber: null },
            { activityId: 102, assignmentCode: 'competitor', stationNumber: null },
          ],
        }),
      ]
    );

    expect(countPeopleWithImmediateHelpingThenCompetingAssignments(wcif)).toBe(0);
  });
});
