import { ValidationError } from '../lib/wcif/validation';
import { Competition } from '@wca/helpers';

interface CompetitionSearchResult {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  country_iso2: string;
}

export interface AppState {
  anythingChanged: boolean;
  fetchingUser: boolean;
  fetchingCompetitions?: boolean;
  fetchingCompetitionsError?: Error;
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
  competitions: CompetitionSearchResult[];
  errors: ValidationError[];
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
