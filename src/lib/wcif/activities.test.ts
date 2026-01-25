import { findActivityById } from './activities';
import type { Competition } from '@wca/helpers';
import { describe, expect, it } from 'vitest';
import { buildActivity, buildWcif } from '../../store/reducers/_tests_/helpers';

describe('findActivityById', () => {
  it('returns child activities by id', () => {
    const child = buildActivity({ id: 2, name: 'Group 1', activityCode: '333-r1-g1' });
    const parent = buildActivity({ childActivities: [child] });
    const wcif = buildWcif([parent]);

    const activity = findActivityById(wcif, 2);

    expect(activity).toEqual(
      expect.objectContaining({
        id: 2,
        name: 'Group 1',
        activityCode: '333-r1-g1',
      })
    );
    expect(activity?.parent).toEqual(expect.objectContaining({ id: parent.id }));
  });

  it('caches results by schedule instance', () => {
    const activity = buildActivity({ id: 5, name: 'Round 1' });
    const scheduleWcif = buildWcif([activity]);
    const wrapperWcif: Competition = {
      ...scheduleWcif,
      name: 'Wrapper',
      schedule: scheduleWcif.schedule,
    };

    const first = findActivityById(scheduleWcif, 5);
    const second = findActivityById(wrapperWcif, 5);

    expect(first).toBe(second);
    expect(first).toEqual(expect.objectContaining({ id: 5, name: 'Round 1' }));
  });

  it('recomputes when schedule changes', () => {
    const originalActivity = buildActivity({ id: 7, name: 'Original' });
    const wcif = buildWcif([originalActivity]);
    const updatedActivity = buildActivity({ id: 7, name: 'Updated' });
    const updatedWcif = buildWcif([updatedActivity]);

    const first = findActivityById(wcif, 7);
    const second = findActivityById(updatedWcif, 7);

    expect(first).not.toBe(second);
    expect(first).toEqual(expect.objectContaining({ id: 7, name: 'Original' }));
    expect(second).toEqual(expect.objectContaining({ id: 7, name: 'Updated' }));
  });
});
