import type { Activity, AssignmentCode, Competition, Person } from '@wca/helpers';
import type { ConstraintAndWeight } from 'wca-group-generators';

interface OptimizeAssignmentsGloballyProps {
  beforeWcif: Competition;
  wcif: Competition;
  cluster: Person[];
  activities: Activity[];
  assignmentCode: AssignmentCode;
  constraints: ConstraintAndWeight[];
  options?: Record<string, unknown>;
  maxPasses?: number;
  maxEvaluations?: number;
}

const EPSILON = 0.0001;
const DEFAULT_MAX_EVALUATIONS = 1200;

interface EvaluationBudget {
  remaining: number;
}

const activityIdsFor = (activities: Activity[]) => new Set(activities.map((activity) => activity.id));

const matchingAssignment = (
  person: Person,
  activityIds: Set<number>,
  assignmentCode: AssignmentCode
) =>
  person.assignments?.find(
    (assignment) =>
      assignment.assignmentCode === assignmentCode && activityIds.has(assignment.activityId)
  );

const matchingActivityFor = (
  activities: Activity[],
  person: Person,
  activityIds: Set<number>,
  assignmentCode: AssignmentCode
) => {
  const assignment = matchingAssignment(person, activityIds, assignmentCode);
  return activities.find((activity) => activity.id === assignment?.activityId);
};

const withoutMatchingAssignment = (
  person: Person,
  activityIds: Set<number>,
  assignmentCode: AssignmentCode
): Person => ({
  ...person,
  assignments:
    person.assignments?.filter(
      (assignment) =>
        assignment.assignmentCode !== assignmentCode || !activityIds.has(assignment.activityId)
    ) ?? [],
});

const updateAssignmentActivity = (
  wcif: Competition,
  registrantId: number,
  activityIds: Set<number>,
  assignmentCode: AssignmentCode,
  activityId: number
): Competition => ({
  ...wcif,
  persons: wcif.persons.map((person) => {
    if (person.registrantId !== registrantId) {
      return person;
    }

    const nextAssignments =
      person.assignments?.map((assignment) =>
        assignment.assignmentCode === assignmentCode && activityIds.has(assignment.activityId)
          ? { ...assignment, activityId }
          : assignment
      ) ?? [];

    return {
      ...person,
      assignments: matchingAssignment(person, activityIds, assignmentCode)
        ? nextAssignments
        : [...nextAssignments, { activityId, assignmentCode, stationNumber: null }],
    };
  }),
});

const scoreAssignment = (
  wcif: Competition,
  clusterRegistrantIds: Set<number>,
  activities: Activity[],
  assignmentCode: AssignmentCode,
  constraints: ConstraintAndWeight[],
  options: Record<string, unknown> | undefined,
  person: Person,
  activity: Activity
) => {
  const activityIds = activityIdsFor(activities);
  const personWithoutAssignment = withoutMatchingAssignment(person, activityIds, assignmentCode);
  const wcifWithoutAssignment = {
    ...wcif,
    persons: wcif.persons.map((candidate) =>
      candidate.registrantId === person.registrantId ? personWithoutAssignment : candidate
    ),
  };
  const updatedCluster = wcifWithoutAssignment.persons.filter((candidate) =>
    clusterRegistrantIds.has(candidate.registrantId)
  );

  return constraints.reduce<number | null>((total, { constraint, weight, options: constraintOptions }) => {
    if (total === null) {
      return null;
    }

    const score = constraint.score({
      wcif: wcifWithoutAssignment,
      activities,
      cluster: updatedCluster,
      assignmentCode,
      person: personWithoutAssignment,
      activity,
      options: {
        ...options,
        ...constraintOptions,
      },
    });

    return score === null ? null : total + score * weight;
  }, 0);
};

const scoreWcif = (
  wcif: Competition,
  clusterRegistrantIds: Set<number>,
  scoredRegistrantIds: Set<number>,
  activities: Activity[],
  assignmentCode: AssignmentCode,
  constraints: ConstraintAndWeight[],
  options?: Record<string, unknown>
) => {
  const activityIds = activityIdsFor(activities);

  return [...scoredRegistrantIds].reduce((total, registrantId) => {
    if (total === Number.NEGATIVE_INFINITY) {
      return total;
    }

    const person = wcif.persons.find((candidate) => candidate.registrantId === registrantId);
    if (!person) {
      return total;
    }

    const assignment = matchingAssignment(person, activityIds, assignmentCode);
    const activity = activities.find((candidate) => candidate.id === assignment?.activityId);
    if (!assignment || !activity) {
      return Number.NEGATIVE_INFINITY;
    }

    const assignmentScore = scoreAssignment(
      wcif,
      clusterRegistrantIds,
      activities,
      assignmentCode,
      constraints,
      options,
      person,
      activity
    );

    return assignmentScore === null ? Number.NEGATIVE_INFINITY : total + assignmentScore;
  }, 0);
};

