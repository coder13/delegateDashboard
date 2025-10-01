import { Competition } from '@wca/helpers';

interface WcifError {
  type: string;
  key: string;
  message: string;
  data?: any;
}

export interface AppState {
  anythingChanged: boolean;
  fetchingUser: boolean;
  fetchingCompetitions?: boolean;
  fetchingCompetitionsError?: any;
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
  competitions: any[];
  errors: WcifError[];
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
