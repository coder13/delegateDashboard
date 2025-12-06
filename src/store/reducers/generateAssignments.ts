import {
  generateCompetingAssignmentsForStaff,
  generateCompetingGroupActitivitesForEveryone,
  generateGroupAssignmentsForDelegatesAndOrganizers,
  generateJudgeAssignmentsFromCompetingAssignments,
} from '../../lib/assignmentGenerators';
import { InProgressAssignmment } from '../../lib/domain/assignments';
import { bulkAddPersonAssignments } from './competitorAssignments';
import { Competition } from '@wca/helpers';

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
  state: {
    wcif: Competition;
  },
  action
) {
  const initializedGenerators = [
    generateCompetingAssignmentsForStaff,
    generateGroupAssignmentsForDelegatesAndOrganizers,
    generateCompetingGroupActitivitesForEveryone,
    generateJudgeAssignmentsFromCompetingAssignments,
  ]
    .map((generator) => generator(state.wcif, action.roundId))
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
