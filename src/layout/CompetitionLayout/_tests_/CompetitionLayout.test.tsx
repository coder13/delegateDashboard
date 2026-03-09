import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import { CompetitionLayout } from '../CompetitionLayout';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import type { AppState } from '../../../store/initialState';

const useAppSelectorMock = vi.fn();
const dispatchMock = vi.fn();
const useAppDispatchMock = vi.fn(() => dispatchMock);
const enqueueSnackbarMock = vi.fn();
const getLocalStorageMock = vi.fn();
const setLocalStorageMock = vi.fn();
const fetchWCIFMock = vi.fn((competitionId: string) => ({
  type: 'FETCH_WCIF',
  competitionId,
}));
const uploadCurrentWCIFChangesMock = vi.fn((cb: (error?: Error) => void) => ({
  type: 'UPLOAD_WCIF',
  cb,
}));

vi.mock('../../../store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => useAppSelectorMock(selector),
  useAppDispatch: () => useAppDispatchMock(),
}));

vi.mock('../../../store/actions', () => ({
  fetchWCIF: (competitionId: string) => fetchWCIFMock(competitionId),
  uploadCurrentWCIFChanges: (cb: (error?: Error) => void) => uploadCurrentWCIFChangesMock(cb),
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: enqueueSnackbarMock }),
}));

vi.mock('../../../lib/api', () => ({
  getLocalStorage: (key: string) => getLocalStorageMock(key),
  setLocalStorage: (key: string, value: string) => setLocalStorageMock(key, value),
}));

const renderLayout = () =>
  renderWithProviders(
    <Routes>
      <Route path="/competitions/:competitionId" element={<CompetitionLayout />}>
        <Route index element={<div>Child Content</div>} />
      </Route>
    </Routes>,
    { route: '/competitions/comp-123' }
  );

describe('CompetitionLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLocalStorageMock.mockReturnValue('false');
    const baseState = {
      fetchingWCIF: false,
      needToSave: false,
      wcif: { id: 'comp-123', name: 'Test Competition' },
      errors: [],
    } as unknown as AppState;
    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(baseState)
    );
  });

  it('renders breadcrumbs and outlet content when wcif is loaded', () => {
    const { getByText, getAllByText } = renderLayout();

    expect(getByText('Competitions')).toBeInTheDocument();
    expect(getAllByText('Test Competition').length).toBeGreaterThan(0);
    expect(getByText('Child Content')).toBeInTheDocument();
  });

  it('dispatches fetchWCIF on mount', () => {
    renderLayout();

    expect(fetchWCIFMock).toHaveBeenCalledWith('comp-123');
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'FETCH_WCIF',
      competitionId: 'comp-123',
    });
  });

  it('does not render outlet when wcif is missing', () => {
    const state = {
      fetchingWCIF: false,
      needToSave: false,
      wcif: null,
      errors: [],
    } as unknown as AppState;
    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );

    const { queryByText, getByText } = renderLayout();

    expect(getByText('Competitions')).toBeInTheDocument();
    expect(queryByText('Child Content')).not.toBeInTheDocument();
  });

  it('shows loading backdrop when fetching WCIF', () => {
    const state = {
      fetchingWCIF: true,
      needToSave: false,
      wcif: { id: 'comp-123', name: 'Test Competition' },
      errors: [],
    } as unknown as AppState;
    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );

    const { getByRole } = renderLayout();
    expect(getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('renders errors when present', () => {
    const state = {
      fetchingWCIF: false,
      needToSave: false,
      wcif: { id: 'comp-123', name: 'Test Competition' },
      errors: [
        { type: 'unknown_type', key: 'err-1', message: 'Error one', data: {} },
        { type: 'unknown_type', key: 'err-2', message: 'Error two', data: {} },
      ],
    } as unknown as AppState;
    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );

    const { getByText } = renderLayout();
    expect(getByText('Error one')).toBeInTheDocument();
    expect(getByText('Error two')).toBeInTheDocument();
  });

  it('toggles drawer and persists state to local storage', async () => {
    const { getByLabelText } = renderLayout();

    await userEvent.click(getByLabelText('menu'));
    expect(setLocalStorageMock).toHaveBeenCalledWith('drawer-open', 'true');
  });

  it('saves on Ctrl+S and shows snackbar results', () => {
    const { getByRole } = renderLayout();

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    const successCallback = uploadCurrentWCIFChangesMock.mock.calls[0][0];
    successCallback();

    expect(enqueueSnackbarMock).toHaveBeenCalledWith('Saved!', { variant: 'success' });

    fireEvent.click(getByRole('button', { name: 'SAVE' }));
    const errorCallback = uploadCurrentWCIFChangesMock.mock.calls[1][0];
    errorCallback(new Error('save failed'));

    expect(enqueueSnackbarMock).toHaveBeenCalledWith('Error saving changes', { variant: 'error' });
  });
});
