import {
  generateCompetingAssignmentsForStaff,
  generateCompetingGroupActitivitesForEveryone,
  generateGroupAssignmentsForDelegatesAndOrganizers,
  generateJudgeAssignmentsFromCompetingAssignments,
} from '../../lib/assignmentGenerators';
import { type InProgressAssignmment } from '../../lib/types';
import { type GenerateAssignmentsPayload } from '../actions';
import { type AppState } from '../initialState';
import { bulkAddPersonAssignments } from './competitorAssignments';

type AssignmentsReducer = ((a: InProgressAssignmment[]) => InProgressAssignmment[])[];

/**
 * Fills in assignment gaps. Everyone should end up having a competitor assignment and staff assignment
 * 1. Start with giving out competitor assignments.
 *   1a Start with assigning competitor assignments to people who are already assigned to staff
 *   1b Assign organizers and delegates their competing assignments, don't assign  staff assignments
 *   1c Then hand out competitor assignments to people who are not assigned to staff
 *
 * 2. Then give out judging assignments to competitors without staff assignments
 */
export function generateAssignments(state: AppState, action: GenerateAssignmentsPayload): AppState {
  if (!state.wcif) return state;

  const initializedGenerators = [
    generateCompetingAssignmentsForStaff,
    generateGroupAssignmentsForDelegatesAndOrganizers,
    generateCompetingGroupActitivitesForEveryone,
    generateJudgeAssignmentsFromCompetingAssignments,
  ]
    .map((generator) => generator(state.wcif!, action.roundId))
    .filter(Boolean) as AssignmentsReducer;

  const newAssignments = initializedGenerators.reduce((accumulatingAssignments, generateFn) => {
    const generatedAssignments = generateFn(accumulatingAssignments);
    return [...accumulatingAssignments, ...generatedAssignments];
  }, [] as InProgressAssignmment[]);

  return bulkAddPersonAssignments(state, {
    assignments: newAssignments,
  });
}
