import type { TogglePersonRolePayload, AddPersonPayload } from '../actions';
import type { AppState } from '../initialState';

export const togglePersonRole = (state: AppState, action: TogglePersonRolePayload): AppState => {
  if (!('registrantId' in action && 'roleId' in action) || !state.wcif) return state;
  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) => {
        if (person.registrantId === action.registrantId) {
          const currentRoles = person.roles || [];
          return {
            ...person,
            roles:
              currentRoles.indexOf(action.roleId) > -1
                ? currentRoles.filter((role) => role !== action.roleId)
                : [...currentRoles, action.roleId],
          };
        }
        return person;
      }),
    },
  };
};

export const addPerson = (state: AppState, action: AddPersonPayload): AppState => {
  if (!('person' in action) || !state.wcif) return state;
  const { person } = action;

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: [...state.wcif.persons.filter((i) => i.wcaUserId !== person.wcaUserId), person],
    },
  };
};
