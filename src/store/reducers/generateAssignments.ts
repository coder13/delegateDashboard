import { Competition, parseActivityCode } from '@wca/helpers';
import { GroupGenerator, Constraints } from 'wca-group-generators';
import { createConstraint } from 'wca-group-generators/dist/constraints';
import { activityCodeIsChild, findAllActivities, findRooms } from '../../lib/activities';

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
  const activities = findAllActivities(state.wcif)
    .filter(
      (activity) =>
        activityCodeIsChild(action.roundId, activity.activityCode) &&
        action.roundId !== activity.activityCode
    )
    .sort((a, b) => a.activityCode.localeCompare(b.activityCode));

  const activityCodes = [...new Set(activities.map((a) => a.activityCode))].sort();
  const lastActivityCode = activityCodes[activityCodes.length - 1];

  const groupsForFirstTimers = activities.filter((i) => i.activityCode !== lastActivityCode);

  const groupGenerator = new GroupGenerator(state.wcif as Competition);

  debugger;
  groupGenerator.addConstraint('competitor', Constraints.createUniqueAssignmentConstraint);
  groupGenerator.addConstraint('competitor', Constraints.mustBeInRoundConstraint);
  groupGenerator.addConstraint('competitor', Constraints.balancedGroupSize);
  groupGenerator.addConstraint(
    'competitor',
    Constraints.SpreadfirstTimersAcrossGroups(groupsForFirstTimers.map((i) => i.activityCode)),
    10
  );

  groupGenerator.addConstraint('staff-judge', Constraints.mustBeInRoundConstraint);
  groupGenerator.addConstraint('staff-judge', Constraints.mustNotHaveOtherAssignmentsConstraint);
  groupGenerator.addConstraint(
    'staff-judge',
    createConstraint(
      'delegateDashboard_judge_assignment_follows_competitor_assignment',
      (_, activity, __, person) => {
        if (!person?.assignments) {
          return 0;
        }

        const competitorAssignment = person?.assignments.find(
          (a) => a.assignmentCode === 'competitor'
        );
        if (!competitorAssignment) {
          return 0;
        }

        const groupNumbers = new Set(
          activities.map((a) => parseActivityCode(a.activityCode).groupNumber) as number[]
        );
        const competitorActivity = activities.find((a) => a.id === competitorAssignment.activityId);
        if (!competitorActivity) {
          return 0;
        }

        const competitorRoomId = findRooms(state.wcif).find((room) => {
          const childActivities = room.activities.flatMap((a) => a.childActivities);
          return childActivities.some((ca) => ca.id === competitorActivity.id);
        })?.id;
        const roomId = findRooms(state.wcif).find((room) => {
          const childActivities = room.activities.flatMap((a) => a.childActivities);
          return childActivities.some((ca) => ca.id === activity.id);
        })?.id;

        const { groupNumber } = parseActivityCode(activity.activityCode);
        const { groupNumber: competitorActivityGroupNumber } = parseActivityCode(
          competitorActivity.activityCode
        );

        if (!competitorActivityGroupNumber || !groupNumber || !competitorRoomId || !roomId) {
          return 0;
        }

        const roomIdScore = competitorRoomId === roomId ? 1000 : 0;
        if (groupNumber === (competitorActivityGroupNumber % groupNumbers.size) + 1) {
          return 5000 + roomIdScore;
        }

        return 0;
      }
    )
  );

  groupGenerator.generate(['competitor', 'staff-judge'], activities);

  const newWcif = groupGenerator.getWcif();

  return {
    ...state,
    wcif: {
      ...state.wcif,
      ...newWcif,
    },
  };
}
