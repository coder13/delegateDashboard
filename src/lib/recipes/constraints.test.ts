import {
  avoidSimilarFirstNames,
  maximizeAssignmentGaps,
  mustNotHaveRoles,
  onlyMultipleGroupRounds,
  preferLaterGroups,
  shouldHelpAfterCompeting,
} from './constraints';
import { buildActivity, buildPerson, buildWcif } from '../../store/reducers/_tests_/helpers';
import type { Activity } from '@wca/helpers';
import { describe, expect, it } from 'vitest';

const buildGroup = (id: number, groupNumber: number): Activity =>
  buildActivity({
    id,
    name: `Group ${groupNumber}`,
    activityCode: `333-r1-g${groupNumber}`,
    startTime: new Date(Date.UTC(2024, 0, 1, 10, (groupNumber - 1) * 10)).toISOString(),
    endTime: new Date(Date.UTC(2024, 0, 1, 10, groupNumber * 10)).toISOString(),
  });

const buildTimedActivity = (
  id: number,
  activityCode: string,
  startTime: string,
  endTime: string
): Activity =>
  buildActivity({
    id,
    name: activityCode,
    activityCode,
    startTime,
    endTime,
  });

const scoreProps = (activity: Activity, activities: Activity[]) => ({
  wcif: buildWcif([
    buildActivity({
      id: 1,
      activityCode: '333-r1',
      childActivities: activities,
    }),
  ]),
  activities,
  cluster: [],
  assignmentCode: 'competitor',
  person: buildPerson({
    assignments: [{ activityId: 12, assignmentCode: 'staff-judge', stationNumber: null }],
  }),
  activity,
});

