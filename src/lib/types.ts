import { Assignment } from '@wca/helpers';

export interface InProgressAssignmment {
  registrantId: number;
  assignment: Assignment;
}

export type BulkInProgressAssignments = Array<InProgressAssignmment>;
