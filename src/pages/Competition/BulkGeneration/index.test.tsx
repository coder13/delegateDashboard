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
import type {
  BulkGenerationWorkerRequest,
  BulkGenerationWorkerResponse,
} from './bulkGenerationWorkerTypes';
import type { EventId } from '@wca/helpers';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchMock = vi.fn();
const useAppSelectorMock = vi.fn();
const getLocalStorageMock = vi.fn();
const setLocalStorageMock = vi.fn();
const workerInstances: MockWorker[] = [];

class MockWorker {
  onmessage: ((event: MessageEvent<BulkGenerationWorkerResponse>) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    workerInstances.push(this);
  }

  get request() {
    return this.postMessage.mock.calls[0]?.[0] as BulkGenerationWorkerRequest | undefined;
  }

  emit(message: BulkGenerationWorkerResponse) {
    this.onmessage?.({ data: message } as MessageEvent<BulkGenerationWorkerResponse>);
  }
}

vi.mock('../../../store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: AppState) => unknown) => useAppSelectorMock(selector),
}));

vi.mock('../../../lib/api', () => ({
  getLocalStorage: (key: string) => getLocalStorageMock(key),
  setLocalStorage: (key: string, value: string) => setLocalStorageMock(key, value),
}));

vi.mock('../../../dialogs/ConfigureAssignmentsDialog/ConfigureAssignmentsDialog', () => ({
  default: ({
    activityCode,
    defaultShowAllCompetitors,
    onClose,
  }: {
    activityCode: string;
    defaultShowAllCompetitors?: boolean;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label={`Preview ${activityCode}`}>
      <span>Previewing {activityCode}</span>
      <span>Show all: {defaultShowAllCompetitors ? 'yes' : 'no'}</span>
      <button onClick={onClose}>Close Preview</button>
    </div>
  ),
}));

vi.mock('../../../dialogs/ConfigureGroupCountsDialog', () => ({
  default: ({ activityCode, onClose }: { activityCode: string; onClose: () => void }) => (
    <div role="dialog" aria-label={`Configure groups ${activityCode}`}>
      <span>Configuring groups for {activityCode}</span>
      <button onClick={onClose}>Close Configure Groups</button>
    </div>
  ),
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
        childActivities: [],
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
    workerInstances.length = 0;
    vi.stubGlobal('Worker', MockWorker);
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
    expect(screen.getByText('3x3 Round 1')).toBeInTheDocument();
    expect(screen.getByText('3x3 Round 2')).toBeInTheDocument();
    expect(screen.getByText('2x2 Round 1')).toBeInTheDocument();
    expect(screen.getByText('2x2 Round 2')).toBeInTheDocument();
    expect(screen.queryByText('333FM Round 1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Select 333-r1')).toBeChecked();
    expect(screen.getByLabelText('Select 222-r1')).toBeChecked();
    expect(screen.getByLabelText('Select 333-r2')).not.toBeChecked();
    expect(screen.getByLabelText('Select 333-r2')).not.toBeDisabled();
    expect(screen.getByLabelText('Select 222-r2')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();

    const rowTexts = screen.getAllByRole('row').map((row) => row.textContent ?? '');
    expect(rowTexts[1]).toContain('2x2 Round 1');
    expect(rowTexts[1]).toContain('0 / 2');
    expect(rowTexts[2]).toContain('3x3 Round 2');
    expect(rowTexts[2]).toContain('0 / 1');
    expect(rowTexts[3]).toContain('3x3 Round 1');
    expect(rowTexts[3]).toContain('0 / 2');
    expect(rowTexts[4]).toContain('2x2 Round 2');
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
    const worker = workerInstances[0];

    expect(worker.request).toMatchObject({
      type: 'runBulkGeneration',
      recipeId: 'pnw',
      roundIds: ['333-r2', '222-r1', '333-r1'],
    });
    act(() => {
      worker.emit({ type: 'complete', wcif: buildCompetition() });
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: ActionType.PARTIAL_UPDATE_WCIF,
      wcif: expect.objectContaining({
        events: expect.any(Array),
        persons: expect.any(Array),
        schedule: expect.any(Object),
      }),
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
    const worker = workerInstances[0];

    expect(worker.request).toMatchObject({
      type: 'runBulkGeneration',
      recipeId: 'pnw',
      roundIds: ['222-r1', '333-r1'],
    });
  });

  it('uses persisted round order when it is available', async () => {
    const user = userEvent.setup();
    getLocalStorageMock.mockReturnValue(JSON.stringify(['333-r1', '222-r1', '333-r2']));
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    const worker = workerInstances[0];

    expect(worker.request).toMatchObject({
      type: 'runBulkGeneration',
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
    const worker = workerInstances[0];

    expect(setLocalStorageMock).toHaveBeenLastCalledWith(
      'bulk-generation.round-order.test-comp',
      JSON.stringify(['222-r1', '333-r2', '333-r1', '222-r2'])
    );
    expect(worker.request).toMatchObject({
      type: 'runBulkGeneration',
      recipeId: 'pnw',
      roundIds: ['222-r1', '333-r1'],
    });
  });

  it('shows worker progress and disables controls while generation is running', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    const worker = workerInstances[0];

    expect(screen.getByText('Starting bulk generation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
    expect(screen.getByLabelText('Select 333-r1')).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Preview/ })[0]).toBeDisabled();

    act(() => {
      worker.emit({ type: 'progress', phase: 'generating', roundId: '222-r1' });
    });
    expect(screen.getByText('Generating for 2x2 Round 1')).toBeInTheDocument();

    act(() => {
      worker.emit({ type: 'progress', phase: 'fixing' });
    });
    expect(screen.getByText('Fixing group assignments')).toBeInTheDocument();

    act(() => {
      worker.emit({ type: 'progress', phase: 'staff', roundId: '333-r1' });
    });
    expect(screen.getByText('Generating staff assignments for 3x3 Round 1')).toBeInTheDocument();
  });

  it('shows worker errors and leaves WCIF unchanged', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    act(() => {
      workerInstances[0].emit({ type: 'error', message: 'Recipe failed' });
    });

    expect(screen.getByText('Recipe failed')).toBeInTheDocument();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('opens assignment preview for a round', async () => {
    const user = userEvent.setup();
    renderPage();

    const roundRow = screen
      .getAllByRole('row')
      .find((row) => row.textContent?.includes('3x3 Round 2'));
    expect(roundRow).toBeDefined();

    await user.click(within(roundRow as HTMLElement).getByRole('button', { name: /Preview/ }));

    expect(screen.getByRole('dialog', { name: 'Preview 333-r2' })).toBeInTheDocument();
    expect(screen.getByText('Show all: yes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close Preview' }));

    expect(screen.queryByRole('dialog', { name: 'Preview 333-r2' })).not.toBeInTheDocument();
  });

  it('opens group count configuration for rounds without groups', async () => {
    const user = userEvent.setup();
    renderPage();

    const roundRow = screen
      .getAllByRole('row')
      .find((row) => row.textContent?.includes('2x2 Round 2'));
    expect(roundRow).toBeDefined();

    await user.click(within(roundRow as HTMLElement).getByRole('button', { name: 'Configure' }));

    expect(
      screen.getByRole('dialog', { name: 'Configure groups 222-r2' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close Configure Groups' }));

    expect(
      screen.queryByRole('dialog', { name: 'Configure groups 222-r2' })
    ).not.toBeInTheDocument();
  });
});
