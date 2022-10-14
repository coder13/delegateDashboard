import { Competition } from '@wca/helpers';
import { InProgressAssignment } from '../assignments';

export type Generator = {
  /**
   * Validates that the groups have been generated according to the generator's rules.
   */
  validate: () => boolean;
  reduce: (assignments: InProgressAssignment[]) => InProgressAssignment[];
};

export interface GroupGenerator {
  id: string;
  name: string;
  description: string;

  /**
   * Initializes a generator that can be used to generate groups or validate that groups have been generated.
   */
  initialize: (wcif: Competition, roundActivityCode: string) => Generator | undefined;
}
