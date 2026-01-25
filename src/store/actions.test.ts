import {
  ActionType,
  addPerson,
  addPersonAssignments,
  bulkAddPersonAssignments,
  bulkRemovePersonAssignments,
  bulkUpsertPersonAssignments,
  editActivity,
  fetchCompetitions,
  fetchWCIF,
  generateAssignments,
  partialUpdateWCIF,
  removePersonAssignments,
  resetAllGroupAssignments,
  togglePersonRole,
  updateGlobalExtension,
  updateGroupCount,
  updateRawObj,
  updateRound,
  updateRoundActivities,
  updateRoundChildActivities,
  updateRoundExtensionData,
  uploadCurrentWCIFChanges,
  upsertPersonAssignments,
} from './actions';
import type { Assignment, Competition } from '@wca/helpers';
import type { Extension } from '@wca/helpers/lib/models/extension';
import { describe, expect, it, vi } from 'vitest';
import { getUpcomingManageableCompetitions, getWcif, patchWcif } from '../lib/api';
import { sortWcifEvents } from '../lib/domain/events';
import { validateWcif } from '../lib/wcif/validation';
import type { AppState } from './initialState';
import {
  buildActivity,
  buildEvent,
  buildPerson,
  buildRound,
  buildWcif,
} from './reducers/_tests_/helpers';

vi.mock('../lib/api', () => ({
  getUpcomingManageableCompetitions: vi.fn(),
  getWcif: vi.fn(),
  patchWcif: vi.fn(),
}));

vi.mock('../lib/domain/events', () => ({
  sortWcifEvents: vi.fn((events: Competition['events']) => [...(events || [])].reverse()),
}));

vi.mock('../lib/wcif/validation', () => ({
  validateWcif: vi.fn(() => []),
}));