describe('recipe constraints', () => {
  it('prefers the group before a staff assignment so staff help after competing', () => {
    const activities = [buildGroup(11, 1), buildGroup(12, 2), buildGroup(13, 3)];

    expect(shouldHelpAfterCompeting.score(scoreProps(activities[0], activities))).toBe(1);
    expect(shouldHelpAfterCompeting.score(scoreProps(activities[2], activities))).toBe(0);
  });

  it('wraps staff competitor assignments from group one staff to the last competing group', () => {
    const activities = [buildGroup(11, 1), buildGroup(12, 2), buildGroup(13, 3)];
    const props = {
      ...scoreProps(activities[2], activities),
      person: buildPerson({
        assignments: [{ activityId: 11, assignmentCode: 'staff-judge', stationNumber: null }],
      }),
    };

    expect(shouldHelpAfterCompeting.score(props)).toBe(1);
  });

  it('scores later groups higher', () => {
    const activities = [buildGroup(11, 1), buildGroup(12, 2), buildGroup(13, 3)];

    const earlyScore = preferLaterGroups.score(scoreProps(activities[0], activities));
    const lateScore = preferLaterGroups.score(scoreProps(activities[2], activities));

    expect(lateScore).toBeGreaterThan(earlyScore ?? 0);
  });

  it('rejects people with blocked roles', () => {
    const activity = buildGroup(11, 1);
    const props = {
      ...scoreProps(activity, [activity]),
      person: buildPerson({ roles: ['organizer'] }),
      options: { roles: ['delegate', 'trainee-delegate', 'organizer'] },
    };

    expect(mustNotHaveRoles.score(props)).toBeNull();
  });

  it('rejects judge assignments when only one group exists', () => {
    const activity = buildGroup(11, 1);

    expect(onlyMultipleGroupRounds.score(scoreProps(activity, [activity]))).toBeNull();
  });

  it('penalizes same-sounding first names in the same activity', () => {
    const activity = buildGroup(11, 1);
    const props = {
      ...scoreProps(activity, [activity]),
      wcif: buildWcif([], [
        buildPerson({
          name: 'John Smith',
          assignments: [{ activityId: 11, assignmentCode: 'competitor', stationNumber: null }],
        }),
      ]),
      person: buildPerson({ name: 'Jon Jones' }),
    };

    expect(avoidSimilarFirstNames.score(props)).toBeLessThan(0);
  });

  it('rejects same-sounding first names when another activity is available', () => {
    const activities = [buildGroup(11, 1), buildGroup(12, 2)];
    const props = {
      ...scoreProps(activities[0], activities),
      wcif: buildWcif([], [
        buildPerson({
          name: 'Ethan Smith',
          assignments: [{ activityId: 11, assignmentCode: 'competitor', stationNumber: null }],
        }),
      ]),
      person: buildPerson({ name: 'Ethan Jones' }),
    };

    expect(avoidSimilarFirstNames.score(props)).toBeNull();
    expect(avoidSimilarFirstNames.score({ ...props, activity: activities[1] })).toBe(0);
  });

  it('penalizes but does not reject competitor assignments immediately after helping', () => {
    const staffActivity = buildTimedActivity(
      21,
      '333-r1-g1',
      '2024-01-01T10:00:00.000Z',
      '2024-01-01T10:10:00.000Z'
    );
    const immediateCompetitorActivity = buildTimedActivity(
      22,
      '333-r1-g2',
      '2024-01-01T10:10:00.000Z',
      '2024-01-01T10:20:00.000Z'
    );
    const props = {
      ...scoreProps(immediateCompetitorActivity, [immediateCompetitorActivity]),
      wcif: buildWcif([staffActivity, immediateCompetitorActivity]),
      person: buildPerson({
        assignments: [{ activityId: 21, assignmentCode: 'staff-judge', stationNumber: null }],
      }),
      options: { noGapPenalty: 100, gapCapMinutes: 120 },
    };

    expect(maximizeAssignmentGaps.score(props)).toBe(-100);
  });

  it('scores larger positive staff-to-competitor gaps higher', () => {
    const staffActivity = buildTimedActivity(
      21,
      '333-r1-g1',
      '2024-01-01T10:00:00.000Z',
      '2024-01-01T10:10:00.000Z'
    );
    const shortGapActivity = buildTimedActivity(
      22,
      '333-r1-g2',
      '2024-01-01T10:15:00.000Z',
      '2024-01-01T10:25:00.000Z'
    );
    const longGapActivity = buildTimedActivity(
      23,
      '333-r1-g3',
      '2024-01-01T10:50:00.000Z',
      '2024-01-01T11:00:00.000Z'
    );
    const props = {
      ...scoreProps(shortGapActivity, [shortGapActivity, longGapActivity]),
      wcif: buildWcif([staffActivity, shortGapActivity, longGapActivity]),
      person: buildPerson({
        assignments: [{ activityId: 21, assignmentCode: 'staff-runner', stationNumber: null }],
      }),
      options: { noGapPenalty: 100, gapCapMinutes: 120 },
    };

    expect(maximizeAssignmentGaps.score({ ...props, activity: longGapActivity })).toBeGreaterThan(
      maximizeAssignmentGaps.score(props) ?? 0
    );
  });

  it('scores competitor assignments farther from other rounds higher', () => {
    const otherRoundActivity = buildTimedActivity(
      31,
      '222-r1-g1',
      '2024-01-01T10:00:00.000Z',
      '2024-01-01T10:10:00.000Z'
    );
    const nearActivity = buildTimedActivity(
      41,
      '333-r1-g1',
      '2024-01-01T10:15:00.000Z',
      '2024-01-01T10:25:00.000Z'
    );
    const farActivity = buildTimedActivity(
      42,
      '333-r1-g2',
      '2024-01-01T11:00:00.000Z',
      '2024-01-01T11:10:00.000Z'
    );
    const props = {
      ...scoreProps(nearActivity, [nearActivity, farActivity]),
      wcif: buildWcif([otherRoundActivity, nearActivity, farActivity]),
      person: buildPerson({
        assignments: [{ activityId: 31, assignmentCode: 'competitor', stationNumber: null }],
      }),
      options: { noGapPenalty: 100, gapCapMinutes: 120 },
    };

    expect(maximizeAssignmentGaps.score({ ...props, activity: farActivity })).toBeGreaterThan(
      maximizeAssignmentGaps.score(props) ?? 0
    );
  });

  it('penalizes staff assignments immediately before future competitor assignments', () => {
    const immediateStaffActivity = buildTimedActivity(
      51,
      '333-r1-g1',
      '2024-01-01T10:00:00.000Z',
      '2024-01-01T10:10:00.000Z'
    );
    const futureCompetitorActivity = buildTimedActivity(
      61,
      '222-r1-g1',
      '2024-01-01T10:10:00.000Z',
      '2024-01-01T10:20:00.000Z'
    );
    const props = {
      ...scoreProps(immediateStaffActivity, [immediateStaffActivity]),
      assignmentCode: 'staff-judge',
      wcif: buildWcif([immediateStaffActivity, futureCompetitorActivity]),
      person: buildPerson({
        assignments: [{ activityId: 61, assignmentCode: 'competitor', stationNumber: null }],
      }),
      options: { noGapPenalty: 100, gapCapMinutes: 120 },
    };

    expect(maximizeAssignmentGaps.score(props)).toBe(-100);
  });
});
