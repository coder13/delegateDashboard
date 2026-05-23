import { parseActivityCode, type Activity } from '@wca/helpers';
import { roomByActivity, type Constraint } from 'wca-group-generators';

const DEFAULT_KEY_STAFF_ROLES = ['delegate', 'trainee-delegate', 'organizer'];

const isStaffAssignmentCode = (assignmentCode: string) => assignmentCode.startsWith('staff-');

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

export const RecipeConstraints: Record<string, Constraint> = {
  shouldHelpAfterCompeting,
  preferLaterGroups,
  mustNotHaveRoles,
  onlyMultipleGroupRounds,
  avoidSimilarFirstNames,
};