const activityCodesFor = (activities: Activity[], activityIds: number[]) => {
  const codes = new Set<string>();

  for (const activityId of activityIds) {
    const activity = activities.find((candidate) => candidate.id === activityId);
    if (activity) {
      codes.add(activity.activityCode);
    }
  }

  return codes;
};

const affectedRegistrantIds = (
  wcif: Competition,
  clusterRegistrantIds: Set<number>,
  activities: Activity[],
  activityIds: Set<number>,
  assignmentCode: AssignmentCode,
  changedActivityIds: number[],
  changedRegistrantIds: number[]
) => {
  const changedActivityCodes = activityCodesFor(activities, changedActivityIds);
  const ids = new Set(changedRegistrantIds);

  for (const person of wcif.persons) {
    if (!clusterRegistrantIds.has(person.registrantId)) {
      continue;
    }

    const activity = matchingActivityFor(activities, person, activityIds, assignmentCode);
    if (activity && changedActivityCodes.has(activity.activityCode)) {
      ids.add(person.registrantId);
    }
  }

  return ids;
};

const scorePeople = (
  wcif: Competition,
  clusterRegistrantIds: Set<number>,
  registrantIds: Set<number>,
  activities: Activity[],
  assignmentCode: AssignmentCode,
  constraints: ConstraintAndWeight[],
  options?: Record<string, unknown>
) => {
  const activityIds = activityIdsFor(activities);

  return [...registrantIds].reduce((total, registrantId) => {
    if (total === Number.NEGATIVE_INFINITY) {
      return total;
    }

    const person = wcif.persons.find((candidate) => candidate.registrantId === registrantId);
    const activity = person
      ? matchingActivityFor(activities, person, activityIds, assignmentCode)
      : undefined;

    if (!person || !activity) {
      return Number.NEGATIVE_INFINITY;
    }

    const score = scoreAssignment(
      wcif,
      clusterRegistrantIds,
      activities,
      assignmentCode,
      constraints,
      options,
      person,
      activity
    );

    return score === null ? Number.NEGATIVE_INFINITY : total + score;
  }, 0);
};

const candidateScoreFor = (
  currentWcif: Competition,
  candidateWcif: Competition,
  clusterRegistrantIds: Set<number>,
  scoredRegistrantIds: Set<number>,
  affectedIds: Set<number>,
  activities: Activity[],
  assignmentCode: AssignmentCode,
  constraints: ConstraintAndWeight[],
  options: Record<string, unknown> | undefined,
  currentScore: number
) => {
  if (currentScore === Number.NEGATIVE_INFINITY) {
    return scoreWcif(
      candidateWcif,
      clusterRegistrantIds,
      scoredRegistrantIds,
      activities,
      assignmentCode,
      constraints,
      options
    );
  }

  const currentAffectedScore = scorePeople(
    currentWcif,
    clusterRegistrantIds,
    affectedIds,
    activities,
    assignmentCode,
    constraints,
    options
  );
  const candidateAffectedScore = scorePeople(
    candidateWcif,
    clusterRegistrantIds,
    affectedIds,
    activities,
    assignmentCode,
    constraints,
    options
  );

  if (
    currentAffectedScore === Number.NEGATIVE_INFINITY ||
    candidateAffectedScore === Number.NEGATIVE_INFINITY
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  return currentScore - currentAffectedScore + candidateAffectedScore;
};

const consumeEvaluation = (budget: EvaluationBudget) => {
  if (budget.remaining <= 0) {
    return false;
  }

  budget.remaining -= 1;
  return true;
};

const findBestMove = (
  wcif: Competition,
  clusterRegistrantIds: Set<number>,
  scoredRegistrantIds: Set<number>,
  movableRegistrantIds: number[],
  activities: Activity[],
  assignmentCode: AssignmentCode,
  constraints: ConstraintAndWeight[],
  options: Record<string, unknown> | undefined,
  currentScore: number,
  budget: EvaluationBudget
) => {
  const activityIds = activityIdsFor(activities);
  let bestWcif = wcif;
  let bestScore = currentScore;

  for (const registrantId of movableRegistrantIds) {
    const person = wcif.persons.find((candidate) => candidate.registrantId === registrantId);
    const currentAssignment = person
      ? matchingAssignment(person, activityIds, assignmentCode)
      : undefined;

    if (!person || !currentAssignment) {
      continue;
    }

    for (const activity of activities) {
      if (activity.id === currentAssignment.activityId) {
        continue;
      }

      if (!consumeEvaluation(budget)) {
        return { wcif: bestWcif, score: bestScore };
      }

      const candidateWcif = updateAssignmentActivity(
        wcif,
        registrantId,
        activityIds,
        assignmentCode,
        activity.id
      );
      const candidateScore = candidateScoreFor(
        wcif,
        candidateWcif,
        clusterRegistrantIds,
        scoredRegistrantIds,
        affectedRegistrantIds(
          wcif,
          clusterRegistrantIds,
          activities,
          activityIds,
          assignmentCode,
          [currentAssignment.activityId, activity.id],
          [registrantId]
        ),
        activities,
        assignmentCode,
        constraints,
        options,
        currentScore
      );

      if (candidateScore > bestScore + EPSILON) {
        bestWcif = candidateWcif;
        bestScore = candidateScore;
      }
    }
  }

  return { wcif: bestWcif, score: bestScore };
};

const findBestSwap = (
  wcif: Competition,
  clusterRegistrantIds: Set<number>,
  scoredRegistrantIds: Set<number>,
  movableRegistrantIds: number[],
  activities: Activity[],
  assignmentCode: AssignmentCode,
  constraints: ConstraintAndWeight[],
  options: Record<string, unknown> | undefined,
  currentScore: number,
  budget: EvaluationBudget
) => {
  const activityIds = activityIdsFor(activities);
  let bestWcif = wcif;
  let bestScore = currentScore;

  for (let firstIndex = 0; firstIndex < movableRegistrantIds.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < movableRegistrantIds.length;
      secondIndex += 1
    ) {
      const firstRegistrantId = movableRegistrantIds[firstIndex];
      const secondRegistrantId = movableRegistrantIds[secondIndex];
      const firstPerson = wcif.persons.find(
        (candidate) => candidate.registrantId === firstRegistrantId
      );
      const secondPerson = wcif.persons.find(
        (candidate) => candidate.registrantId === secondRegistrantId
      );
      const firstAssignment = firstPerson
        ? matchingAssignment(firstPerson, activityIds, assignmentCode)
        : undefined;
      const secondAssignment = secondPerson
        ? matchingAssignment(secondPerson, activityIds, assignmentCode)
        : undefined;

      if (
        !firstAssignment ||
        !secondAssignment ||
        firstAssignment.activityId === secondAssignment.activityId
      ) {
        continue;
      }

      if (!consumeEvaluation(budget)) {
        return { wcif: bestWcif, score: bestScore };
      }

      const candidateWcif = updateAssignmentActivity(
        updateAssignmentActivity(
          wcif,
          firstRegistrantId,
          activityIds,
          assignmentCode,
          secondAssignment.activityId
        ),
        secondRegistrantId,
        activityIds,
        assignmentCode,
        firstAssignment.activityId
      );
      const candidateScore = candidateScoreFor(
        wcif,
        candidateWcif,
        clusterRegistrantIds,
        scoredRegistrantIds,
        affectedRegistrantIds(
          wcif,
          clusterRegistrantIds,
          activities,
          activityIds,
          assignmentCode,
          [firstAssignment.activityId, secondAssignment.activityId],
          [firstRegistrantId, secondRegistrantId]
        ),
        activities,
        assignmentCode,
        constraints,
        options,
        currentScore
      );

      if (candidateScore > bestScore + EPSILON) {
        bestWcif = candidateWcif;
        bestScore = candidateScore;
      }
    }
  }

  return { wcif: bestWcif, score: bestScore };
};

