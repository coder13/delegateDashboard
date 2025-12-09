import type { WcifEntity, Extension } from '../types';
import { isRoundConfigExtensionData } from './guards';
import type { RoundConfigExtensionData } from './types';

export const COMPETITION_SCHEDULER_NAMESPACE = 'competitionScheduler';

/**
 * Get the full extension ID for a Competition Scheduler extension
 */
function getExtensionId(extensionName: string): string {
  return `${COMPETITION_SCHEDULER_NAMESPACE}.${extensionName}`;
}

/**
 * Get round config extension data from a WCIF entity
 */
export function getRoundConfig(wcifEntity: WcifEntity): RoundConfigExtensionData | undefined {
  const extension = wcifEntity.extensions.find((ext) => ext.id === getExtensionId('RoundConfig'));

  if (!extension) {
    return undefined;
  }

  if (!isRoundConfigExtensionData(extension.data)) {
    console.warn('Invalid Competition Scheduler RoundConfig extension data:', extension.data);
    return undefined;
  }

  return extension.data;
}

/**
 * Set round config extension data on a WCIF entity
 */
export function setRoundConfig<T extends WcifEntity>(
  wcifEntity: T,
  data: RoundConfigExtensionData
): T {
  const extensionId = getExtensionId('RoundConfig');
  const otherExtensions = wcifEntity.extensions.filter((ext) => ext.id !== extensionId);

  const newExtension: Extension = {
    id: extensionId,
    specUrl: '', // Competition Scheduler doesn't provide a spec URL
    data,
  };

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, newExtension],
  };
}
