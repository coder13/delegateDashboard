import { Extension } from '@wca/helpers/lib/models/extension';

const GROUPIFIER_NAMESPACE = 'groupifier';
const GROUPIFIER_SPEC_URL = 'https://github.com/cubingusa/natshelper/blob/main/specification.md';

interface WcifEntity {
  extensions: Extension[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Type definition for Groupifier's ActivityConfig extension data
 * @see https://github.com/cubingusa/natshelper/blob/main/specification.md
 */
export interface GroupifierActivityConfig {
  /**
   * Number of groups for this activity
   */
  groups?: number;
  /**
   * Array of WCA user IDs for competitors who should be featured/highlighted
   * (e.g., for streaming purposes)
   */
  featuredCompetitorWcaUserIds?: number[];
}

/**
 * Type guard to verify if an object is a valid GroupifierActivityConfig
 */
export function isGroupifierActivityConfig(data: unknown): data is GroupifierActivityConfig {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const config = data as Record<string, unknown>;

  // Check groups field if present
  if ('groups' in config && typeof config.groups !== 'number') {
    return false;
  }

  // Check featuredCompetitorWcaUserIds field if present
  if ('featuredCompetitorWcaUserIds' in config) {
    if (!Array.isArray(config.featuredCompetitorWcaUserIds)) {
      return false;
    }
    // Verify all elements are numbers
    if (!config.featuredCompetitorWcaUserIds.every((id) => typeof id === 'number')) {
      return false;
    }
  }

  return true;
}

/**
 * Get Groupifier's ActivityConfig extension data from a WCIF entity (typically an Activity)
 * @param wcifEntity - The WCIF entity containing extensions
 * @returns The ActivityConfig data if found and valid, undefined otherwise
 */
export function getGroupifierActivityConfig(
  wcifEntity: WcifEntity
): GroupifierActivityConfig | undefined {
  const extension = wcifEntity.extensions.find(
    (ext) => ext.id === `${GROUPIFIER_NAMESPACE}.ActivityConfig`
  );

  if (!extension) {
    return undefined;
  }

  // Validate the extension data
  if (!isGroupifierActivityConfig(extension.data)) {
    console.warn('Invalid Groupifier ActivityConfig extension data:', extension.data);
    return undefined;
  }

  return extension.data;
}

/**
 * Set Groupifier's ActivityConfig extension data on a WCIF entity
 * @param wcifEntity - The WCIF entity to update
 * @param data - The ActivityConfig data to set
 * @returns Updated WCIF entity with the new extension
 */
export function setGroupifierActivityConfig<T extends WcifEntity>(
  wcifEntity: T,
  data: GroupifierActivityConfig
): T {
  const extensionId = `${GROUPIFIER_NAMESPACE}.ActivityConfig`;

  const otherExtensions = wcifEntity.extensions.filter((extension) => extension.id !== extensionId);

  const newExtension: Extension = {
    id: extensionId,
    specUrl: GROUPIFIER_SPEC_URL,
    data,
  };

  return {
    ...wcifEntity,
    extensions: [...otherExtensions, newExtension],
  };
}
