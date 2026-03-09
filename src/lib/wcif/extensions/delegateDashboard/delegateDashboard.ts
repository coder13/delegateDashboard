import type { WcifEntity } from '../types';
import type { Extension } from '../types';
import {
  isActivityConfigExtensionData,
  isGroupsExtensionData,
  isRoundConfigExtensionData,
} from './guards';
import type {
  ActivityConfigExtensionData,
  GroupsExtensionData,
  RoundConfigExtensionData,
} from './types';

// Re-export type guards for convenience
export { isActivityConfigExtensionData, isGroupsExtensionData, isRoundConfigExtensionData };

export const DD_NAMESPACE = 'delegateDashboard';
const DD_SPEC_URL_BASE =
  'https://github.com/coder13/delegateDashboard/blob/main/public/wcif-extensions';

/**
 * Default values for groups extension
 */
const DEFAULT_GROUPS_DATA: GroupsExtensionData = {
  spreadGroupsAcrossAllStages: true,
  groups: 1,
};

/**
 * Get the full extension ID for a Delegate Dashboard extension
 */
function getExtensionId(extensionName: string): string {
  return `${DD_NAMESPACE}.${extensionName}`;
}

/**
 * Build a Delegate Dashboard extension object
 */
function buildExtension(extensionName: string, data: object, specUrl?: string): Extension {
  return {
    id: getExtensionId(extensionName),
    specUrl: specUrl ?? `${DD_SPEC_URL_BASE}/${extensionName}.json`,
    data,
  };
}

/**
 * Get groups extension data from a WCIF entity
 */
export function getGroupsExtensionData(wcifEntity: WcifEntity): GroupsExtensionData | undefined {
  const extension = wcifEntity.extensions.find((ext) => ext.id === getExtensionId('groups'));

  if (!extension) {
    return DEFAULT_GROUPS_DATA;
  }

  if (!isGroupsExtensionData(extension.data)) {
    console.warn('Invalid Delegate Dashboard groups extension data:', extension.data);
    return DEFAULT_GROUPS_DATA;
  }

  return { ...DEFAULT_GROUPS_DATA, ...extension.data };
}

/**
 * Set groups extension data on a WCIF entity
 */
export function setGroupsExtensionData<T extends WcifEntity>(
  wcifEntity: T,
  data: GroupsExtensionData
): T {
  const extensionId = getExtensionId('groups');
  const otherExtensions = wcifEntity.extensions.filter((ext) => ext.id !== extensionId);

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, buildExtension('groups', data)],
  };
}

/**
 * Get activity config extension data from a WCIF entity
 */
export function getActivityConfigExtensionData(
  wcifEntity: WcifEntity
): ActivityConfigExtensionData | undefined {
  const extension = wcifEntity.extensions.find(
    (ext) => ext.id === getExtensionId('activityConfig')
  );

  if (!extension) {
    return undefined;
  }

  if (!isActivityConfigExtensionData(extension.data)) {
    console.warn('Invalid Delegate Dashboard activityConfig extension data:', extension.data);
    return undefined;
  }

  return extension.data;
}

/**
 * Set activity config extension data on a WCIF entity
 */
export function setActivityConfigExtensionData<T extends WcifEntity>(
  wcifEntity: T,
  data: ActivityConfigExtensionData
): T {
  const extensionId = getExtensionId('activityConfig');
  const otherExtensions = wcifEntity.extensions.filter((ext) => ext.id !== extensionId);

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, buildExtension('activityConfig', data)],
  };
}

/**
 * Get round config extension data from a WCIF entity
 */
export function getRoundConfigExtensionData(
  wcifEntity: WcifEntity
): RoundConfigExtensionData | undefined {
  const extension = wcifEntity.extensions.find((ext) => ext.id === getExtensionId('roundConfig'));

  if (!extension) {
    return undefined;
  }

  if (!isRoundConfigExtensionData(extension.data)) {
    console.warn('Invalid Delegate Dashboard roundConfig extension data:', extension.data);
    return undefined;
  }

  return extension.data;
}

/**
 * Set round config extension data on a WCIF entity
 */
export function setRoundConfigExtensionData<T extends WcifEntity>(
  wcifEntity: T,
  data: RoundConfigExtensionData
): T {
  const extensionId = getExtensionId('roundConfig');
  const otherExtensions = wcifEntity.extensions.filter((ext) => ext.id !== extensionId);

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, buildExtension('roundConfig', data)],
  };
}

/**
 * Remove a Delegate Dashboard extension from a WCIF entity
 */
export function removeDelegateDashboardExtension<T extends WcifEntity>(
  wcifEntity: T,
  extensionName: string
): T {
  const extensionId = getExtensionId(extensionName);
  return {
    ...wcifEntity,
    extensions: wcifEntity.extensions.filter((ext) => ext.id !== extensionId),
  };
}
