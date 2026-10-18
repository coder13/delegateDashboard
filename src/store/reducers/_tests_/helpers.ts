import INITIAL_STATE, { type AppState } from '../../initialState';
import type { PersonWithRegistrantId } from '../../../lib/domain/persons';
import type { Activity, Competition, Event, Person, Round } from '@wca/helpers';

type ActivityOverrides = Partial<Activity>;
type PersonOverrides = Partial<PersonWithRegistrantId>;
type RoundOverrides = Partial<Round>;
type EventOverrides = Partial<Event>;

export const buildActivity = (overrides: ActivityOverrides = {}): Activity => ({
  id: 1,
  name: 'Round 1',
  activityCode: '333-r1',
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T11:00:00Z',
  childActivities: [],
  extensions: [],
  ...overrides,
});

export const buildPerson = (overrides: PersonOverrides = {}): PersonWithRegistrantId => ({
  name: 'Test Person',
  registrantId: 1,
  wcaUserId: 1,
  wcaId: '2024TEST01',
  countryIso2: 'US',
  gender: 'm',
  birthdate: '2000-01-01',
  email: 'test@example.com',
  registration: {
    status: 'accepted',
    eventIds: [],
    isCompeting: true,
    comments: undefined,
    wcaRegistrationId: 1,
  },
  assignments: [],
  roles: [],
  personalBests: [],
  extensions: [],
  avatar: null,
  ...overrides,
});

export const buildWcif = (activities: Activity[], persons: Person[] = []): Competition => ({
  formatVersion: '2.0',
  name: 'Test Competition',
  shortName: 'test',
  id: 'test-comp',
  events: [],
  persons,
  schedule: {
    startDate: '2024-01-01',
    numberOfDays: 1,
    venues: [
      {
        id: 1,
        name: 'Main Venue',
        latitudeMicrodegrees: 0,
        longitudeMicrodegrees: 0,
        countryIso2: 'US',
        timezone: 'America/New_York',
        extensions: [],
        rooms: [
          {
            id: 10,
            name: 'Room A',
            color: '#000',
            extensions: [],
            activities,
          },
        ],
      },
    ],
  },
  extensions: [],
  competitorLimit: null,
  series: null,
  registrationInfo: {
    openTime: '2024-01-01T00:00:00Z',
    closeTime: '2024-01-02T00:00:00Z',
    baseEntryFee: 0,
    currencyCode: 'USD',
    onTheSpotRegistration: false,
    useWcaRegistration: false,
  },
});

export const buildRound = (overrides: RoundOverrides = {}): Round => ({
  id: '333-r1',
  linkedRounds: null,
  format: 'a',
  timeLimit: null,
  cutoff: null,
  participationRuleset: null,
  results: [],
  scrambleSetCount: 1,
  extensions: [],
  ...overrides,
});

export const buildEvent = (overrides: EventOverrides = {}): Event => ({
  id: '333',
  rounds: [buildRound()],
  competitorLimit: null,
  qualification: null,
  extensions: [],
  ...overrides,
});

export const buildWcifWithEvents = (
  activities: Activity[],
  events: Event[],
  persons: Person[] = []
): Competition => ({
  ...buildWcif(activities, persons),
  events,
});

export const buildState = (wcif: Competition | null): AppState => ({
  ...INITIAL_STATE,
  wcif,
  changedKeys: new Set(),
  needToSave: false,
});
