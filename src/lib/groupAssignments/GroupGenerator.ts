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
   * Returns undefined iff the generators is not applicable to the given round or if the round can't be found.
   */
  initialize: (wcif: Competition, roundActivityCode: string) => Generator | undefined;
}
