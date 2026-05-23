import ConfigureAssignmentsDialog from './ConfigureAssignmentsDialog';
import { buildActivity, buildEvent, buildPerson, buildRound } from '../../store/reducers/_tests_/helpers';
import INITIAL_STATE, { type AppState } from '../../store/initialState';
import reducer from '../../store/reducer';
import { renderWithProviders } from '../../test-utils';
import { fireEvent, screen } from '@testing-library/react';
import type { Activity, Competition, Person, Round } from '@wca/helpers';
import { ConfirmProvider } from 'material-ui-confirm';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, type AnyAction, type Reducer } from 'redux';
import { thunk } from 'redux-thunk';
import { describe, expect, it, vi } from 'vitest';

const room = {
  id: 10,
  name: 'Main Room',
  color: '#000',
  extensions: [],
  activities: [] as Activity[],
};

const roundActivity = {
  ...buildActivity({
    id: 100,
    name: 'FMC Round 1',
    activityCode: '333fm-r1',
  }),
  room,
};

const attemptOneActivity = {
  ...buildActivity({
    id: 101,
    name: 'FMC Attempt 1',
    activityCode: '333fm-r1-a1',
  }),
  room,
  parent: roundActivity,
};

const attemptTwoActivity = {
  ...buildActivity({
    id: 102,
    name: 'FMC Attempt 2',
    activityCode: '333fm-r1-a2',
  }),
  room,
  parent: roundActivity,
};

const round = buildRound({
  id: '333fm-r1',
  format: '3',
});

const person = buildPerson({
  name: 'Alice Example',
  registrantId: 1,
  wcaUserId: 1,
  registration: {
    status: 'accepted',
    eventIds: ['333fm'],
    isCompeting: true,
    comments: undefined,
    wcaRegistrationId: 1,
  },
});

const buildWcif = (persons: Person[]): Competition => ({
  ...(INITIAL_STATE.wcif as Competition),
  id: 'test-competition',
  name: 'Test Competition',
  shortName: 'Test',
  formatVersion: '1.0',
  persons,
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
            ...room,
            activities: [
              {
                ...roundActivity,
                childActivities: [attemptOneActivity, attemptTwoActivity],
              },
            ],
          },
        ],
      },
    ],
  },
});

const buildState = (persons: Person[] = [person]): AppState => ({
  ...INITIAL_STATE,
  wcif: buildWcif(persons),
  changedKeys: new Set(),
});

const renderWithStore = (ui: ReactElement, state = buildState()) => {
  const store = createStore(
    reducer as Reducer<AppState, AnyAction>,
    state,
    applyMiddleware(thunk)
  );

  return {
    store,
    ...renderWithProviders(
      <Provider store={store}>
        <ConfirmProvider>{ui}</ConfirmProvider>
      </Provider>
    ),
  };
};

const renderDistributedDialog = (state = buildState()) =>
  renderWithStore(
    <ConfigureAssignmentsDialog
      open
      onClose={vi.fn()}
      round={round as Round}
      activityCode="333fm-r1"
      groups={[attemptOneActivity, attemptTwoActivity]}
      isDistributedAttemptRoundLevel
      distributedAttemptGroups={[
        {
          attemptNumber: 1,
          activities: [attemptOneActivity],
        },
        {
          attemptNumber: 2,
          activities: [attemptTwoActivity],
        },
      ]}
    />,
    state
  );

describe('ConfigureAssignmentsDialog distributed attempts', () => {
  it('uses the normal assignments toolbar instead of per-attempt action buttons', () => {
    renderDistributedDialog();

    expect(screen.getByText('Assignment')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
    expect(screen.getByText('Show All Competitors')).toBeInTheDocument();
    expect(screen.getByText('Show Competitors Not In Round')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Assign All' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('paints distributed attempt cells with the selected assignment type', () => {
    const { baseElement, store } = renderDistributedDialog();

    fireEvent.keyDown(window, { key: 'j' });

    const firstAttemptCell = baseElement.querySelector('tbody tr td:nth-child(6)');
    expect(firstAttemptCell).toBeInTheDocument();
    if (!firstAttemptCell) {
      throw new Error('Expected the first distributed attempt assignment cell to render');
    }

    fireEvent.mouseDown(firstAttemptCell);

    expect(firstAttemptCell).toHaveTextContent('J');
    expect(store.getState().wcif?.persons[0].assignments).toContainEqual({
      activityId: 101,
      assignmentCode: 'staff-judge',
      stationNumber: null,
    });
  });
});
