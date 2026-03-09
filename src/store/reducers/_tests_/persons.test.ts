import { describe, expect, it } from 'vitest';
import { addPerson, togglePersonRole } from '../persons';
import { buildPerson, buildState, buildWcif } from './helpers';

describe('person reducers', () => {
  it('togglePersonRole returns original state when wcif is missing', () => {
    const state = buildState(null);
    const nextState = togglePersonRole(state, { registrantId: 1, roleId: 'organizer' });

    expect(nextState).toBe(state);
  });

  it('togglePersonRole adds role when not present', () => {
    const person = buildPerson({ roles: [] });
    const state = buildState(buildWcif([], [person]));

    const nextState = togglePersonRole(state, {
      registrantId: person.registrantId,
      roleId: 'organizer',
    });

    const nextRoles = nextState.wcif?.persons[0].roles ?? [];
    expect(nextState.needToSave).toBe(true);
    expect(nextState.changedKeys.has('persons')).toBe(true);
    expect(nextRoles).toEqual(['organizer']);
  });

  it('togglePersonRole removes role when present', () => {
    const person = buildPerson({ roles: ['organizer', 'delegate'] });
    const state = buildState(buildWcif([], [person]));

    const nextState = togglePersonRole(state, {
      registrantId: person.registrantId,
      roleId: 'organizer',
    });

    const nextRoles = nextState.wcif?.persons[0].roles ?? [];
    expect(nextRoles).toEqual(['delegate']);
  });

  it('addPerson returns original state when wcif is missing', () => {
    const state = buildState(null);
    const nextState = addPerson(state, { person: buildPerson() });

    expect(nextState).toBe(state);
  });

  it('addPerson replaces any existing person with matching wcaUserId', () => {
    const originalPerson = buildPerson({
      name: 'Original',
      wcaUserId: 10,
      registrantId: 1,
    });
    const replacementPerson = buildPerson({
      name: 'Replacement',
      wcaUserId: 10,
      registrantId: 2,
    });
    const state = buildState(buildWcif([], [originalPerson]));

    const nextState = addPerson(state, { person: replacementPerson });

    const persons = nextState.wcif?.persons ?? [];
    expect(persons).toHaveLength(1);
    expect(persons[0]).toEqual(replacementPerson);
    expect(nextState.needToSave).toBe(true);
    expect(nextState.changedKeys.has('persons')).toBe(true);
  });
});
