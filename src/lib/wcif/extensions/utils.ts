import { getGroupsExtensionData } from './delegateDashboard';
import { getGroupifierActivityConfig } from './groupifier';
import { type Activity } from '@wca/helpers';

/**
 * Result of group data extraction including source information
 */
export interface GroupData {
  /**
   * Number of groups for this activity
   */
  groups: number;
  /**
   * Source of the group data (which extension provided it)
   */
  source: string;
}

/**
 * Get group count data from an activity, checking multiple extension sources
 * in priority order:
 * 1. Delegate Dashboard extension (delegateDashboard.groups)
 * 2. Groupifier extension (groupifier.ActivityConfig)
 *
 * @param roundActivity - The round activity to get group data from
 * @returns Group data with source information, or null if no extension found
 */
export function getGroupData(roundActivity: Activity): GroupData | null {
  // Priority 1: Check Delegate Dashboard extension
  // We need to check if the extension actually exists, not just get defaults
  const ddExtension = roundActivity.extensions.find((ext) => ext.id === 'delegateDashboard.groups');

  if (ddExtension) {
    const ddData = getGroupsExtensionData(roundActivity);
    if (ddData && typeof ddData.groups === 'number') {
      return {
        groups: ddData.groups,
        source: 'Delegate Dashboard',
      };
    }

    // Handle case where groups is a Record (per-stage configuration)
    if (ddData && typeof ddData.groups === 'object') {
      return {
        groups: Object.values(ddData.groups).reduce((sum, count) => sum + count, 0) || 1,
        source: 'Delegate Dashboard',
      };
    }
  }

  // Priority 2: Check Groupifier extension (backward compatibility)
  const groupifierConfig = getGroupifierActivityConfig(roundActivity);
  if (groupifierConfig) {
    return {
      groups: groupifierConfig.groups ?? 1,
      source: 'Groupifier',
    };
  }

  // No extension found
  return null;
}
