import { Competition, Person, Round } from '@wca/helpers';
import { Assignments } from '../../config/assignments';
import { acceptedRegistrations, personsShouldBeInRound } from '../persons';
import { Step } from './types';

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
      person.assignments?.some(
        (assignment) =>
          activityIds.includes(assignment.activityId) &&
          assignment.assignmentCode === assignmentCode
      ),
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
        id: 'staff',
        name: 'Staff',
      },
    ],
    filter: (roles: string[]) => (person: Person) =>
      roles.some((role) => person.roles?.includes(role)),
  },
];

export const getBaseCluster = (
  wcif: Competition,
  base: Step['cluster']['base'],
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

export const getCluster = (wcif: Competition, cluster: Step['cluster'], roundId: string) => {
  return getBaseCluster(wcif, cluster.base, roundId);
};
