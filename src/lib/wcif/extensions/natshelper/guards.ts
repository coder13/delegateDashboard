import type { RoomExtensionData, GroupExtensionData } from './types';

/**
 * Type guard to verify if an object is valid RoomExtensionData
 */
export function isRoomExtensionData(data: unknown): data is RoomExtensionData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const config = data as Record<string, unknown>;

  // Check stages field if present
  if ('stages' in config) {
    if (!Array.isArray(config.stages)) {
      return false;
    }
    // Verify all elements are objects
    if (!config.stages.every((stage) => typeof stage === 'object' && stage !== null)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard to verify if an object is valid GroupExtensionData
 */
export function isGroupExtensionData(data: unknown): data is GroupExtensionData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const config = data as Record<string, unknown>;

  // Check stageId field if present
  if ('stageId' in config && typeof config.stageId !== 'number') {
    return false;
  }

  return true;
}
