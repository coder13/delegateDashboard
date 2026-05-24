import { parseActivityCode } from '@wca/helpers';
import type { Activity, Competition, Event, Person, Round } from '@wca/helpers';
import Assignments from '../../config/assignments';
import { findGroupActivitiesByRound } from '../wcif/activities';
import { acceptedRegistrations, personsShouldBeInRound } from '../domain/persons';
import type { ClusterDefinition } from './types';
import { byPROrResult } from 'wca-group-generators';

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
    filter: (assignmentCode: string, activityIds: number[]) => (person: Person) =>
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
    filter: (assignmentCode: string, activityIds: number[]) => (person: Person) =>
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
    case 'personsInRound': {
      const round = wcif.events.flatMap((e) => e.rounds).find((r) => r.id === roundId) as Round;
      return personsShouldBeInRound(round)(acceptedRegistrations(wcif.persons));
    }
    default:
      return wcif.persons;
  }
};

const KEY_STAFF_ROLES = ['delegate', 'trainee-delegate', 'organizer'];

const firstNameFor = (name: string) => name.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

const phoneticFirstNameFor = (name: string) =>
  firstNameFor(name)
    .replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f')
    .replace(/^c/, 'k')
    .replace(/^q/, 'k')
    .replace(/[sz]/g, 's')
    .replace(/h/g, '')
    .replace(/(.)\1+/g, '$1');

const staffAssignmentCount = (person: Person, activityIds: number[]) =>
  person.assignments?.filter(
    (assignment) =>
      activityIds.includes(assignment.activityId) && assignment.assignmentCode.startsWith('staff-')
  ).length ?? 0;

const assignmentCount = (person: Person, activityIds: number[]) =>
  person.assignments?.filter((assignment) => activityIds.includes(assignment.activityId)).length ??
  0;

const keyRoleCount = (person: Person) =>
  KEY_STAFF_ROLES.filter((role) => person.roles?.includes(role)).length;

const similarFirstNameCount = (person: Person, persons: Person[]) => {
  const firstName = firstNameFor(person.name);
  const phoneticFirstName = phoneticFirstNameFor(person.name);

  return persons.filter((candidate) => {
    if (candidate.registrantId === person.registrantId) {
      return false;
    }

    const candidateFirstName = firstNameFor(candidate.name);
    return (
      candidateFirstName === firstName ||
      candidateFirstName.startsWith(firstName) ||
      firstName.startsWith(candidateFirstName) ||
      phoneticFirstNameFor(candidate.name) === phoneticFirstName
    );
  }).length;
};

const constrainedScore = (person: Person, persons: Person[], activityIds: number[]) =>
  staffAssignmentCount(person, activityIds) * 1000 +
  keyRoleCount(person) * 800 +
  (!person.wcaId ? 400 : 0) +
  similarFirstNameCount(person, persons) * 100 +
  assignmentCount(person, activityIds) * 25;

export const sortCluster = (
  wcif: Competition,
  cluster: ClusterDefinition,
  persons: Person[],
  roundId: string,
  activities: Activity[]
) => {
  if (!cluster.sort) {
    return persons;
  }

  if (cluster.sort.by === 'speed') {
    const { eventId, roundNumber } = parseActivityCode(roundId) as {
      eventId: string;
      roundNumber: number;
    };
    const event = wcif.events.find((e) => e.id === eventId) as Event;
    const sortedPersons = persons.sort(byPROrResult(event, roundNumber));
    return cluster.sort.direction === 'asc' ? sortedPersons : sortedPersons.reverse();
  }

  if (cluster.sort.by === 'mostConstrained') {
    const activityIds = activities.map((activity) => activity.id);
    const { eventId, roundNumber } = parseActivityCode(roundId) as {
      eventId: string;
      roundNumber: number;
    };
    const event = wcif.events.find((e) => e.id === eventId) as Event;
    const speedComparator = byPROrResult(event, roundNumber);
    const sortedPersons = [...persons].sort((personA, personB) => {
      const scoreDiff =
        constrainedScore(personB, persons, activityIds) -
        constrainedScore(personA, persons, activityIds);

      return (
        scoreDiff || speedComparator(personA, personB) || personA.name.localeCompare(personB.name)
      );
    });

    return cluster.sort.direction === 'desc' ? sortedPersons : sortedPersons.reverse();
  }

  return persons;
};


export const getCluster = (wcif: Competition, cluster: ClusterDefinition, roundId: string) => {
  const activities = findGroupActivitiesByRound(wcif, roundId);
  const activityIds = activities.map((a) => a.id);

  const baseCluster = getBaseCluster(wcif, cluster.base, roundId);

  if (!cluster.filters?.length) {
    return baseCluster;
  }

  const filteredCluster = cluster.filters.reduce((acc, { key, value }) => {
    const filter = Filters.find((f) => f.key === key)?.filter;
    if (!filter) {
      throw new Error(`Filter ${key} not found`);
    }

    // @ts-expect-error filter typing depends on filter key/value pair
    return acc.filter(filter(value, activityIds));
  }, baseCluster);

  return sortCluster(wcif, cluster, filteredCluster, roundId, activities);
};
