import {
  competitorAssignmentRegexWithStage,
  competitorAssignmentRegexWithoutStage,
} from './import';

/**
 * Parses a cell that is expected to contain a competitor assignment.
 * Returns a group number or group number with stage
 * @param assignment
 */
export const parseCompetitorAssignment = (raw: string) => {
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
    return parseCompetitorAssignmentWithoutStage(match);
  }

  return;
};

const parseCompetitorAssignmentWithStage = (match: RegExpMatchArray) => {
  const groupNumber = parseInt(match[1]);
  const stage = match[2];
  return { groupNumber, stage };
};

const parseCompetitorAssignmentWithoutStage = (match: RegExpMatchArray) => {
  const groupNumber = parseInt(match[1]);
  return { groupNumber };
};
