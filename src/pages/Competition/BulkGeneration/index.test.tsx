import BulkGenerationPage from '.';
import BreadcrumbsProvider from '../../../providers/BreadcrumbsProvider';
import { renderWithProviders } from '../../../test-utils';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildWcifWithEvents,
} from '../../../store/reducers/_tests_/helpers';
import type { AppState } from '../../../store/initialState';
import { ActionType } from '../../../store/actions';
import type { EventId } from '@wca/helpers';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchMock = vi.fn();
const useAppSelectorMock = vi.fn();
const getLocalStorageMock = vi.fn();
const setLocalStorageMock = vi.fn();

vi.mock('../../../store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: AppState) => unknown) => useAppSelectorMock(selector),
}));

vi.mock('../../../lib/api', () => ({
  getLocalStorage: (key: string) => getLocalStorageMock(key),
  setLocalStorage: (key: string, value: string) => setLocalStorageMock(key, value),
}));

const registration = (registrantId: number, eventIds: EventId[]) => ({
  status: 'accepted' as const,
  eventIds,
  isCompeting: true,
  comments: undefined,
  wcaRegistrationId: registrantId,
});

const buildCompetition = () =>
  buildWcifWithEvents(
    [
      buildActivity({
        id: 1,
        activityCode: '333-r1',
        startTime: '2024-01-01T11:00:00Z',
        endTime: '2024-01-01T11:30:00Z',
        childActivities: [buildActivity({ id: 101, activityCode: '333-r1-g1' })],
      }),
      buildActivity({
        id: 2,
        activityCode: '333-r2',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T10:30:00Z',
        childActivities: [buildActivity({ id: 201, activityCode: '333-r2-g1' })],
      }),
      buildActivity({
        id: 3,
        activityCode: '222-r1',
        startTime: '2024-01-01T09:00:00Z',
        endTime: '2024-01-01T09:30:00Z',
        childActivities: [buildActivity({ id: 301, activityCode: '222-r1-g1' })],
      }),
      buildActivity({
        id: 4,
        activityCode: '222-r2',
        startTime: '2024-01-01T12:00:00Z',
        endTime: '2024-01-01T12:30:00Z',
        childActivities: [buildActivity({ id: 401, activityCode: '222-r2-g1' })],
      }),
      buildActivity({
        id: 5,
        activityCode: '333fm-r1',
        childActivities: [],
      }),
    ],
    [
      buildEvent({
        id: '333',
        rounds: [
          buildRound({ id: '333-r1' }),
          buildRound({
            id: '333-r2',
            results: [{ personId: 1, ranking: 1, attempts: [], best: 0, average: 0 }],
          }),
        ],
      }),
      buildEvent({
        id: '222',
        rounds: [buildRound({ id: '222-r1' }), buildRound({ id: '222-r2' })],
      }),
      buildEvent({
        id: '333fm' as EventId,
        rounds: [buildRound({ id: '333fm-r1' })],
      }),
    ],
    [
      buildPerson({
        registrantId: 1,
        registration: registration(1, ['333' as EventId, '222' as EventId]),
      }),
      buildPerson({
        registrantId: 2,
        registration: registration(2, ['333' as EventId, '222' as EventId]),
      }),
    ]
  );

const renderPage = () =>
  renderWithProviders(
    <BreadcrumbsProvider>
      <Routes>
        <Route path="/competitions/:competitionId/bulk-generation" element={<BulkGenerationPage />} />
      </Routes>
    </BreadcrumbsProvider>,
    { route: '/competitions/test-comp/bulk-generation' }
  );

describe('BulkGenerationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLocalStorageMock.mockReturnValue(null);
    const state = { wcif: buildCompetition() } as AppState;
    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );
  });

  it('renders normal rounds with Round 1 selected by default and distributed attempts excluded', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Bulk Generate' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Size' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Assigned' })).not.toBeInTheDocument();
    expect(screen.getByText('333 Round 1')).toBeInTheDocument();
    expect(screen.getByText('333 Round 2')).toBeInTheDocument();
    expect(screen.getByText('222 Round 1')).toBeInTheDocument();
    expect(screen.getByText('222 Round 2')).toBeInTheDocument();
    expect(screen.queryByText('333FM Round 1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Select 333-r1')).toBeChecked();
    expect(screen.getByLabelText('Select 222-r1')).toBeChecked();
    expect(screen.getByLabelText('Select 333-r2')).not.toBeChecked();
    expect(screen.getByLabelText('Select 333-r2')).not.toBeDisabled();
    expect(screen.getByLabelText('Select 222-r2')).toBeDisabled();

    const rowTexts = screen.getAllByRole('row').map((row) => row.textContent ?? '');
    expect(rowTexts[1]).toContain('222 Round 1');
    expect(rowTexts[1]).toContain('0 / 2');
    expect(rowTexts[2]).toContain('333 Round 2');
    expect(rowTexts[2]).toContain('0 / 1');
    expect(rowTexts[3]).toContain('333 Round 1');
    expect(rowTexts[3]).toContain('0 / 2');
    expect(rowTexts[4]).toContain('222 Round 2');
    expect(rowTexts[4]).toContain('0 / 0');
    expect(setLocalStorageMock).toHaveBeenCalledWith(
      'bulk-generation.round-order.test-comp',
      JSON.stringify(['222-r1', '333-r2', '333-r1', '222-r2'])
    );
  });

  it('dispatches selected rounds in displayed order after manual reordering', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText('Select 333-r2'));
    await user.click(screen.getByLabelText('Move 333-r2 up'));
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(dispatchMock).toHaveBeenCalledWith({
      type: ActionType.RUN_RECIPES,
      recipeId: 'pnw',
      roundIds: ['333-r2', '222-r1', '333-r1'],
    });
    expect(setLocalStorageMock).toHaveBeenLastCalledWith(
      'bulk-generation.round-order.test-comp',
      JSON.stringify(['333-r2', '222-r1', '333-r1', '222-r2'])
    );
  });

  it('does not dispatch later rounds with no competitors', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(dispatchMock).toHaveBeenCalledWith({
      type: ActionType.RUN_RECIPES,
      recipeId: 'pnw',
      roundIds: ['222-r1', '333-r1'],
    });
  });

  it('uses persisted round order when it is available', async () => {
    const user = userEvent.setup();
    getLocalStorageMock.mockReturnValue(JSON.stringify(['333-r1', '222-r1', '333-r2']));
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(dispatchMock).toHaveBeenCalledWith({
      type: ActionType.RUN_RECIPES,
      recipeId: 'pnw',
      roundIds: ['333-r1', '222-r1'],
    });
    expect(setLocalStorageMock).toHaveBeenCalledWith(
      'bulk-generation.round-order.test-comp',
      JSON.stringify(['333-r1', '222-r1', '333-r2', '222-r2'])
    );
  });

  it('resets persisted order back to schedule order', async () => {
    const user = userEvent.setup();
    getLocalStorageMock.mockReturnValue(JSON.stringify(['333-r1', '222-r1', '333-r2']));
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Reset to Schedule Order' }));
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(setLocalStorageMock).toHaveBeenLastCalledWith(
      'bulk-generation.round-order.test-comp',
      JSON.stringify(['222-r1', '333-r2', '333-r1', '222-r2'])
    );
    expect(dispatchMock).toHaveBeenCalledWith({
      type: ActionType.RUN_RECIPES,
      recipeId: 'pnw',
      roundIds: ['222-r1', '333-r1'],
    });
  });
});
