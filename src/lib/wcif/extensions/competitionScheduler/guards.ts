import type { RoundConfigExtensionData } from './types';

/**
 * Type guard to verify if an object is valid RoundConfigExtensionData
 */
export function isRoundConfigExtensionData(data: unknown): data is RoundConfigExtensionData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const config = data as Record<string, unknown>;

  // Check groupCount field if present
  if ('groupCount' in config && typeof config.groupCount !== 'number') {
    return false;
  }

  // Check expectedRegistrations field if present
  if ('expectedRegistrations' in config && typeof config.expectedRegistrations !== 'number') {
    return false;
  }

  return true;
}
