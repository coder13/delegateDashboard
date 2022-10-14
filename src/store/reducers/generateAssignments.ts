import { AppState } from '../initialState';
import { bulkAddPersonAssignments } from './competitorAssignments';

/**
 * Fills in assignment gaps. Everyone should end up having a competitor assignment and staff assignment
 * 1. Start with giving out competitor assignments.
 *   1a Start with assigning competitor assignments to people who are already assigned to staff
 *   1b Assign organizers and delegates their competing assignments, don't assign  staff assignments
 *   1c Then hand out competitor assignments to people who are not assigned to staff
 *
 * 2. Then give out judging assignments to competitors without staff assignments
 */
export function generateAssignments(state: AppState, action) {
  const initializedGenerators = state.groupGenerators.map((generator) =>
    generator.initialize(state.wcif, action.roundId)
  );

  const newAssignments = initializedGenerators.reduce((accumulatingAssignments, generator) => {
    if (!generator) {
      return accumulatingAssignments;
    }

    const generatedAssignments = generator.reduce(accumulatingAssignments);
    console.log('generatedAssignments', generatedAssignments);
    return [...accumulatingAssignments, ...generatedAssignments];
  }, []);

  console.log('Generating new assignmments', newAssignments);

  return bulkAddPersonAssignments(state, {
    assignments: newAssignments,
  });
}
