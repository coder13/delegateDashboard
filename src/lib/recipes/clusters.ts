import { Competition, Person, Round } from '@wca/helpers';
import { Assignments } from '../../config/assignments';
import { findGroupActivitiesByRound } from '../activities';
import { acceptedRegistrations, personsShouldBeInRound } from '../persons';
import { ClusterDefinition } from './types';

export const Filters = [
  {
    key: 'hasAssignmentInRound',
    name: 'Has Assignment In Round',
    type: 'select',
    options: [
      {
        id: 'staff-*',
        name: 'Staff Any',
      },
      ...Assignments,
    ],
    filter: (assignmentCode: string, activityIds) => (person: Person) =>
      person.assignments?.some((assignment) => {
        if (!activityIds.includes(assignment.activityId)) {
          return false;
        }

        if (assignmentCode === 'staff-*') {
          return assignment.assignmentCode.startsWith('staff-');
        }

        return assignment.assignmentCode === assignmentCode;
      }),
  },
  {
    key: 'doesNotHaveAssignmentInRound',
    name: 'Does Not Have Assignment In Round',
    type: 'select',
    options: [
      {
        id: 'staff-*',
        name: 'Staff Any',
      },
      ...Assignments,
    ],
    filter: (assignmentCode: string, activityIds) => (person: Person) =>
      !person.assignments?.some((assignment) => {
        if (!activityIds.includes(assignment.activityId)) {
          return false;
        }

        if (assignmentCode === 'staff-*') {
          return assignment.assignmentCode.startsWith('staff-');
        }

        return assignment.assignmentCode === assignmentCode;
      }),
  },
  {
    key: 'hasRole',
    name: 'Has Role',
    type: 'select-multiple',
    options: [
      {
        id: 'delegate',
        name: 'Delegate',
      },
      {
        id: 'trainee-delegate',
        name: 'Delegate',
      },
      {
        id: 'organizer',
        name: 'Organizer',
      },
      {
        id: 'staff-.*',
        name: 'Staff',
      },
    ],
    filter: (roles: string[]) => (person: Person) =>
      roles.some((role) => person.roles?.some((r) => new RegExp(role).test(r))),
  },
  {
    key: 'isFirstTimer',
    name: 'Is First Timer',
    type: 'boolean',
    filter: (isFirstTimer: boolean) => (person: Person) =>
      isFirstTimer ? !person.wcaId : !!person.wcaId,
  },
];

export const getBaseCluster = (
  wcif: Competition,
  base: ClusterDefinition['base'],
  roundId: string
) => {
  switch (base) {
    case 'personsInRound':
      const round = wcif.events.flatMap((e) => e.rounds).find((r) => r.id === roundId) as Round;
      return personsShouldBeInRound(round)(acceptedRegistrations(wcif.persons));
    default:
      return wcif.persons;
  }
};

export const getCluster = (wcif: Competition, cluster: ClusterDefinition, roundId: string) => {
  const activityIds = findGroupActivitiesByRound(wcif, roundId).map((a) => a.id);

  const baseCluster = getBaseCluster(wcif, cluster.base, roundId);

  if (!cluster.filters?.length) {
    return baseCluster;
  }

  return cluster.filters.reduce((acc, { key, value }) => {
    const filter = Filters.find((f) => f.key === key)?.filter;
    if (!filter) {
      throw new Error(`Filter ${key} not found`);
    }

    // @ts-ignore
    return acc.filter(filter(value, activityIds));
  }, baseCluster);
};
