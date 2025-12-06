import {
  competitorAssignmentRegexWithStage,
  competitorAssignmentRegexWithoutStage,
} from './import';

/**
 * Parses a cell that is expected to contain a competitor assignment.
 * Returns a group number or group number with stage
 * @param assignment
 */
export const parseCompetitorAssignment = (raw: string): {
  groupNumber: number;
  stage: string | null;
} | undefined => {
  if (!raw || raw.trim() === '-') {
    return;
  }

  const data = raw.trim();
  const matchWithStage = data.match(competitorAssignmentRegexWithStage);
  if (matchWithStage) {
    return parseCompetitorAssignmentWithStage(matchWithStage);
  }

  const match = data.match(competitorAssignmentRegexWithoutStage);
  if (match) {
    return { ...parseCompetitorAssignmentWithoutStage(match), stage: null };
  }

  return {
    groupNumber: parseInt(data),
    stage: null,
  };
};

const parseCompetitorAssignmentWithStage = (match: RegExpMatchArray) => {
  const groupNumber = match?.groups?.['groupNumber'] ? parseInt(match.groups.groupNumber) : undefined;
  if (!groupNumber) {
    return undefined;
  }

  const stage = match.groups?.stage || null;
  return { groupNumber, stage };
};

const parseCompetitorAssignmentWithoutStage = (match: RegExpMatchArray) => {
  const groupNumber = parseInt(match[1]);
  return { groupNumber };
};
