import { Competition } from '@wca/helpers';
import { generateCompetingAssignmentsForStaff } from '../lib/groupAssignments/generateCompetingAssignmentsForStaff';

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
  groupGenerators: {
    id: string;
    name: string;
    description: string;
    generate: typeof generateCompetingAssignmentsForStaff;
  }[];
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
  groupGenerators: [
    {
      id: 'GenerateCompetingAssignmentsFromStaffAssignments',
      name: 'Generate Competing Assignments From Staff Assignments',
      description: 'Generates competing assignments based on pre-existing staff assignments.',
      generate: generateCompetingAssignmentsForStaff,
    },
  ],
};

export default INITIAL_STATE;
