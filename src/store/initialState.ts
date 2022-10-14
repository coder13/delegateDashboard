import { Competition } from '@wca/helpers';
import CompetingAssignmentsForDelegatesAndOrganizers from '../lib/groupAssignments/CompetingAssignmentsForDelegatesAndOrganizers';
import CompetingAssignmentsForEveryoneGenerator from '../lib/groupAssignments/CompetingAssignmentsForEveryone';
import CompetingAssignmentsForStaffGenerator from '../lib/groupAssignments/CompetingAssignmentsFromStaffAssignments';
import { GroupGenerator } from '../lib/groupAssignments/GroupGenerator';
import JudgeAssignmentsFromCompetingAssignments from '../lib/groupAssignments/JudgeAssignmentsFromCompetingAssignments';

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
  wcif: Competition;
  competitions: [];
  errors: [];
  groupGenerators: GroupGenerator[];
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
    CompetingAssignmentsForStaffGenerator,
    CompetingAssignmentsForDelegatesAndOrganizers,
    CompetingAssignmentsForEveryoneGenerator,
    JudgeAssignmentsFromCompetingAssignments,
  ],
};

export default INITIAL_STATE;
