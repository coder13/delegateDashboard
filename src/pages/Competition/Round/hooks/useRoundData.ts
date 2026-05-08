import {
  activityCodeIsChild,
  hasDistributedAttempts,
  parseActivityCode,
} from '../../../../lib/domain/activities/activityCode';
import { byGroupNumber } from '../../../../lib/domain/activities/activityUtils';
import { type ActivityWithParent, type ActivityWithRoom } from '../../../../lib/domain/types';
import {
  allChildActivities,
  findAllActivities,
  roomByActivity,
} from '../../../../lib/wcif/activities';
import { getRoundConfig } from '../../../../lib/wcif/extensions/competitionScheduler';
import { useAppSelector } from '../../../../store';
import { type AppState } from '../../../../store/initialState';
import {
  selectPersonsAssignedForRound,
  selectPersonsHavingCompetitorAssignmentsForRound,
  selectPersonsShouldBeInRound,
} from '../../../../store/selectors';
import { type Person, type Round } from '@wca/helpers';
import { useMemo } from 'react';

interface RoundDataResult {
  wcif: AppState['wcif'];
  personsShouldBeInRound: Person[];
  roundActivities: ActivityWithRoom[];
  groups: ActivityWithParent[];
  sortedGroups: ActivityWithParent[];
  personsAssigned: Person[];
  personsAssignedToCompete: Person[];
  personsAssignedWithCompetitorAssignmentCount: number;
  adamRoundConfig: {
    groupCount?: number;
    expectedRegistrations?: number;
  } | null;
  isDistributedAttemptRoundLevel: boolean;
  distributedAttemptGroups: Array<{
    attemptNumber: number;
    activities: ActivityWithRoom[];
  }>;
}

export const useRoundData = (activityCode: string, round: Round | undefined): RoundDataResult => {
  const wcif = useAppSelector((state) => state.wcif);

  const personsShouldBeInRound = useAppSelector((state) =>
    round ? selectPersonsShouldBeInRound(state)(round) : []
  );

  const isDistributedAttemptRoundLevel = useMemo(() => {
    const parsedActivityCode = parseActivityCode(activityCode);
    return hasDistributedAttempts(activityCode) && parsedActivityCode.attemptNumber === undefined;
  }, [activityCode]);

  // list of each stage's round activity
  // For distributed attempt rounds at round level, find all attempt activities
  const roundActivities: ActivityWithRoom[] = useMemo(
    () =>
      wcif
        ? findAllActivities(wcif)
            .filter((activity) =>
              isDistributedAttemptRoundLevel
                ? activityCodeIsChild(activityCode, activity.activityCode)
                : activity.activityCode === activityCode
            )
            .map((activity) => {
              const room = roomByActivity(wcif, activity.id);
              if (!room) {
                throw new Error(`Could not find room for activity ${activity.id}`);
              }
              return {
                ...activity,
                room,
              };
            })
        : [],
    [activityCode, isDistributedAttemptRoundLevel, wcif]
  );

  const groups = useMemo(
    () => roundActivities.flatMap((roundActivity) => allChildActivities(roundActivity)),
    [roundActivities]
  );

  const distributedAttemptGroups = useMemo(() => {
    if (!isDistributedAttemptRoundLevel) {
      return [];
    }

    const groupedByAttempt = roundActivities.reduce<
      Record<number, { attemptNumber: number; activities: ActivityWithRoom[] }>
    >((acc, activity) => {
      const { attemptNumber } = parseActivityCode(activity.activityCode);
      if (!attemptNumber) {
        return acc;
      }

      if (!acc[attemptNumber]) {
        acc[attemptNumber] = { attemptNumber, activities: [] };
      }

      acc[attemptNumber].activities.push(activity);
      return acc;
    }, {});

    return Object.values(groupedByAttempt)
      .map((group) => ({
        ...group,
        activities: [...group.activities].sort((a, b) => {
          const roomNameA = a.room.name;
          const roomNameB = b.room.name;
          return roomNameA.localeCompare(roomNameB) || a.id - b.id;
        }),
      }))
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }, [isDistributedAttemptRoundLevel, roundActivities]);

  const sortedGroups = useMemo(
    () =>
      groups.sort((groupA, groupB) => {
        const groupAName = groupA.parent.room.name;
        const groupBName = groupB.parent.room.name;
        return byGroupNumber(groupA, groupB) || groupAName.localeCompare(groupBName);
      }),
    [groups]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personsAssigned = useAppSelector((state: any) =>
    round ? selectPersonsAssignedForRound(state as AppState, round.id) : []
  );

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned.filter((p: Person) =>
        p.assignments?.some((a) => a.assignmentCode === 'competitor')
      ),
    [personsAssigned]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personsAssignedWithCompetitorAssignmentCount = useAppSelector((state: any) =>
    round ? selectPersonsHavingCompetitorAssignmentsForRound(state as AppState, round.id).length : 0
  );

  const adamRoundConfig = round ? (getRoundConfig(round) ?? null) : null;

  return {
    wcif,
    personsShouldBeInRound,
    roundActivities,
    groups,
    sortedGroups,
    personsAssigned,
    personsAssignedToCompete,
    personsAssignedWithCompetitorAssignmentCount,
    adamRoundConfig,
    isDistributedAttemptRoundLevel,
    distributedAttemptGroups,
  };
};
