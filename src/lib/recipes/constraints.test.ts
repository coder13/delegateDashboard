import {
  avoidSimilarFirstNames,
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
    startTime: `2024-01-01T10:0${groupNumber}:00Z`,
    endTime: `2024-01-01T10:1${groupNumber}:00Z`,
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
});
