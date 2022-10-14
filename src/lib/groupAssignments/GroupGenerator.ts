import { Competition } from '@wca/helpers';
import { InProgressAssignment } from '../assignments';

export type GeneratorReduceFn = (assignments: InProgressAssignment[]) => InProgressAssignment[];

export interface GroupGenerator {
  id: string;
  name: string;
  description: string;

  /**
   * Validates that the groups have been generated according to the generator's rules.
   */
  validate: (wcif: Competition, roundActivityCode: string) => boolean;
  generate: (wcif: Competition, roundActiviyCode: string) => GeneratorReduceFn | undefined;
}