const getUpcomingManageableCompetitionsMock = vi.mocked(getUpcomingManageableCompetitions);
const getWcifMock = vi.mocked(getWcif);
const patchWcifMock = vi.mocked(patchWcif);
const sortWcifEventsMock = vi.mocked(sortWcifEvents);
const validateWcifMock = vi.mocked(validateWcif);

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('store actions', () => {
  it('creates action payloads for simple action creators', () => {
    const assignment = { activityId: 1, assignmentCode: 'competitor', stationNumber: null };
    const activity = buildActivity({ id: 10, activityCode: '333-r1' });
    const person = buildPerson({ registrantId: 1 });
    const round = buildRound({ id: '333-r1' });
    const extension = {
      id: 'test-extension',
      specUrl: 'https://example.com/spec',
      data: { enabled: true },
    } as Extension;

    expect(togglePersonRole(1, 'delegate')).toEqual({
      type: ActionType.TOGGLE_PERSON_ROLE,
      registrantId: 1,
      roleId: 'delegate',
    });
    expect(addPersonAssignments(2, [assignment as Assignment])).toEqual({
      type: ActionType.ADD_PERSON_ASSIGNMENTS,
      registrantId: 2,
      assignments: [assignment],
    });
    expect(removePersonAssignments(3, 99)).toEqual({
      type: ActionType.REMOVE_PERSON_ASSIGNMENTS,
      registrantId: 3,
      activityId: 99,
    });
    expect(upsertPersonAssignments(4, [assignment as Assignment])).toEqual({
      type: ActionType.UPSERT_PERSON_ASSIGNMENTS,
      registrantId: 4,
      assignments: [assignment],
    });
    expect(
      bulkAddPersonAssignments([{ registrantId: 6, assignment: assignment as Assignment }])
    ).toEqual({
      type: ActionType.BULK_ADD_PERSON_ASSIGNMENTS,
      assignments: [{ registrantId: 6, assignment }],
    });
    expect(bulkRemovePersonAssignments([{ activityId: 1 }])).toEqual({
      type: ActionType.BULK_REMOVE_PERSON_ASSIGNMENTS,
      assignments: [{ activityId: 1 }],
    });
    expect(
      bulkUpsertPersonAssignments([{ registrantId: 3, assignment: assignment as Assignment }])
    ).toEqual({
      type: ActionType.BULK_UPSERT_PERSON_ASSIGNMENTS,
      assignments: [{ registrantId: 3, assignment }],
    });
    expect(updateGroupCount(7, 4)).toEqual({
      type: ActionType.UPDATE_GROUP_COUNT,
      activityId: 7,
      groupCount: 4,
    });
    expect(updateRoundActivities([activity])).toEqual({
      type: ActionType.UPDATE_ROUND_ACTIVITIES,
      activities: [activity],
    });
    expect(updateRoundChildActivities(10, [activity])).toEqual({
      type: ActionType.UPDATE_ROUND_CHILD_ACTIVITIES,
      activityId: 10,
      childActivities: [activity],
    });
    expect(updateRoundExtensionData('333-r1', { key: 'value' })).toEqual({
      type: ActionType.UPDATE_ROUND_EXTENSION_DATA,
      activityCode: '333-r1',
      extensionData: { key: 'value' },
    });
    expect(partialUpdateWCIF({ name: 'My Comp' })).toEqual({
      type: ActionType.PARTIAL_UPDATE_WCIF,
      wcif: { name: 'My Comp' },
    });
    expect(resetAllGroupAssignments()).toEqual({
      type: ActionType.RESET_ALL_GROUP_ASSIGNMENTS,
    });
    expect(generateAssignments('333-r1', { sortOrganizationStaffInLastGroups: false })).toEqual({
      type: ActionType.GENERATE_ASSIGNMENTS,
      roundId: '333-r1',
      options: { sortOrganizationStaffInLastGroups: false },
    });
    expect(generateAssignments('333-r1')).toEqual({
      type: ActionType.GENERATE_ASSIGNMENTS,
      roundId: '333-r1',
      options: { sortOrganizationStaffInLastGroups: true },
    });
    expect(editActivity({ id: 10 }, { name: 'Updated' })).toEqual({
      type: ActionType.EDIT_ACTIVITY,
      where: { id: 10 },
      what: { name: 'Updated' },
    });
    expect(updateGlobalExtension(extension)).toEqual({
      type: ActionType.UPDATE_GLOBAL_EXTENSION,
      extensionData: extension,
    });
    expect(addPerson(person)).toEqual({
      type: ActionType.ADD_PERSON,
      person,
    });
    expect(updateRound('333-r1', round)).toEqual({
      type: ActionType.UPDATE_ROUND,
      roundId: '333-r1',
      roundData: round,
    });
    expect(updateRawObj('name', 'New Name')).toEqual({
      type: ActionType.UPDATE_RAW_OBJ,
      key: 'name',
      value: 'New Name',
    });
  });

  it('dispatches fetchCompetitions success flow', async () => {
    const dispatch = vi.fn();
    const competitions = [
      {
        id: 'Comp1',
        name: 'Competition 1',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        city: 'City',
        country_iso2: 'US',
      },
    ];
    getUpcomingManageableCompetitionsMock.mockResolvedValueOnce(competitions);

    fetchCompetitions()(dispatch);
    await flushPromises();

    expect(dispatch.mock.calls[0][0].type).toBe(ActionType.FETCHING_COMPETITIONS);
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: ActionType.SET_COMPETITIONS,
      competitions,
    });
  });

  it('dispatches fetchCompetitions error flow', async () => {
    const dispatch = vi.fn();
    const error = new Error('boom');
    getUpcomingManageableCompetitionsMock.mockRejectedValueOnce(error);

    fetchCompetitions()(dispatch);
    await flushPromises();

    expect(dispatch.mock.calls[0][0].type).toBe(ActionType.FETCHING_COMPETITIONS);
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: ActionType.SET_ERROR_FETCHING_COMPS,
      error,
    });
  });

  it('dispatches fetchWCIF success flow', async () => {
    const dispatch = vi.fn();
    const wcif = buildWcif([], []);
    wcif.id = 'Comp1';
    wcif.name = 'Comp One';
    wcif.events = [buildEvent({ id: '333', rounds: [] }), buildEvent({ id: '222', rounds: [] })];
    getWcifMock.mockResolvedValueOnce(wcif);

    await fetchWCIF('Comp1')(dispatch);

    expect(dispatch.mock.calls[0][0]).toEqual({
      type: ActionType.FETCHING_WCIF,
      fetching: true,
    });
    expect(sortWcifEventsMock).toHaveBeenCalledWith(wcif.events);
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: ActionType.FETCHED_WCIF,
      fetched: false,
      wcif: {
        ...wcif,
        events: [...wcif.events].reverse(),
      },
    });
    expect(validateWcifMock).toHaveBeenCalledWith({
      ...wcif,
      events: [...wcif.events].reverse(),
    });
    expect(dispatch.mock.calls[2][0]).toEqual({
      type: ActionType.UPDATE_WCIF_ERRORS,
      errors: [],
      replace: false,
    });
    expect(dispatch.mock.calls[3][0]).toEqual({
      type: ActionType.FETCHING_WCIF,
      fetching: false,
    });
  });

  it('dispatches fetchWCIF error flow', async () => {
    const dispatch = vi.fn();
    const error = new Error('Bad WCIF');
    getWcifMock.mockRejectedValueOnce(error);

    await fetchWCIF('Comp1')(dispatch);

    expect(dispatch.mock.calls[0][0]).toEqual({
      type: ActionType.FETCHING_WCIF,
      fetching: true,
    });
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: ActionType.UPDATE_WCIF_ERRORS,
      errors: [error],
      replace: true,
    });
    expect(dispatch.mock.calls[2][0]).toEqual({
      type: ActionType.FETCHING_WCIF,
      fetching: false,
    });
  });

  it('uploadCurrentWCIFChanges returns early without wcif', () => {
    const dispatch = vi.fn();
    const cb = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const getState = () => ({ wcif: null, changedKeys: new Set() }) as unknown as AppState;

    uploadCurrentWCIFChanges(cb)(dispatch, getState);

    expect(consoleError).toHaveBeenCalledWith('No WCIF to upload');
    expect(dispatch).not.toHaveBeenCalled();
    expect(patchWcifMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('uploadCurrentWCIFChanges returns early when no changes', () => {
    const dispatch = vi.fn();
    const cb = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const getState = () =>
      ({
        wcif: { ...buildWcif([], []), id: 'Comp1' },
        changedKeys: new Set(),
      }) as unknown as AppState;

    uploadCurrentWCIFChanges(cb)(dispatch, getState);

    expect(consoleError).toHaveBeenCalledWith('Not pushing changes because changedKeys is empty');
    expect(dispatch).not.toHaveBeenCalled();
    expect(patchWcifMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('uploadCurrentWCIFChanges dispatches updateUploading and calls callback on success', async () => {
    const dispatch = vi.fn();
    const cb = vi.fn();
    const wcif = buildWcif([], []);
    wcif.id = 'Comp1';
    wcif.events = [buildEvent({ id: '333', rounds: [] })];
    const getState = () =>
      ({
        wcif,
        changedKeys: new Set(['events']),
      }) as unknown as AppState;
    patchWcifMock.mockResolvedValueOnce(wcif);

    uploadCurrentWCIFChanges(cb)(dispatch, getState);
    await flushPromises();

    expect(dispatch.mock.calls[0][0]).toEqual({
      type: ActionType.UPLOADING_WCIF,
      uploading: true,
    });
    expect(patchWcifMock).toHaveBeenCalledWith('Comp1', { events: wcif.events });
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: ActionType.UPLOADING_WCIF,
      uploading: false,
    });
    expect(cb).toHaveBeenCalledWith();
  });

  it('uploadCurrentWCIFChanges dispatches updateUploading and calls callback on error', async () => {
    const dispatch = vi.fn();
    const cb = vi.fn();
    const wcif = buildWcif([], []);
    wcif.id = 'Comp1';
    wcif.events = [buildEvent({ id: '333', rounds: [] })];
    const getState = () =>
      ({
        wcif,
        changedKeys: new Set(['events']),
      }) as unknown as AppState;
    const error = new Error('Upload failed');
    patchWcifMock.mockRejectedValueOnce(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    uploadCurrentWCIFChanges(cb)(dispatch, getState);
    await flushPromises();

    expect(dispatch.mock.calls[0][0]).toEqual({
      type: ActionType.UPLOADING_WCIF,
      uploading: true,
    });
    expect(dispatch.mock.calls[1][0]).toEqual({
      type: ActionType.UPLOADING_WCIF,
      uploading: false,
    });
    expect(cb).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });
});