export const optimizeAssignmentsGlobally = ({
  beforeWcif,
  wcif,
  cluster,
  activities,
  assignmentCode,
  constraints,
  options,
  maxPasses = 3,
  maxEvaluations = DEFAULT_MAX_EVALUATIONS,
}: OptimizeAssignmentsGloballyProps) => {
  if (!constraints.length || !activities.length || !cluster.length) {
    return wcif;
  }

  const activityIds = activityIdsFor(activities);
  const clusterRegistrantIds = new Set(cluster.map((person) => person.registrantId));
  const scoredRegistrantIds = new Set(
    wcif.persons
      .filter(
        (person) =>
          clusterRegistrantIds.has(person.registrantId) &&
          matchingAssignment(person, activityIds, assignmentCode)
      )
      .map((person) => person.registrantId)
  );
  const movableRegistrantIds = [...scoredRegistrantIds].filter((registrantId) => {
    const beforePerson = beforeWcif.persons.find((person) => person.registrantId === registrantId);
    return beforePerson ? !matchingAssignment(beforePerson, activityIds, assignmentCode) : true;
  });

  if (!movableRegistrantIds.length) {
    return wcif;
  }

  let bestWcif = wcif;
  let bestScore = scoreWcif(
    bestWcif,
    clusterRegistrantIds,
    scoredRegistrantIds,
    activities,
    assignmentCode,
    constraints,
    options
  );
  const budget = { remaining: maxEvaluations };

  for (let pass = 0; pass < maxPasses; pass += 1) {
    if (budget.remaining <= 0) {
      break;
    }

    const bestMove = findBestMove(
      bestWcif,
      clusterRegistrantIds,
      scoredRegistrantIds,
      movableRegistrantIds,
      activities,
      assignmentCode,
      constraints,
      options,
      bestScore,
      budget
    );
    const bestSwap = findBestSwap(
      bestMove.wcif,
      clusterRegistrantIds,
      scoredRegistrantIds,
      movableRegistrantIds,
      activities,
      assignmentCode,
      constraints,
      options,
      bestMove.score,
      budget
    );

    if (bestSwap.score <= bestScore + EPSILON) {
      break;
    }

    bestWcif = bestSwap.wcif;
    bestScore = bestSwap.score;
  }

  return bestWcif;
};
