import type {
  ActivityConfigExtensionData,
  GroupsExtensionData,
  RoundConfigExtensionData,
} from './types';

/**
 * Type guard to verify if an object is valid GroupsExtensionData
 */
export function isGroupsExtensionData(data: unknown): data is GroupsExtensionData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const config = data as Record<string, unknown>;

  // Check groups field if present
  if ('groups' in config) {
    const groups = config.groups;
    const isNumber = typeof groups === 'number';
    const isRecord =
      typeof groups === 'object' &&
      groups !== null &&
      Object.values(groups).every((v) => typeof v === 'number');
    if (!isNumber && !isRecord) {
      return false;
    }
  }

  // Check spreadGroupsAcrossAllStages field if present
  if (
    'spreadGroupsAcrossAllStages' in config &&
    typeof config.spreadGroupsAcrossAllStages !== 'boolean'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to verify if an object is valid ActivityConfigExtensionData
 */
export function isActivityConfigExtensionData(data: unknown): data is ActivityConfigExtensionData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const config = data as Record<string, unknown>;

  // Check groupCount field if present
  if ('groupCount' in config && typeof config.groupCount !== 'number') {
    return false;
  }

  return true;
}

/**
 * Type guard to verify if an object is valid RoundConfigExtensionData
 */
export function isRoundConfigExtensionData(data: unknown): data is RoundConfigExtensionData {
  return data !== null && typeof data === 'object';
}
