import { sortCluster } from './clusters';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildWcifWithEvents,
} from '../../store/reducers/_tests_/helpers';
import { describe, expect, it } from 'vitest';

const group = (id: number, groupNumber: number) =>
  buildActivity({
    id,
    name: `Group ${groupNumber}`,
    activityCode: `333-r1-g${groupNumber}`,
  });

describe('recipe clusters', () => {
  it('sorts most constrained people before less constrained people', () => {
    const activities = [group(11, 1), group(12, 2)];
    const persons = [
      buildPerson({ registrantId: 1, name: 'Regular Person' }),
      buildPerson({ registrantId: 2, name: 'First Timer', wcaId: null }),
      buildPerson({ registrantId: 3, name: 'Delegate Person', roles: ['delegate'] }),
      buildPerson({
        registrantId: 4,
        name: 'Staff Person',
        assignments: [{ activityId: 11, assignmentCode: 'staff-judge', stationNumber: null }],
      }),
      buildPerson({ registrantId: 5, name: 'Luke Alpha' }),
      buildPerson({ registrantId: 6, name: 'Luke Beta' }),
    ];
    const wcif = buildWcifWithEvents([], [buildEvent()], persons);

    const sorted = sortCluster(
      wcif,
      {
        base: 'personsInRound',
        filters: [],
        sort: { by: 'mostConstrained', direction: 'desc' },
      },
      persons,
      '333-r1',
      activities
    );

    expect(sorted.map((person) => person.registrantId)).toEqual([4, 3, 2, 5, 6, 1]);
  });
});
