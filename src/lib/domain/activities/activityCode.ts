import { eventNameById } from '../events';
import type { ActivityCode } from '../types';
import { type EventId } from '@wca/helpers';

/** Activity Code Parsing and Manipulation */

const ParseActivityCodeCache = new Map<string, ActivityCode>();

/**
 * Parses an activity code string into its component parts
 * @param activityCode - The activity code to parse (e.g., "333-r1-g2")
 * @returns Parsed activity code object
 */
export const parseActivityCode = (activityCode: string): ActivityCode => {
  if (ParseActivityCodeCache.has(activityCode)) {
    return ParseActivityCodeCache.get(activityCode)!;
  }

  const [, e, r, g, a] = activityCode.match(/(\w+)(?:-r(\d+))?(?:-g(\d+))?(?:-a(\d+))?/) || [];
  const parsedActivityCode = {
    eventId: e as EventId,
    roundNumber: r ? parseInt(r, 10) : undefined,
    groupNumber: g ? parseInt(g, 10) : undefined,
    attemptNumber: a ? parseInt(a, 10) : undefined,
  };

  ParseActivityCodeCache.set(activityCode, parsedActivityCode);
  return parsedActivityCode;
};

/**
 * Creates an activity code string from a parsed activity code object
 * @param parsedActivityCode - The parsed activity code object
 * @returns Activity code string (e.g., "333-r1-g2")
 */
export const createActivityCode = (parsedActivityCode: ActivityCode) => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parsedActivityCode;
  return `${eventId}${roundNumber ? `-r${roundNumber}` : ''}${
    groupNumber ? `-g${groupNumber}` : ''
  }${attemptNumber ? `-a${attemptNumber}` : ''}`;
};

/**
 * Converts an activity code to a human-readable name
 * @param activityCode - The activity code to convert
 * @returns Human-readable name (e.g., "3x3x3 Cube, Round 1, Group 2")
 */
export const activityCodeToName = (activityCode: string) => {
  const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(activityCode);
  return [
    eventId && eventNameById(eventId),
    roundNumber && `Round ${roundNumber}`,
    groupNumber && `Group ${groupNumber}`,
    attemptNumber && `Attempt ${attemptNumber}`,
  ]
    .filter((x) => x)
    .join(', ');
};

/**
 * Determines if the child activityCode is a child of the parent activityCode
 * @param parentActivityCode - The parent activity code
 * @param childActivityCode - The child activity code
 * @returns True if child is a descendant of parent
 */
export const activityCodeIsChild = (parentActivityCode: string, childActivityCode: string) => {
  const parent = parseActivityCode(parentActivityCode);
  const child = parseActivityCode(childActivityCode);

  return (
    parent.eventId === child.eventId &&
    (!parent.roundNumber || parent.roundNumber === child.roundNumber) &&
    (!parent.groupNumber || parent.groupNumber === child.groupNumber) &&
    (!parent.attemptNumber || parent.attemptNumber === child.attemptNumber)
  );
};

/**
 * Checks if an event has distributed attempts (FMC, Multi-Blind)
 * @param activityCode - The activity code to check
 * @returns True if the event has distributed attempts
 */
export const hasDistributedAttempts = (activityCode: string) =>
  ['333fm', '333mbf'].includes(parseActivityCode(activityCode).eventId);
