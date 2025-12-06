import type { Competition } from '@wca/helpers';
import { validateEventRounds } from './eventRoundValidation';
import { validatePersonAssignments } from './personAssignmentValidation';
import type { ValidationError } from './types';

export * from './types';
export * from './eventRoundValidation';
export * from './personAssignmentValidation';

/**
 * Validates a WCIF object and returns all validation errors
 * @param wcif - The WCIF competition object to validate
 * @returns Array of validation errors
 */
export const validateWcif = (wcif: Competition): ValidationError[] => {
  const eventRoundErrors = validateEventRounds(wcif);
  const personAssignmentErrors = validatePersonAssignments(wcif);
  
  return [...eventRoundErrors, ...personAssignmentErrors].filter(Boolean);
};
