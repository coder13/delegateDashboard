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
export function generateAssignments(state: { wcif: Competition }) {
  // Validate scramblers

  // validate runners

  // validate delegates

  // assign staff

  // All possible activities for this round

  // const wcif = applySteps({
  //   wcif: state.wcif,
  //   steps: [
  //     {
  //       step: Steps.generateCompetitorAssignments,
  //       activities,
  //       options: {},
  //     },
  //     {
  //       step: Steps.generateCompetitorAssignments,
  //       activities: firstTimerActivities,
  //       options: {
  //         clusterOptions: {
  //           firstTimerActivities: true,
  //         },
  //       },
  //     },
  //     {
  //       step: Steps.generateCompetitorAssignments,
  //       activities,
  //       options: {},
  //     },
  //     {
  //       step: Steps.GenerateJudgeAssignmentsForCompetitors,
  //       activities,
  //       options: {},
  //     },
  //   ],
  // });

  return {
    ...state,
  };
}
