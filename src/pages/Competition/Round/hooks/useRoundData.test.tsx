import { buildActivity, buildEvent, buildPerson, buildRound } from '../../../../store/reducers/_tests_/helpers';
import INITIAL_STATE, { type AppState } from '../../../../store/initialState';
import reducer from '../../../../store/reducer';
import { useRoundData } from './useRoundData';
import { renderHook } from '@testing-library/react';
import type { Activity, Competition } from '@wca/helpers';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, type AnyAction, type Reducer } from 'redux';
import { thunk } from 'redux-thunk';
import { describe, expect, it } from 'vitest';

const round = buildRound({
  id: '333fm-r1',
  format: '3',
});

const roomA = {
  id: 10,
  name: 'Room A',
  color: '#000',
  extensions: [],
  activities: [] as Activity[],
};

const roomB = {
  id: 11,
  name: 'Room B',
  color: '#111',
  extensions: [],
  activities: [] as Activity[],
};

const buildWcif = (): Competition => ({
  ...(INITIAL_STATE.wcif as Competition),
  id: 'test-competition',
  name: 'Test Competition',
  shortName: 'Test',
  formatVersion: '1.0',
  persons: [
    buildPerson({
      registrantId: 1,
      registration: {
        status: 'accepted',
        eventIds: ['333fm'],
        isCompeting: true,
        comments: undefined,
        wcaRegistrationId: 1,
      },
    }),
  ],
  events: [
    buildEvent({
      id: '333fm',
      rounds: [round],
    }),
  ],
  schedule: {
    startDate: '2024-01-01',
    numberOfDays: 1,
    venues: [
      {
        id: 1,
        name: 'Venue',
        latitudeMicrodegrees: 0,
        longitudeMicrodegrees: 0,
        countryIso2: 'US',
        timezone: 'America/New_York',
        extensions: [],
        rooms: [
          {
            ...roomA,
            activities: [
              buildActivity({
                id: 101,
                name: 'FMC Attempt 1',
                activityCode: '333fm-r1-a1',
                childActivities: [],
              }),
            ],
          },
          {
            ...roomB,
            activities: [
              buildActivity({
                id: 102,
                name: 'FMC Attempt 2',
                activityCode: '333fm-r1-a2',
                childActivities: [],
              }),
            ],
          },
        ],
      },
    ],
  },
});

const renderUseRoundData = () => {
  const state: AppState = {
    ...INITIAL_STATE,
    wcif: buildWcif(),
    changedKeys: new Set(),
  };
  const store = createStore(
    reducer as Reducer<AppState, AnyAction>,
    state,
    applyMiddleware(thunk)
  );

  return renderHook(() => useRoundData('333fm-r1', round), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
};

describe('useRoundData', () => {
  it('groups distributed round-level attempt activities even when they have no children', () => {
    const { result } = renderUseRoundData();

    expect(result.current.isDistributedAttemptRoundLevel).toBe(true);
    expect(result.current.groups).toHaveLength(0);
    expect(result.current.distributedAttemptGroups).toEqual([
      {
        attemptNumber: 1,
        activities: [expect.objectContaining({ id: 101, room: expect.objectContaining({ name: 'Room A' }) })],
      },
      {
        attemptNumber: 2,
        activities: [expect.objectContaining({ id: 102, room: expect.objectContaining({ name: 'Room B' }) })],
      },
    ]);
  });
});
