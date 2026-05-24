import { parseActivityCode } from '../domain/activities';
import { roomByActivity, type Constraint } from 'wca-group-generators';

type Activity = Parameters<Constraint['score']>[0]['activity'];
type Wcif = Parameters<Constraint['score']>[0]['wcif'];

const DEFAULT_KEY_STAFF_ROLES = ['delegate', 'trainee-delegate', 'organizer'];
const DEFAULT_GAP_CAP_MINUTES = 120;
const DEFAULT_NO_GAP_PENALTY = 100;

const isStaffAssignmentCode = (assignmentCode: string) => assignmentCode.startsWith('staff-');
const isCompetitorAssignmentCode = (assignmentCode: string) => assignmentCode === 'competitor';

const firstNameFor = (name: string) => name.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

const phoneticFirstNameFor = (name: string) => {
  return firstNameFor(name)
    .replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f')
    .replace(/^c/, 'k')
    .replace(/^q/, 'k')
    .replace(/[sz]/g, 's')
    .replace(/h/g, '')
    .replace(/(.)\1+/g, '$1');
};

const groupNumberFor = (activity: Activity) => parseActivityCode(activity.activityCode).groupNumber;

const roundKeyFor = (activity: Activity) => {
  const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
  return `${eventId}-r${roundNumber}`;
};

const sameRoomActivities = (
  wcif: Parameters<Constraint['score']>[0]['wcif'],
  activities: Activity[],
  activity: Activity
) => {
  const activityRoom = roomByActivity(wcif, activity.id);

  return activities.filter((candidate) => {
    const candidateRoom = roomByActivity(wcif, candidate.id);
    return (
      candidateRoom?.id === activityRoom?.id && roundKeyFor(candidate) === roundKeyFor(activity)
    );
  });
};

const earliestStaffActivityForPerson = (
  activities: Activity[],
  person: Parameters<Constraint['score']>[0]['person']
) => {
  const staffActivities =
    person.assignments
      ?.filter((assignment) => isStaffAssignmentCode(assignment.assignmentCode))
      .map((assignment) => activities.find((activity) => activity.id === assignment.activityId))
      .filter(Boolean) ?? [];

  return (staffActivities as Activity[]).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
};

const minutesBetween = (before: Activity, after: Activity) =>
  (new Date(after.startTime).getTime() - new Date(before.endTime).getTime()) / 60000;

const gapScore = (minutes: number, gapCapMinutes: number, noGapPenalty: number) =>
  minutes > 0 ? Math.min(minutes, gapCapMinutes) / gapCapMinutes : -noGapPenalty;

const activitiesOverlap = (first: Activity, second: Activity) =>
  new Date(first.startTime) < new Date(second.endTime) &&
  new Date(second.startTime) < new Date(first.endTime);

const groupNumberCountsByRound = (activities: Activity[]) => {
  const groupNumbersByRound = activities.reduce((groups, activity) => {
    const groupNumber = groupNumberFor(activity);
    const roundKey = roundKeyFor(activity);

    if (groupNumber) {
      groups.set(roundKey, (groups.get(roundKey) ?? new Set<number>()).add(groupNumber));
    }

    return groups;
  }, new Map<string, Set<number>>());

  return new Map(
    [...groupNumbersByRound.entries()].map(([roundKey, groupNumbers]) => [
      roundKey,
      groupNumbers.size,
    ])
  );
};

const scheduleContextCache = new WeakMap<
  Wcif['schedule'],
  {
    activityById: Map<number, Activity>;
    groupNumberCountsByRound: Map<string, number>;
  }
>();

const scheduleContextFor = (wcif: Wcif) => {
  const cached = scheduleContextCache.get(wcif.schedule);
  if (cached) {
    return cached;
  }

  const activities = wcif.schedule.venues.flatMap((venue) =>
    venue.rooms.flatMap((room) =>
      room.activities.flatMap((activity) => [activity, ...(activity.childActivities ?? [])])
    )
  );
  const context = {
    activityById: new Map(activities.map((activity) => [activity.id, activity])),
    groupNumberCountsByRound: groupNumberCountsByRound(activities),
  };

  scheduleContextCache.set(wcif.schedule, context);
  return context;
};

