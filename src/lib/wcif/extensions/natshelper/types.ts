/**
 * Type definitions for Nats Helper WCIF extensions
 * @see https://github.com/cubingusa/natshelper
 */

/**
 * Extension data for room configuration
 */
export interface RoomExtensionData {
  /**
   * Array of stage objects
   */
  stages?: Array<{
    id?: number;
    name?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Extension data for group/activity configuration
 */
export interface GroupExtensionData {
  /**
   * The ID of the stage this group is associated with
   */
  stageId?: number;
}
