/**
 * Type definitions for Delegate Dashboard WCIF extensions
 */

/**
 * Extension data for configuring groups in a round
 */
export interface GroupsExtensionData {
  /**
   * Number of groups or a mapping of stage number to group count
   */
  groups?: number | Record<number, number>;
  /**
   * Whether to spread groups across all stages
   */
  spreadGroupsAcrossAllStages?: boolean;
}

/**
 * Extension data for configuring an activity
 */
export interface ActivityConfigExtensionData {
  /**
   * Number of groups for this activity
   */
  groupCount?: number;
}

/**
 * Extension data for configuring a round
 */
export interface RoundConfigExtensionData {
  [key: string]: unknown;
}
