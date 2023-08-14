import { Activity, Competition, Person, parseActivityCode } from '@wca/helpers';
import { Constraints, assignCluster } from 'wca-group-generators';
import { activitiesOverlap, activityCodeIsChild, findAllActivities } from '../../lib/activities';

const createAcceptedPersonsCluster = (persons: Person[]) => {
  return persons.filter((p) => p.registration?.status === 'accepted');
};

const createPersonsInRoundCluster = (wcif: Competition, roundId: string) => (persons: Person[]) => {
  const { eventId, roundNumber } = parseActivityCode(roundId);

  if (roundNumber === 1) {
    return persons.filter((p) => p.registration?.eventIds.includes(eventId));
  }

  const round = wcif.events
    .find((event) => event.id === eventId)
    ?.rounds?.find((round) => round.id === roundId);

  return persons.filter((person) =>
    round?.results.find((result) => result.personId === person.registrantId)
  );
};

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
  // const activityCodes = [...new Set(activities.map((a) => a.activityCode))].sort();
  // const lastActivityCode = activityCodes[activityCodes.length - 1];

  // const groupsForFirstTimers = activities.filter((i) => i.activityCode !== lastActivityCode);

  // const groupGenerator = new GroupGenerator(state.wcif as Competition);

  // debugger;
  // groupGenerator.addConstraint('competitor', Constraints.createUniqueAssignmentConstraint);
  // groupGenerator.addConstraint('competitor', Constraints.mustBeInRoundConstraint);
  // groupGenerator.addConstraint('competitor', Constraints.balancedGroupSize);
  // groupGenerator.addConstraint(
  //   'competitor',
  //   Constraints.SpreadfirstTimersAcrossGroups(groupsForFirstTimers.map((i) => i.activityCode)),
  //   10
  // );

  // groupGenerator.addConstraint('staff-judge', Constraints.mustBeInRoundConstraint);
  // groupGenerator.addConstraint('staff-judge', Constraints.mustNotHaveOtherAssignmentsConstraint);
  // groupGenerator.addConstraint(
  //   'staff-judge',
  //   createConstraint(
  //     'delegateDashboard_judge_assignment_follows_competitor_assignment',
  //     (_, activity, __, person) => {
  //       if (!person?.assignments) {
  //         return 0;
  //       }

  //       const competitorAssignment = person?.assignments.find(
  //         (a) => a.assignmentCode === 'competitor'
  //       );
  //       if (!competitorAssignment) {
  //         return 0;
  //       }

  //       const groupNumbers = new Set(
  //         activities.map((a) => parseActivityCode(a.activityCode).groupNumber) as number[]
  //       );
  //       const competitorActivity = activities.find((a) => a.id === competitorAssignment.activityId);
  //       if (!competitorActivity) {
  //         return 0;
  //       }

  //       const competitorRoomId = findRooms(state.wcif).find((room) => {
  //         const childActivities = room.activities.flatMap((a) => a.childActivities);
  //         return childActivities.some((ca) => ca.id === competitorActivity.id);
  //       })?.id;
  //       const roomId = findRooms(state.wcif).find((room) => {
  //         const childActivities = room.activities.flatMap((a) => a.childActivities);
  //         return childActivities.some((ca) => ca.id === activity.id);
  //       })?.id;

  //       const { groupNumber } = parseActivityCode(activity.activityCode);
  //       const { groupNumber: competitorActivityGroupNumber } = parseActivityCode(
  //         competitorActivity.activityCode
  //       );

  //       if (!competitorActivityGroupNumber || !groupNumber || !competitorRoomId || !roomId) {
  //         return 0;
  //       }

  //       const roomIdScore = competitorRoomId === roomId ? 1000 : 0;
  //       if (groupNumber === (competitorActivityGroupNumber % groupNumbers.size) + 1) {
  //         return 5000 + roomIdScore;
  //       }

  //       return 0;
  //     }
  //   )
  // );

  // groupGenerator.generate(['competitor', 'staff-judge'], activities);\

  // state.wcif

  const acceptedPersons = createAcceptedPersonsCluster(state.wcif.persons);
  const personsInRound = createPersonsInRoundCluster(state.wcif, action.roundId)(acceptedPersons);
  console.log(personsInRound);

  // Validate scramblers

  // validate runners

  // validate delegates

  // assign staff

  // All possible activities for this round
  const activities = findAllActivities(state.wcif)
    .filter(
      (activity) =>
        activityCodeIsChild(action.roundId, activity.activityCode) &&
        action.roundId !== activity.activityCode
    )
    .sort((a, b) => a.activityCode.localeCompare(b.activityCode));

  // const activityCodes = [...new Set(activities.map((a) => a.activityCode))].sort();
  // const lastActivityCode = activityCodes[activityCodes.length - 1];

  const staffWithoutCompetitorAssignments = personsInRound.filter(
    (p) =>
      // has staff assignment
      p.assignments?.some(
        (assignment) =>
          assignment.assignmentCode.includes('staff') &&
          activities.some((a) => a.id === assignment.activityId)
      ) &&
      // but does not have competitor assignment
      !p.assignments?.some(
        (assignment) =>
          assignment.assignmentCode === 'competitor' &&
          activities.some((a) => a.id === assignment.activityId)
      )
  );
  const allActivities = findAllActivities(state.wcif);
  // const groupNumbers = new Set(
  //   activities.map((a) => parseActivityCode(a.activityCode).groupNumber) as number[]
  // );

  // for each staff, figure out the best competitor assignment for them.
  const transformedPersons = assignCluster({
    cluster: staffWithoutCompetitorAssignments,
    wcif: state.wcif,
    activities,
    assignmentCode: 'competitor',
    constraints: [
      {
        constraint: Constraints.createUniqueAssignmentConstraint,
        weight: 1,
      },
      {
        constraint: {
          name: 'must_not_have_conflicting_assignments',
          // returns null if the person has an assignment at the same or overlapping times
          score: (_, activity, __, person) => {
            return person.assignments?.some((assignment) => {
              const assignedActivity = allActivities.find((a) => a.id === assignment.activityId);

              if (!assignedActivity) {
                return false;
              }

              return activitiesOverlap(activity, assignedActivity);
            })
              ? null
              : 0;
          },
        },
        weight: 1,
      },
      {
        constraint: {
          name: 'maximize_distance_between_staff_and_competing_assignment',
          score: (_, activity, __, person) => {
            if (!person?.assignments) {
              return 0;
            }

            const staffAssignments = person?.assignments
              .filter(
                (assignment) =>
                  assignment.assignmentCode.includes('staff') &&
                  activities.find((a) => a.id === assignment.activityId)
              )
              .map((assignment) => {
                // Implication from the filter means that activity is not undefined
                const _activity = allActivities.find(
                  (a) => a.id === assignment.activityId
                ) as Activity;

                return {
                  ...assignment,
                  activity: _activity,
                  groupNumber: parseActivityCode(_activity.activityCode).groupNumber,
                };
              })
              .sort((a, b) => a.activity.startTime.localeCompare(b.activity.startTime));

            // const { groupNumber } = parseActivityCode(activity.activityCode);
            if (activity.startTime < staffAssignments[0].activity.startTime) {
              return 1;
            }

            // if not maximize the number of breaks before.

            console.log(166, person.name, staffAssignments);

            // const competitorRoomId = findRooms(state.wcif).find((room) => {
            //   const childActivities = room.activities.flatMap((a) => a.childActivities);
            //   return childActivities.some((ca) => ca.id === competitorActivity.id);
            // })?.id;

            return 0;
          },
        },
        weight: 10,
      },
    ],
  });

  return {
    ...state,
    wcif: {
      ...state.wcif,
      persons: transformedPersons,
    },
  };
}
