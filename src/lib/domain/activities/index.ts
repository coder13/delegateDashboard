/**
 * Re-exports all activity-related functions for convenient imports
 * This is the main entry point for the activities module
 */

export * from './activityCode';
export * from './activityUtils';
export * from './activityModification';

// Re-export types for backward compatibility
export type { ActivityWithParent, ActivityWithRoom } from '../types';

// Re-export WCIF search functions for backward compatibility
export {
  allChildActivities,
  findRooms,
  roomByActivity,
  findAllActivities,
  findAllRoundActivities,
  findAllActivitiesByRoom,
  findRoundActivitiesById,
  findGroupActivitiesByRound,
  findActivityById,
  activityByActivityCode,
  generateNextChildActivityId,
  findResultsForActivityCode,
  earliestStartTimeForRound,
} from '../../wcif/activities';

// Re-export group functions from wcif/groups for backward compatibility
export { createGroupActivity, cumulativeGroupCount } from '../../wcif/groups';
