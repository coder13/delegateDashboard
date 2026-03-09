import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test-utils';
import ImportPage from './index';
import type { AppState } from '../../../store/initialState';

const useAppSelectorMock = vi.fn();
const dispatchMock = vi.fn();
const setBreadcrumbsMock = vi.fn();
const readStringMock = vi.fn();

vi.mock('../../../store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => useAppSelectorMock(selector),
  useAppDispatch: () => dispatchMock,
}));

vi.mock('../../../providers/BreadcrumbsProvider', () => ({
  useBreadcrumbs: () => ({ setBreadcrumbs: setBreadcrumbsMock }),
}));

vi.mock('react-papaparse', () => ({
  usePapaParse: () => ({
    readString: readStringMock,
  }),
}));

describe('ImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;

      readAsText() {
        this.onload?.({ target: { result: 'email,333\nalice@example.com,1' } });
      }
    }

    vi.stubGlobal('FileReader', MockFileReader);
  });

  const buildState = (overrides?: Partial<AppState['wcif']>) =>
    ({
      wcif: {
        id: 'comp-123',
        name: 'Test Competition',
        shortName: 'Test Competition',
        formatVersion: '1.0',
        competitorLimit: null,
        extensions: [],
        series: [],
        persons: [],
        events: [
          {
            id: '333',
            rounds: [],
            competitorLimit: null,
            qualification: null,
            extensions: [],
          },
        ],
        schedule: {
          startDate: '2024-01-01',
          numberOfDays: 1,
          venues: [],
        },
        registrationInfo: {
          openTime: '2024-01-01T00:00:00Z',
          closeTime: '2024-01-02T00:00:00Z',
          baseEntryFee: 0,
          currencyCode: 'USD',
          onTheSpotRegistration: false,
          useWcaRegistration: false,
        },
        ...overrides,
      },
    } as unknown as AppState);

  const uploadCsv = (
    container: HTMLElement,
    getByRole: (role: string, options?: { name?: string | RegExp }) => HTMLElement
  ) => {
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['csv'], 'assignments.csv')] } });
    fireEvent.submit(getByRole('button', { name: 'IMPORT CSV' }).closest('form') as HTMLFormElement);
  };

  it('tells users the CSV importer is limited to Round 1 assignments', () => {
    const state = buildState();

    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );

    const { getByText } = renderWithProviders(<ImportPage />);

    expect(
      getByText(/This import flow only supports Round 1 assignments\./)
    ).toBeInTheDocument();
    expect(setBreadcrumbsMock).toHaveBeenCalledWith([{ text: 'Import' }]);
  });

  it('keeps the Round 1-only warning visible after a CSV is loaded for import', () => {
    const state = buildState();

    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );
    readStringMock.mockImplementation(
      (
        _csv: string,
        options: {
          complete: (result: { meta: { fields: string[] }; data: Array<Record<string, string>> }) => void;
        }
      ) => {
        options.complete({
          meta: { fields: ['email', '333'] },
          data: [{ email: 'alice@example.com', '333': '1' }],
        });
      }
    );

    const { container, getByRole, getByText } = renderWithProviders(<ImportPage />);
    uploadCsv(container, getByRole);

    expect(
      getByText(/This only generates and imports Round 1 assignments\./)
    ).toBeInTheDocument();
    expect(getByText('1 people found')).toBeInTheDocument();
  });

  it('shows an error when assignment generation is ambiguous across multiple stages', () => {
    const state = buildState({
      persons: [
        {
          registrantId: 1,
          wcaUserId: 1,
          name: 'Alice',
          email: 'alice@example.com',
          countryIso2: 'US',
          gender: 'f',
          birthdate: '2000-01-01',
          avatar: null,
          roles: [],
          assignments: [],
          personalBests: [],
          extensions: [],
          wcaId: null,
          registration: {
            wcaRegistrationId: 1,
            status: 'accepted',
            eventIds: ['333'],
            isCompeting: true,
            guests: 0,
            comments: '',
          },
        },
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
                id: 10,
                name: 'A Stage',
                color: '#000',
                extensions: [],
                activities: [
                  {
                    id: 1,
                    name: '3x3 Round 1',
                    activityCode: '333-r1',
                    startTime: '2024-01-01T09:00:00.000Z',
                    endTime: '2024-01-01T10:00:00.000Z',
                    childActivities: [],
                    extensions: [],
                  },
                ],
              },
              {
                id: 11,
                name: 'B Stage',
                color: '#111',
                extensions: [],
                activities: [
                  {
                    id: 2,
                    name: '3x3 Round 1',
                    activityCode: '333-r1',
                    startTime: '2024-01-01T09:00:00.000Z',
                    endTime: '2024-01-01T10:00:00.000Z',
                    childActivities: [],
                    extensions: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );
    readStringMock.mockImplementation(
      (
        _csv: string,
        options: {
          complete: (result: { meta: { fields: string[] }; data: Array<Record<string, string>> }) => void;
        }
      ) => {
        options.complete({
          meta: { fields: ['email', '333'] },
          data: [{ email: 'alice@example.com', '333': '1' }],
        });
      }
    );

    const { container, getByRole, getByText } = renderWithProviders(<ImportPage />);
    uploadCsv(container, getByRole);
    fireEvent.click(getByRole('button', { name: 'GENERATE COMPETITOR ASSIGNMENTS' }));

    expect(getByText('Stage data for competitor assignment is ambiguous')).toBeInTheDocument();
  });

  it('dispatches a WCIF update when valid competitor assignments are imported', () => {
    const state = buildState({
      persons: [
        {
          registrantId: 1,
          wcaUserId: 1,
          name: 'Alice',
          email: 'alice@example.com',
          countryIso2: 'US',
          gender: 'f',
          birthdate: '2000-01-01',
          avatar: null,
          roles: [],
          assignments: [],
          personalBests: [],
          extensions: [],
          wcaId: null,
          registration: {
            wcaRegistrationId: 1,
            status: 'accepted',
            eventIds: ['333'],
            isCompeting: true,
            guests: 0,
            comments: '',
          },
        },
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
                id: 10,
                name: 'Main Stage',
                color: '#000',
                extensions: [],
                activities: [
                  {
                    id: 1,
                    name: '3x3 Round 1',
                    activityCode: '333-r1',
                    startTime: '2024-01-01T09:00:00.000Z',
                    endTime: '2024-01-01T10:00:00.000Z',
                    childActivities: [
                      {
                        id: 2,
                        name: '3x3 Round 1 Group 1',
                        activityCode: '333-r1-g1',
                        startTime: '2024-01-01T09:00:00.000Z',
                        endTime: '2024-01-01T09:30:00.000Z',
                        childActivities: [],
                        extensions: [],
                      },
                    ],
                    extensions: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );
    readStringMock.mockImplementation(
      (
        _csv: string,
        options: {
          complete: (result: { meta: { fields: string[] }; data: Array<Record<string, string>> }) => void;
        }
      ) => {
        options.complete({
          meta: { fields: ['email', '333'] },
          data: [{ email: 'alice@example.com', '333': '1' }],
        });
      }
    );

    const { container, getByRole } = renderWithProviders(<ImportPage />);
    uploadCsv(container, getByRole);
    fireEvent.click(getByRole('button', { name: 'GENERATE COMPETITOR ASSIGNMENTS' }));
    fireEvent.click(getByRole('button', { name: 'IMPORT COMPETITOR ASSIGNMENTS' }));

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'partial_update_wcif',
        wcif: expect.objectContaining({
          persons: [
            expect.objectContaining({
              assignments: [
                expect.objectContaining({
                  activityId: 2,
                  assignmentCode: 'competitor',
                }),
              ],
            }),
          ],
        }),
      })
    );
  });

  it('renders nothing when there is no WCIF loaded', () => {
    const state = {
      wcif: null,
    } as unknown as AppState;

    useAppSelectorMock.mockImplementation((selector: (state: AppState) => unknown) =>
      selector(state)
    );

    const { container } = renderWithProviders(<ImportPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
