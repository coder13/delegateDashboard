/**
 * Type definitions for Competition Scheduler WCIF extensions
 */

/**
 * Extension data for round configuration from Competition Scheduler
 */
export interface RoundConfigExtensionData {
  /**
   * Number of groups for this round
   */
  groupCount?: number;
  /**
   * Expected number of registrations for this round
   */
  expectedRegistrations?: number;
}
