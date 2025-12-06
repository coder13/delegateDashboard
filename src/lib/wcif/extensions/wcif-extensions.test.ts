import {
  buildExtension,
  setExtensionData,
  getExtensionData,
  removeExtensionData,
  getGroupData,
} from './wcif-extensions';
import { Activity } from '@wca/helpers';
import { Extension } from '@wca/helpers/lib/models/extension';
import { describe, it, expect } from 'vitest';

describe('wcif-extensions', () => {
  describe('buildExtension', () => {
    it('builds an extension with default namespace', () => {
      const extension = buildExtension('testExtension', { foo: 'bar' });

      expect(extension).toEqual({
        id: 'delegateDashboard.testExtension',
        specUrl:
          'https://github.com/coder13/delegateDashboard/blob/main/public/wcif-extensions/testExtension.json',
        data: { foo: 'bar' },
      });
    });

    it('builds an extension with custom namespace', () => {
      const extension = buildExtension('testExtension', { foo: 'bar' }, 'customNamespace');

      expect(extension).toEqual({
        id: 'customNamespace.testExtension',
        specUrl:
          'https://github.com/coder13/delegateDashboard/blob/main/public/wcif-extensions/testExtension.json',
        data: { foo: 'bar' },
      });
    });

    it('builds an extension with custom specUrl', () => {
      const extension = buildExtension(
        'testExtension',
        { foo: 'bar' },
        'delegateDashboard',
        'https://example.com/spec.json'
      );

      expect(extension).toEqual({
        id: 'delegateDashboard.testExtension',
        specUrl: 'https://example.com/spec.json',
        data: { foo: 'bar' },
      });
    });
  });

  describe('setExtensionData', () => {
    it('adds extension to entity with no existing extensions', () => {
      const entity = { extensions: [], name: 'Test' };
      const result = setExtensionData('groups', entity, { groups: 4 });

      expect(result.extensions).toHaveLength(1);
      expect((result.extensions[0] as Extension).id).toBe('delegateDashboard.groups');
      expect((result.extensions[0] as Extension).data).toEqual({ groups: 4 });
    });

    it('replaces existing extension with same id', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'https://example.com',
            data: { groups: 2 },
          },
        ],
        name: 'Test',
      };

      const result = setExtensionData('groups', entity, {
        groups: 4,
        spreadGroupsAcrossAllStages: false,
      });

      expect(result.extensions).toHaveLength(1);
      expect((result.extensions[0] as Extension).id).toBe('delegateDashboard.groups');
      expect((result.extensions[0] as Extension).data).toEqual({
        groups: 4,
        spreadGroupsAcrossAllStages: false,
      });
    });

    it('preserves other extensions', () => {
      const entity = {
        extensions: [
          {
            id: 'other.extension',
            specUrl: 'https://example.com',
            data: { foo: 'bar' },
          },
        ],
        name: 'Test',
      };

      const result = setExtensionData('groups', entity, { groups: 3 });

      expect(result.extensions).toHaveLength(2);
      expect(result.extensions.find((e) => e.id === 'other.extension')).toBeDefined();
      expect(result.extensions.find((e) => e.id === 'delegateDashboard.groups')).toBeDefined();
    });

    it('works with custom namespace', () => {
      const entity = { extensions: [], name: 'Test' };
      const result = setExtensionData('test', entity, { value: 123 }, 'customNamespace');

      expect((result.extensions[0] as Extension).id).toBe('customNamespace.test');
      expect((result.extensions[0] as Extension).data).toEqual({ value: 123 });
    });

    it('preserves other properties of entity', () => {
      const entity = { extensions: [], name: 'Test', id: 42, other: 'property' };
      const result = setExtensionData('groups', entity, { groups: 1 });

      expect(result.name).toBe('Test');
      expect(result.id).toBe(42);
      expect(result.other).toBe('property');
    });
  });

  describe('getExtensionData', () => {
    it('returns extension data if exists', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'https://example.com',
            data: { groups: 5, spreadGroupsAcrossAllStages: false },
          },
        ],
      };

      const data = getExtensionData('groups', entity);

      expect(data).toEqual({ groups: 5, spreadGroupsAcrossAllStages: false });
    });

    it('returns default data if extension does not exist and defaults are defined', () => {
      const entity = { extensions: [] };

      const data = getExtensionData('groups', entity);

      expect(data).toEqual({
        spreadGroupsAcrossAllStages: true,
        groups: 1,
      });
    });

    it('merges extension data with defaults', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'https://example.com',
            data: { groups: 7 },
          },
        ],
      };

      const data = getExtensionData('groups', entity);

      expect(data).toEqual({
        spreadGroupsAcrossAllStages: true,
        groups: 7,
      });
    });

    it('returns undefined if extension does not exist and no defaults', () => {
      const entity = { extensions: [] };

      const data = getExtensionData('unknownExtension', entity);

      expect(data).toBeUndefined();
    });

    it('returns extension data for non-default extension', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.custom',
            specUrl: 'https://example.com',
            data: { customField: 'value' },
          },
        ],
      };

      const data = getExtensionData('custom', entity);

      expect(data).toEqual({ customField: 'value' });
    });

    it('works with custom namespace', () => {
      const entity = {
        extensions: [
          {
            id: 'customNamespace.test',
            specUrl: 'https://example.com',
            data: { value: 'test' },
          },
        ],
      };

      const data = getExtensionData('test', entity, 'customNamespace');

      expect(data).toEqual({ value: 'test' });
    });
  });

  describe('removeExtensionData', () => {
    it('removes extension from entity', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'https://example.com',
            data: { groups: 3 },
          },
        ],
        name: 'Test',
      };

      const result = removeExtensionData('groups', entity, 'delegateDashboard');

      expect(result.extensions).toHaveLength(0);
    });

    it('preserves other extensions', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'https://example.com',
            data: { groups: 3 },
          },
          {
            id: 'other.extension',
            specUrl: 'https://example.com',
            data: { foo: 'bar' },
          },
        ],
        name: 'Test',
      };

      const result = removeExtensionData('groups', entity, 'delegateDashboard');

      expect(result.extensions).toHaveLength(1);
      expect((result.extensions[0] as Extension).id).toBe('other.extension');
    });

    it('does nothing if extension does not exist', () => {
      const entity = {
        extensions: [
          {
            id: 'other.extension',
            specUrl: 'https://example.com',
            data: { foo: 'bar' },
          },
        ],
        name: 'Test',
      };

      const result = removeExtensionData('nonexistent', entity, 'delegateDashboard');

      expect(result.extensions).toHaveLength(1);
      expect((result.extensions[0] as Extension).id).toBe('other.extension');
    });

    it('preserves other properties of entity', () => {
      const entity = {
        extensions: [
          {
            id: 'delegateDashboard.groups',
            specUrl: 'https://example.com',
            data: { groups: 3 },
          },
        ],
        name: 'Test',
        id: 42,
      };

      const result = removeExtensionData('groups', entity, 'delegateDashboard');

      expect(result.name).toBe('Test');
      expect(result.id).toBe(42);
    });
  });

  describe('getGroupData', () => {
    const createActivity = (extensions: Extension[]): Activity => ({
      id: 1,
      name: 'Test Activity',
      activityCode: '333-r1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      childActivities: [],
      extensions,
    });

    it('returns null if no group configuration exists', () => {
      const activity = createActivity([]);

      const result = getGroupData(activity);

      expect(result).toBeNull();
    });

    it('returns Delegate Dashboard group data if extension exists', () => {
      const activity = createActivity([
        {
          id: 'delegateDashboard.groups',
          specUrl: 'https://example.com',
          data: { groupCount: 4 },
        },
      ]);

      const result = getGroupData(activity);

      expect(result).toEqual({
        groups: 4,
        source: 'Delegate Dashboard',
      });
    });

    it('returns default of 1 group if groupCount is missing in DD extension', () => {
      const activity = createActivity([
        {
          id: 'delegateDashboard.groups',
          specUrl: 'https://example.com',
          data: {},
        },
      ]);

      const result = getGroupData(activity);

      expect(result).toEqual({
        groups: 1,
        source: 'Delegate Dashboard',
      });
    });

    it('returns Groupifier group data if extension exists', () => {
      const activity = createActivity([
        {
          id: 'groupifier.ActivityConfig',
          specUrl: 'https://example.com',
          data: { groups: 6 },
        },
      ]);

      const result = getGroupData(activity);

      expect(result).toEqual({
        groups: 6,
        source: 'Groupifier',
      });
    });

    it('returns default of 1 group if groups is missing in Groupifier extension', () => {
      const activity = createActivity([
        {
          id: 'groupifier.ActivityConfig',
          specUrl: 'https://example.com',
          data: {},
        },
      ]);

      const result = getGroupData(activity);

      expect(result).toEqual({
        groups: 1,
        source: 'Groupifier',
      });
    });

    it('prioritizes Delegate Dashboard extension over Groupifier', () => {
      const activity = createActivity([
        {
          id: 'delegateDashboard.groups',
          specUrl: 'https://example.com',
          data: { groupCount: 4 },
        },
        {
          id: 'groupifier.ActivityConfig',
          specUrl: 'https://example.com',
          data: { groups: 6 },
        },
      ]);

      const result = getGroupData(activity);

      expect(result).toEqual({
        groups: 4,
        source: 'Delegate Dashboard',
      });
    });

    it('ignores other extensions', () => {
      const activity = createActivity([
        {
          id: 'other.extension',
          specUrl: 'https://example.com',
          data: { groups: 99 },
        },
      ]);

      const result = getGroupData(activity);

      expect(result).toBeNull();
    });
  });
});
