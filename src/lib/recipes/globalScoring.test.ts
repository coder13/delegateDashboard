import { describe, expect, it } from 'vitest';
import type { Activity, AssignmentCode, Person } from '@wca/helpers';
import type { Constraint } from 'wca-group-generators';
import {
  buildActivity,
  buildPerson,
  buildWcif,
} from '../../store/reducers/_tests_/helpers';
import { optimizeAssignmentsGlobally } from './globalScoring';

const assignmentCode: AssignmentCode = 'competitor';

const assignment = (activityId: number) => ({
  activityId,
  assignmentCode,
  stationNumber: null,
});

const activity = (id: number, groupNumber: number): Activity =>
  buildActivity({
    id,
    name: `Group ${groupNumber}`,
    activityCode: `333-r1-g${groupNumber}`,
  });

const person = (registrantId: number, name: string, activityId?: number): Person =>
  buildPerson({
    registrantId,
    name,
    assignments: activityId ? [assignment(activityId)] : [],
  });

const preferredActivity: Constraint = {
  name: 'Preferred Activity',
  score: ({ person, activity }) => {
    if (person.name.includes('One')) {
      return activity.id === 101 ? 1 : 0;
    }

    if (person.name.includes('Two')) {
      return activity.id === 102 ? 1 : 0;
    }

    return 0;
  },
};

const onePersonPerActivity: Constraint = {
  name: 'One Person Per Activity',
  score: ({ wcif, activity, assignmentCode }) => {
    const peopleInActivity = wcif.persons.filter((candidate) =>
      candidate.assignments?.some(
        (assignment) =>
          assignment.assignmentCode === assignmentCode && assignment.activityId === activity.id
      )
    );

    return peopleInActivity.length > 0 ? null : 0;
  },
};

describe('global recipe scoring', () => {
  it('can repair an invalid full assignment score', () => {
    const activities = [activity(101, 1), activity(102, 2)];
    const beforePeople = [person(1, 'Person One'), person(2, 'Person Two')];
    const generatedPeople = [person(1, 'Person One', 101), person(2, 'Person Two', 101)];

    const optimizedWcif = optimizeAssignmentsGlobally({
      beforeWcif: buildWcif(activities, beforePeople),
      wcif: buildWcif(activities, generatedPeople),
      cluster: beforePeople,
      activities,
      assignmentCode,
      constraints: [{ constraint: onePersonPerActivity, weight: 1 }],
    });

    const assignedActivityIds = optimizedWcif.persons.flatMap(
      (candidate) => candidate.assignments?.map((personAssignment) => personAssignment.activityId) ?? []
    );

    expect(new Set(assignedActivityIds)).toEqual(new Set([101, 102]));
  });

  it('improves the full assignment score with swaps when single moves are illegal', () => {
    const activities = [activity(101, 1), activity(102, 2)];
    const beforePeople = [person(1, 'Person One'), person(2, 'Person Two')];
    const generatedPeople = [person(1, 'Person One', 102), person(2, 'Person Two', 101)];

    const optimizedWcif = optimizeAssignmentsGlobally({
      beforeWcif: buildWcif(activities, beforePeople),
      wcif: buildWcif(activities, generatedPeople),
      cluster: beforePeople,
      activities,
      assignmentCode,
      constraints: [
        { constraint: onePersonPerActivity, weight: 1 },
        { constraint: preferredActivity, weight: 1 },
      ],
    });

    expect(
      optimizedWcif.persons.find((candidate) => candidate.registrantId === 1)?.assignments
    ).toContainEqual(assignment(101));
    expect(
      optimizedWcif.persons.find((candidate) => candidate.registrantId === 2)?.assignments
    ).toContainEqual(assignment(102));
  });

  it('does not move assignments that existed before the current step', () => {
    const activities = [activity(101, 1), activity(102, 2)];
    const fixedPerson = person(1, 'Person One', 102);
    const movablePerson = person(2, 'Person Two');

    const optimizedWcif = optimizeAssignmentsGlobally({
      beforeWcif: buildWcif(activities, [fixedPerson, movablePerson]),
      wcif: buildWcif(activities, [fixedPerson, person(2, 'Person Two', 101)]),
      cluster: [fixedPerson, movablePerson],
      activities,
      assignmentCode,
      constraints: [{ constraint: preferredActivity, weight: 1 }],
    });

    expect(
      optimizedWcif.persons.find((candidate) => candidate.registrantId === 1)?.assignments
    ).toContainEqual(assignment(102));
  });
});
