import { mayMakeCutoff, mayMakeTimeLimit } from '../lib/domain/persons';
import {
  getNextRoundParticipationTextForRound,
  getParticipationSourceTextForRound,
} from '../lib/wcif/rounds';
import { renderResultByEventId } from '../lib/utils/utils';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  type Event,
  type EventId,
  formatCentiseconds,
  type Person,
  type Round,
} from '@wca/helpers';

interface RoundLimitInfoProps {
  event: Event | null;
  round: Round;
  eventId: string;
  personsShouldBeInRound: Person[];
}

export const RoundLimitInfo = ({
  event,
  round,
  eventId,
  personsShouldBeInRound,
}: RoundLimitInfoProps) => {
  const thisRoundParticipationText = event
    ? getParticipationSourceTextForRound(event, round.id)
    : null;
  const nextRoundParticipationText = event
    ? getNextRoundParticipationTextForRound(event, round.id)
    : null;
  const sections = [
    round.timeLimit ? (
      <Tooltip
        key="time-limit"
        title="Defined by the number of people who have a PR single under the timelimit">
        <Box sx={{ px: 3, py: 1, minWidth: 0 }}>
          <Typography>Time Limit: {formatCentiseconds(round.timeLimit.centiseconds)}</Typography>
          {personsShouldBeInRound.length > 0 && (
            <Typography>
              May make TimeLimit:{' '}
              {mayMakeTimeLimit(eventId as EventId, round, personsShouldBeInRound)?.length}
            </Typography>
          )}
        </Box>
      </Tooltip>
    ) : null,
    round.cutoff ? (
      <Tooltip
        key="cutoff"
        title="Defined by the number of people who have a PR average under the cutoff">
        <Box sx={{ px: 3, py: 1, minWidth: 0 }}>
          <Typography>Cutoff:</Typography>
          <Typography>
            {round.cutoff.numberOfAttempts} attempts to get {'< '}
            {renderResultByEventId(eventId as EventId, 'average', round.cutoff.attemptResult)}
          </Typography>
          {personsShouldBeInRound.length > 0 && (
            <Typography>
              May make cutoff:{' '}
              {mayMakeCutoff(eventId as EventId, round, personsShouldBeInRound)?.length}
            </Typography>
          )}
        </Box>
      </Tooltip>
    ) : null,
    thisRoundParticipationText ? (
      <Box key="this-round" sx={{ px: 3, py: 1, minWidth: 0 }}>
        <Typography>Participation: {thisRoundParticipationText}</Typography>
      </Box>
    ) : null,
    nextRoundParticipationText ? (
      <Box key="next-round" sx={{ px: 3, py: 1, minWidth: 0 }}>
        <Typography>Advancement: {nextRoundParticipationText}</Typography>
      </Box>
    ) : null,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        alignItems: 'stretch',
      }}>
      {sections.map((section, index) => (
        <Box
          key={index}
          sx={{
            borderLeft: index === 0 ? 'none' : 1,
            borderColor: 'divider',
          }}>
          {section}
        </Box>
      ))}
    </Box>
  );
};
