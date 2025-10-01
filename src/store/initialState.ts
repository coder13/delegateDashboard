import { Competition } from '@wca/helpers';

export interface WCIFError {
  type: string;
  key: string;
  message: string;
  data: unknown;
}

export interface CompetitionInfo {
  id: string;
  name: string;
  shortName?: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  url: string;
  website: string;
  cancelled_at: string | null;
  announced_at: string | null;
  registration_open: string | null;
  registration_close: string | null;
}

export interface AppState {
  anythingChanged: boolean;
  fetchingUser: boolean;
  fetchingCompetitions?: boolean;
  fetchingCompetitionsError?: Error | null;
  user: {
    id?: number;
    name?: string;
    avatar?: {
      url: string;
      thumb_url: string;
    };
  };
  fetchingWCIF: boolean;
  uploadingWCIF: boolean;
  needToSave: boolean;
  changedKeys: Set<keyof Competition>;
  wcif: null | Competition;
  competitions: CompetitionInfo[];
  errors: WCIFError[];
}

const INITIAL_STATE: AppState = {
  anythingChanged: false,
  fetchingUser: false,
  user: {},
  fetchingWCIF: false,
  uploadingWCIF: false,
  needToSave: false,
  changedKeys: new Set(),
  wcif: {
    formatVersion: '',
    name: '',
    shortName: '',
    id: '',
    persons: [],
    events: [],
    schedule: {
      venues: [],
      startDate: '',
      numberOfDays: 0,
    },
    extensions: [],
    competitorLimit: 0,
  },
  competitions: [],
  errors: [],
};

export default INITIAL_STATE;
