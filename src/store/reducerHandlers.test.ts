import { describe, expect, it } from 'vitest';
import { reducers } from './reducerHandlers';
import { ActionType } from './actions';
import {
  buildActivity,
  buildEvent,
  buildState,
  buildWcif,
  buildWcifWithEvents,
} from './reducers/_tests_/helpers';
import {
  getActivityConfigExtensionData,
  getRoundConfigExtensionData,
} from '../lib/wcif/extensions/delegateDashboard/delegateDashboard';

describe('reducer handlers', () => {
  it('appends and replaces wcif errors', () => {
    const state = buildState(null);
    const firstError = {
      key: 'error-1',
      message: 'First',
      type: 'missing_advancement_condition',
      data: {},
    };
    const secondError = {
      key: 'error-2',
      message: 'Second',
      type: 'no_schedule_activities_for_round',
      data: {},
    };

    const appended = reducers[ActionType.UPDATE_WCIF_ERRORS](state, {
      errors: [firstError],
      replace: false,
    });
    const replaced = reducers[ActionType.UPDATE_WCIF_ERRORS](appended, {
      errors: [secondError],
      replace: true,
    });

    expect(appended.errors).toEqual([firstError]);
    expect(replaced.errors).toEqual([secondError]);
  });

  it('tracks changed keys for partial wcif updates', () => {
    const wcif = buildWcif([]);
    const state = buildState(wcif);

    const next = reducers[ActionType.PARTIAL_UPDATE_WCIF](state, {
      wcif: { name: 'Updated Name' },
    });

    expect(next.needToSave).toBe(true);
    expect(next.changedKeys.has('name')).toBe(true);
    expect(next.wcif?.name).toBe('Updated Name');
  });

  it('updates activity config extension data for group counts', () => {
    const activity = buildActivity({ id: 10, extensions: [] });
    const wcif = buildWcif([activity]);
    const state = buildState(wcif);

    const next = reducers[ActionType.UPDATE_GROUP_COUNT](state, {
      activityId: 10,
      groupCount: 4,
    });

    const updatedActivity = (next.wcif as any)?.venues?.[0]?.rooms?.[0]?.activities?.[0];
    expect(getActivityConfigExtensionData(updatedActivity)).toEqual({ groupCount: 4 });
    expect(next.changedKeys.has('schedule')).toBe(true);
  });

  it('updates round extension data by activity code', () => {
    const round = { ...buildEvent().rounds[0], extensions: [] };
    const wcif = buildWcifWithEvents([], [buildEvent({ rounds: [round] })]);
    const state = buildState(wcif);

    const next = reducers[ActionType.UPDATE_ROUND_EXTENSION_DATA](state, {
      activityCode: '333-r1',
      extensionData: { seedResultsImported: true },
    });

    const updatedRound = next.wcif?.events[0].rounds[0];
    expect(getRoundConfigExtensionData(updatedRound!)).toEqual({ seedResultsImported: true });
    expect(next.changedKeys.has('events')).toBe(true);
  });

  it('updates raw wcif fields and marks them changed', () => {
    const wcif = buildWcif([]);
    const state = buildState(wcif);

    const next = reducers[ActionType.UPDATE_RAW_OBJ](state, {
      key: 'shortName',
      value: 'updated-short',
    });

    expect(next.wcif?.shortName).toBe('updated-short');
    expect(next.changedKeys.has('shortName')).toBe(true);
  });
});
