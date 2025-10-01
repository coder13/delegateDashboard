import { Competition } from '@wca/helpers';
import { InProgressAssignmment } from '../../lib/assignments';
import { generateCompetingAssignmentsForStaff } from '../../lib/groupAssignments/generateCompetingAssignmentsForStaff';
import { generateCompetingGroupActitivitesForEveryone } from '../../lib/groupAssignments/generateCompetingGroupActitivitesForEveryone';
import { generateGroupAssignmentsForDelegatesAndOrganizers } from '../../lib/groupAssignments/generateGroupAssignmentsForDelegatesAndOrganizers';
import { generateJudgeAssignmentsFromCompetingAssignments } from '../../lib/groupAssignments/generateJudgeAssignmentsFromCompetingAssignments';
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
export function generateAssignments(
  state: AppState,
  action: { roundId: string }
): AppState {
  if (!state.wcif) {
    return state;
  }

  const initializedGenerators = [
    generateCompetingAssignmentsForStaff,
    generateGroupAssignmentsForDelegatesAndOrganizers,
    generateCompetingGroupActitivitesForEveryone,
    generateJudgeAssignmentsFromCompetingAssignments,
  ]
    .map((generator) => generator(state.wcif!, action.roundId))
    .filter(Boolean) as ((a: InProgressAssignmment[]) => InProgressAssignmment[])[];

  const newAssignments = initializedGenerators.reduce((accumulatingAssignments, generateFn) => {
    const generatedAssignments = generateFn(accumulatingAssignments);
    console.log('generatedAssignments', generatedAssignments);
    return [...accumulatingAssignments, ...generatedAssignments];
  }, [] as InProgressAssignmment[]);

  console.log('Generating new assignmments', newAssignments);

  return bulkAddPersonAssignments(state, {
    assignments: newAssignments,
  });
}
