import { Competition } from '@wca/helpers';

export interface AppState {
  anythingChanged: boolean;
  fetchingUser: boolean;
  user: {
    id?: number;
    name?: string;
    avatar?: {
      url: string;
      thumb_url: string;
    };
  };
  fetchingWCIF: false;
  uploadingWCIF: false;
  needToSave: false;
  changedKeys: Set<keyof Competition>;
  wcif: null | Competition;
  competitions: [];
  errors: [];
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
