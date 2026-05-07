import {
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
    activities: ActivityWithParent[];
  }>;
}

export const useRoundData = (activityCode: string, round: Round | undefined): RoundDataResult => {
  const wcif = useAppSelector((state) => state.wcif);

  const personsShouldBeInRound = useAppSelector((state) =>
    round ? selectPersonsShouldBeInRound(state)(round) : []
  );

  // list of each stage's round activity
  const roundActivities: ActivityWithRoom[] = wcif
    ? findAllActivities(wcif)
        .filter((activity) => activity.activityCode === activityCode)
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
    : [];

  const groups = roundActivities.flatMap((roundActivity) => allChildActivities(roundActivity));
  const parsedActivityCode = parseActivityCode(activityCode);
  const isDistributedAttemptRoundLevel =
    hasDistributedAttempts(activityCode) && parsedActivityCode.attemptNumber === undefined;

  const distributedAttemptGroups = useMemo(() => {
    if (!isDistributedAttemptRoundLevel) {
      return [];
    }

    const groupedByAttempt = groups.reduce<
      Record<number, { attemptNumber: number; activities: ActivityWithParent[] }>
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
          const roomNameA =
            typeof a.parent === 'object' && 'room' in a.parent ? a.parent.room.name : '';
          const roomNameB =
            typeof b.parent === 'object' && 'room' in b.parent ? b.parent.room.name : '';
          return roomNameA.localeCompare(roomNameB) || a.id - b.id;
        }),
      }))
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }, [groups, isDistributedAttemptRoundLevel]);

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
