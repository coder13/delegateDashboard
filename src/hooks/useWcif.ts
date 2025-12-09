import { useAppSelector } from '../store';
import {
  selectAcceptedPersons,
  selectFirstTimers,
  selectGroupActivitiesByRound,
  selectWcifRooms,
} from '../store/selectors';

/**
 * Hook to get the WCIF from Redux state
 */
export const useWcif = () => {
  return useAppSelector((state) => state.wcif);
};

/**
 * Hook to get all accepted persons (filtered registrations)
 */
export const useAcceptedPersons = () => {
  return useAppSelector(selectAcceptedPersons);
};

/**
 * Hook to get all first-timer persons (no WCA ID)
 */
export const useFirstTimers = () => {
  return useAppSelector(selectFirstTimers);
};

/**
 * Hook to get group activities for a specific round
 * @param roundId - The round activity code (e.g., '333-r1')
 */
export const useGroupActivitiesByRound = (roundId: string) => {
  return useAppSelector((state) => selectGroupActivitiesByRound(state, roundId));
};

/**
 * Hook to get all rooms from the WCIF
 */
export const useWcifRooms = () => {
  return useAppSelector(selectWcifRooms);
};
