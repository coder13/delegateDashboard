import { Competition } from '@wca/helpers';

const INITIAL_STATE: {
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
  wcif: Competition;
  competitions: [];
  errors: [];
} = {
  anythingChanged: false,
  fetchingUser: false,
  user: {},
  fetchingWCIF: false,
  uploadingWCIF: false,
  needToSave: false,
  changedKeys: new Set(),
  wcif: {
    formatVersion: '1.0',
    id: '',
    name: '',
    shortName: '',
    schedule: {
      startDate: '',
      numberOfDays: 0,
      venues: [],
    },
    events: [],
    persons: [],
  },
  competitions: [],
  errors: [],
};

export default INITIAL_STATE;