const assignmentActivitiesForPerson = (
  wcif: Wcif,
  person: Parameters<Constraint['score']>[0]['person'],
  assignmentTest: (assignmentCode: string) => boolean
) => {
  const { activityById } = scheduleContextFor(wcif);

  return (
    person.assignments
      ?.filter((assignment) => assignmentTest(assignment.assignmentCode))
      .map((assignment) => activityById.get(assignment.activityId))
      .filter(Boolean) as Activity[]
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const nearestAssignmentGapScore = (
  activity: Activity,
  activities: Activity[],
  gapCapMinutes: number,
  noGapPenalty: number
) => {
  if (!activities.length) {
    return 0;
  }

  return Math.min(
    ...activities.map((otherActivity) => {
      if (new Date(otherActivity.endTime) <= new Date(activity.startTime)) {
        return gapScore(minutesBetween(otherActivity, activity), gapCapMinutes, noGapPenalty);
      }

      if (new Date(activity.endTime) <= new Date(otherActivity.startTime)) {
        return gapScore(minutesBetween(activity, otherActivity), gapCapMinutes, noGapPenalty);
      }

      return -noGapPenalty;
    })
  );
};

const staffBeforeCompetitorGapScore = (
  competitorActivity: Activity,
  staffActivities: Activity[],
  gapCapMinutes: number,
  noGapPenalty: number
) => {
  const priorStaffActivities = staffActivities.filter(
    (staffActivity) =>
      new Date(staffActivity.startTime) < new Date(competitorActivity.startTime) ||
      activitiesOverlap(staffActivity, competitorActivity)
  );

  return nearestAssignmentGapScore(
    competitorActivity,
    priorStaffActivities,
    gapCapMinutes,
    noGapPenalty
  );
};

const staffBeforeFutureCompetitorGapScore = (
  staffActivity: Activity,
  competitorActivities: Activity[],
  gapCapMinutes: number,
  noGapPenalty: number
) => {
  const futureCompetitorActivities = competitorActivities.filter(
    (competitorActivity) =>
      new Date(staffActivity.startTime) < new Date(competitorActivity.startTime) ||
      activitiesOverlap(staffActivity, competitorActivity)
  );

  if (!futureCompetitorActivities.length) {
    return 0;
  }

  return Math.min(
    ...futureCompetitorActivities.map((competitorActivity) =>
      gapScore(minutesBetween(staffActivity, competitorActivity), gapCapMinutes, noGapPenalty)
    )
  );
};

const isTwoGroupSameRoundTransition = (
  firstActivity: Activity,
  secondActivity: Activity,
  roundGroupCounts: Map<string, number>
) =>
  roundKeyFor(firstActivity) === roundKeyFor(secondActivity) &&
  roundGroupCounts.get(roundKeyFor(firstActivity)) === 2;

const isImmediateTransition = (firstActivity: Activity, secondActivity: Activity) =>
  firstActivity.endTime &&
  secondActivity.startTime &&
  new Date(firstActivity.endTime).getTime() === new Date(secondActivity.startTime).getTime();

export const shouldHelpAfterCompeting: Constraint = {
  name: 'Should Help After Competing',
  score: ({ wcif, activities, activity, person }) => {
    const staffActivity = earliestStaffActivityForPerson(activities, person);
    if (!staffActivity) {
      return 0;
    }

    const staffGroupNumber = groupNumberFor(staffActivity);
    if (!staffGroupNumber) {
      return 0;
    }

    const stageActivities = sameRoomActivities(wcif, activities, staffActivity);
    const groupNumbers = stageActivities.map(groupNumberFor).filter(Boolean) as number[];
    if (!groupNumbers.length) {
      return 0;
    }

    const previousGroupNumber =
      ((staffGroupNumber - 2 + groupNumbers.length) % groupNumbers.length) + 1;

    return groupNumberFor(activity) === previousGroupNumber ? 1 : 0;
  },
};

export const preferLaterGroups: Constraint = {
  name: 'Prefer Later Groups',
  score: ({ activities, activity }) => {
    const groupNumber = groupNumberFor(activity);
    const maxGroupNumber = Math.max(...activities.map(groupNumberFor).filter(Boolean) as number[]);

    if (!groupNumber || !Number.isFinite(maxGroupNumber) || maxGroupNumber <= 0) {
      return 0;
    }

    return groupNumber / maxGroupNumber;
  },
};

export const mustNotHaveRoles: Constraint = {
  name: 'Must Not Have Roles',
  score: ({ person, options }) => {
    const roles = (options?.roles ?? DEFAULT_KEY_STAFF_ROLES) as string[];
    const hasRole = roles.some((role) => person.roles?.includes(role));

    return hasRole ? null : 0;
  },
};

export const onlyMultipleGroupRounds: Constraint = {
  name: 'Only Multiple Group Rounds',
  score: ({ activities }) => {
    const groupNumbers = new Set(activities.map(groupNumberFor).filter(Boolean));

    return groupNumbers.size <= 1 ? null : 0;
  },
};

export const avoidSimilarFirstNames: Constraint = {
  name: 'Avoid Similar First Names',
  score: ({ wcif, activities, activity, assignmentCode, person }) => {
    const firstName = firstNameFor(person.name);
    const phoneticFirstName = phoneticFirstNameFor(person.name);

    const conflictCountForActivity = (candidateActivity: Activity) => {
      const peopleInActivity = wcif.persons.filter((candidate) =>
        candidate.assignments?.some(
          (assignment) =>
            assignment.assignmentCode === assignmentCode &&
            assignment.activityId === candidateActivity.id
        )
      );

      return peopleInActivity.filter((candidate) => {
        const candidateFirstName = firstNameFor(candidate.name);
        return (
          candidateFirstName === firstName ||
          candidateFirstName.startsWith(firstName) ||
          firstName.startsWith(candidateFirstName) ||
          phoneticFirstNameFor(candidate.name) === phoneticFirstName
        );
      }).length;
    };

    const conflicts = conflictCountForActivity(activity);
    if (conflicts === 0) {
      return 0;
    }

    const hasConflictFreeActivity = activities.some(
      (candidateActivity) => conflictCountForActivity(candidateActivity) === 0
    );

    return hasConflictFreeActivity ? null : -conflicts;
  },
};

export const maximizeAssignmentGaps: Constraint = {
  name: 'Maximize Assignment Gaps',
  score: ({ wcif, activity, assignmentCode, person, options }) => {
    const scoredPerson = wcif.persons.find(
      (candidate) => candidate.registrantId === person.registrantId
    ) ?? person;
    const gapCapMinutes = (options?.gapCapMinutes as number | undefined) ?? DEFAULT_GAP_CAP_MINUTES;
    const noGapPenalty = (options?.noGapPenalty as number | undefined) ?? DEFAULT_NO_GAP_PENALTY;
    const staffActivities = assignmentActivitiesForPerson(
      wcif,
      scoredPerson,
      isStaffAssignmentCode
    );
    const competitorActivities = assignmentActivitiesForPerson(
      wcif,
      scoredPerson,
      isCompetitorAssignmentCode
    );

    if (isCompetitorAssignmentCode(assignmentCode)) {
      return (
        staffBeforeCompetitorGapScore(activity, staffActivities, gapCapMinutes, noGapPenalty) +
        nearestAssignmentGapScore(activity, competitorActivities, gapCapMinutes, noGapPenalty)
      );
    }

    if (isStaffAssignmentCode(assignmentCode)) {
      return staffBeforeFutureCompetitorGapScore(
        activity,
        competitorActivities,
        gapCapMinutes,
        noGapPenalty
      );
    }

    return 0;
  },
};

export const avoidImmediateHelpingThenCompeting: Constraint = {
  name: 'Avoid Immediate Helping Then Competing',
  score: ({ wcif, activity, assignmentCode, person }) => {
    const scoredPerson = wcif.persons.find(
      (candidate) => candidate.registrantId === person.registrantId
    ) ?? person;
    const { groupNumberCountsByRound: roundGroupCounts } = scheduleContextFor(wcif);
    const staffActivities = assignmentActivitiesForPerson(
      wcif,
      scoredPerson,
      isStaffAssignmentCode
    );
    const competitorActivities = assignmentActivitiesForPerson(
      wcif,
      scoredPerson,
      isCompetitorAssignmentCode
    );

    if (isCompetitorAssignmentCode(assignmentCode)) {
      const hasImmediatePriorStaffActivity = staffActivities.some(
        (staffActivity) =>
          isImmediateTransition(staffActivity, activity) &&
          !isTwoGroupSameRoundTransition(staffActivity, activity, roundGroupCounts)
      );

      return hasImmediatePriorStaffActivity ? null : 0;
    }

    if (isStaffAssignmentCode(assignmentCode)) {
      const hasImmediateFutureCompetitorActivity = competitorActivities.some(
        (competitorActivity) =>
          isImmediateTransition(activity, competitorActivity) &&
          !isTwoGroupSameRoundTransition(activity, competitorActivity, roundGroupCounts)
      );

      return hasImmediateFutureCompetitorActivity ? null : 0;
    }

    return 0;
  },
};

export const RecipeConstraints: Record<string, Constraint> = {
  shouldHelpAfterCompeting,
  preferLaterGroups,
  mustNotHaveRoles,
  onlyMultipleGroupRounds,
  avoidSimilarFirstNames,
  maximizeAssignmentGaps,
  avoidImmediateHelpingThenCompeting,
};
