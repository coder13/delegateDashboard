import { generateCompetingAssignmentsForStaff } from '../../lib/groupAssignments/generateCompetingAssignmentsForStaff';
import { generateCompetingGroupActitivitesForEveryone } from '../../lib/groupAssignments/generateCompetingGroupActitivitesForEveryone';
import { generateGroupAssignmentsForDelegatesAndOrganizers } from '../../lib/groupAssignments/generateGroupAssignmentsForDelegatesAndOrganizers';
import { generateJudgeAssignmentsFromCompetingAssignments } from '../../lib/groupAssignments/generateJudgeAssignmentsFromCompetingAssignments';
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
export function generateAssignments(state, action) {
  return {
    ...state,
    ...bulkAddPersonAssignments(state, {
      assignments: [
        generateCompetingAssignmentsForStaff,
        generateGroupAssignmentsForDelegatesAndOrganizers,
        generateCompetingGroupActitivitesForEveryone,
        generateJudgeAssignmentsFromCompetingAssignments,
      ].reduce((acc, generateFn) => generateFn(state, action.roundId, acc, action.options), []),
    }),
  };
}
