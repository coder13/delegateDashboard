import { Assignment, Person } from '@wca/helpers';

export interface InProgressAssignment {
  registrantId: number;
  assignment: Assignment;
}

/**
 * So that I don't have to remember the data format
 */
export const createGroupAssignment = (
  registrantId: number,
  activityId: any,
  assignmentCode: string,
  stationNumber?: number
): InProgressAssignment => ({
  registrantId: registrantId,
  assignment: {
    assignmentCode,
    activityId,
    stationNumber,
  },
});

export type HasAssignmentTest = (assignment: Assignment) => boolean;

export const isStaffAssignment: HasAssignmentTest = (assignment: Assignment) =>
  assignment.assignmentCode.startsWith('staff');

export const isCompetitorAssignment: HasAssignmentTest = (assignment: Assignment) =>
  assignment.assignmentCode === 'competitor';

export const isJudgeAssignment: HasAssignmentTest = (assignment: Assignment) =>
  assignment.assignmentCode === 'staff-judge';

/**
 * The hard part about testing if a person has assignments is that we need to scope it to a set of groupIds as well as
 * still referencing the evolving set of assignments
 * Performs an optional check based on if groupIds is passed or assignments is passed.
 * If neither are passed, then runs the test on all assignments
 * @param test
 * @returns
 */
export const hasAssignment =
  (test: HasAssignmentTest) =>
  ({ assignments, groupIds }: { assignments?: InProgressAssignment[]; groupIds?: number[] }) =>
  (person: Person) => {
    if (groupIds && person.assignments?.some((a) => groupIds.includes(+a.activityId) && test(a))) {
      return true;
    }

    if (
      assignments &&
      assignments
        .filter((a) => a.registrantId === person.registrantId)
        .some((a) => test(a.assignment))
    ) {
      return true;
    }

    if (!groupIds && !assignments) {
      return person.assignments?.some(test);
    }

    return false;
  };

export const doesNotHaveAssignment =
  (test: HasAssignmentTest) =>
  ({ assignments, groupIds }: { assignments?: InProgressAssignment[]; groupIds?: number[] }) =>
  (person: Person) => {
    return !hasAssignment(test)({ assignments, groupIds })(person);
  };

/**
 * The hard part about testing if a person has assignments is that we need to scope it to a set of groupIds as well as
 * still referencing the evolving set of assignments
 * Performs an optional check based on if groupIds is passed or assignments is passed.
 * If neither are passed, then runs the test on all assignments
 * @param test
 * @returns
 */
export const filterAssignments =
  (test: HasAssignmentTest) =>
  ({ assignments, groupIds }: { assignments?: InProgressAssignment[]; groupIds?: number[] }) =>
  (person: Person) => {
    if (assignments || groupIds) {
      return [
        ...(assignments
          ? assignments
              .filter((a) => a.registrantId === person.registrantId && test(a.assignment))
              .map(({ assignment }) => assignment)
          : []),
        ...(groupIds && person.assignments
          ? person.assignments?.filter((a) => groupIds.includes(+a.activityId) && test(a))
          : []),
      ];
    }

    return person.assignments?.filter(test) || [];
  };

export const hasStaffAssignment = hasAssignment(isStaffAssignment);
export const hasJudgingAssignment = hasAssignment(isJudgeAssignment);
export const hasCompetitorAssignment = hasAssignment(isCompetitorAssignment);

export const missingCompetitorAssignments = doesNotHaveAssignment(isCompetitorAssignment);
export const missingStaffAssignments = doesNotHaveAssignment(isStaffAssignment);

export const findCompetingAssignment = filterAssignments(isCompetitorAssignment);
