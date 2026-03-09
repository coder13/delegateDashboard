import type { Extension } from '../types';
import {
  getGroupsExtensionData,
  setGroupsExtensionData,
  getActivityConfigExtensionData,
  setActivityConfigExtensionData,
  getRoundConfigExtensionData,
  setRoundConfigExtensionData,
  isGroupsExtensionData,
  isActivityConfigExtensionData,
  isRoundConfigExtensionData,
} from './delegateDashboard';
import { describe, it, expect } from 'vitest';

interface TestEntity {
  extensions: Extension[];
}

describe('delegateDashboard extensions', () => {
  describe('type guards', () => {
    describe('isGroupsExtensionData', () => {
      it('validates correct groups data with number', () => {
        expect(isGroupsExtensionData({ groups: 4, spreadGroupsAcrossAllStages: true })).toBe(true);
      });

      it('validates correct groups data with record', () => {
        expect(isGroupsExtensionData({ groups: { 1: 2, 2: 3 } })).toBe(true);
      });

      it('rejects invalid groups type', () => {
        expect(isGroupsExtensionData({ groups: 'invalid' })).toBe(false);
      });

      it('rejects invalid spreadGroupsAcrossAllStages type', () => {
        expect(isGroupsExtensionData({ spreadGroupsAcrossAllStages: 'yes' })).toBe(false);
      });

      it('accepts empty object', () => {
        expect(isGroupsExtensionData({})).toBe(true);
      });
    });

    describe('isActivityConfigExtensionData', () => {
      it('validates correct activity config data', () => {
        expect(isActivityConfigExtensionData({ groupCount: 5 })).toBe(true);
      });

      it('rejects invalid groupCount type', () => {
        expect(isActivityConfigExtensionData({ groupCount: '5' })).toBe(false);
      });

      it('accepts empty object', () => {
        expect(isActivityConfigExtensionData({})).toBe(true);
      });
    });

    describe('isRoundConfigExtensionData', () => {
      it('validates any object', () => {
        expect(isRoundConfigExtensionData({ foo: 'bar' })).toBe(true);
      });

      it('rejects non-objects', () => {
        expect(isRoundConfigExtensionData(null)).toBe(false);
        expect(isRoundConfigExtensionData('string')).toBe(false);
      });
    });
  });

  describe('groups extension', () => {
    it('gets groups extension data', () => {
      const entity: TestEntity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'url',
            data: { groups: 4, spreadGroupsAcrossAllStages: false },
          },
        ],
      };

      const data = getGroupsExtensionData(entity);
      expect(data).toEqual({ groups: 4, spreadGroupsAcrossAllStages: false });
    });

    it('returns default when extension not found', () => {
      const entity: TestEntity = { extensions: [] };

      const data = getGroupsExtensionData(entity);
      expect(data).toEqual({ spreadGroupsAcrossAllStages: true, groups: 1 });
    });

    it('merges with defaults', () => {
      const entity: TestEntity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'url',
            data: { groups: 5 },
          },
        ],
      };

      const data = getGroupsExtensionData(entity);
      expect(data).toEqual({ groups: 5, spreadGroupsAcrossAllStages: true });
    });

    it('sets groups extension data', () => {
      const entity: TestEntity = { extensions: [] };

      const updated = setGroupsExtensionData(entity, { groups: 6 });
      expect(updated.extensions).toHaveLength(1);
      expect(updated.extensions[0].id).toBe('delegateDashboard.groups');
      expect(updated.extensions[0].data).toEqual({ groups: 6 });
    });

    it('replaces existing extension', () => {
      const entity: TestEntity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'url',
            data: { groups: 4 },
          },
          {
            id: 'other.extension',
            specUrl: 'url',
            data: {},
          },
        ],
      };

      const updated = setGroupsExtensionData(entity, { groups: 8 });
      expect(updated.extensions).toHaveLength(2);
      expect(updated.extensions.find((e) => e.id === 'delegateDashboard.groups')?.data).toEqual({
        groups: 8,
      });
    });
  });

  describe('activityConfig extension', () => {
    it('gets activity config extension data', () => {
      const entity: TestEntity = {
        extensions: [
          {
            id: 'delegateDashboard.activityConfig',
            specUrl: 'url',
            data: { groupCount: 3 },
          },
        ],
      };

      const data = getActivityConfigExtensionData(entity);
      expect(data).toEqual({ groupCount: 3 });
    });

    it('returns undefined when extension not found', () => {
      const entity: TestEntity = { extensions: [] };

      const data = getActivityConfigExtensionData(entity);
      expect(data).toBeUndefined();
    });

    it('sets activity config extension data', () => {
      const entity: TestEntity = { extensions: [] };

      const updated = setActivityConfigExtensionData(entity, { groupCount: 5 });
      expect(updated.extensions).toHaveLength(1);
      expect(updated.extensions[0].id).toBe('delegateDashboard.activityConfig');
      expect(updated.extensions[0].data).toEqual({ groupCount: 5 });
    });
  });

  describe('roundConfig extension', () => {
    it('gets round config extension data', () => {
      const entity: TestEntity = {
        extensions: [
          {
            id: 'delegateDashboard.roundConfig',
            specUrl: 'url',
            data: { custom: 'value' },
          },
        ],
      };

      const data = getRoundConfigExtensionData(entity);
      expect(data).toEqual({ custom: 'value' });
    });

    it('returns undefined when extension not found', () => {
      const entity: TestEntity = { extensions: [] };

      const data = getRoundConfigExtensionData(entity);
      expect(data).toBeUndefined();
    });

    it('sets round config extension data', () => {
      const entity: TestEntity = { extensions: [] };

      const updated = setRoundConfigExtensionData(entity, { custom: 'data' });
      expect(updated.extensions).toHaveLength(1);
      expect(updated.extensions[0].id).toBe('delegateDashboard.roundConfig');
      expect(updated.extensions[0].data).toEqual({ custom: 'data' });
    });
  });
});
