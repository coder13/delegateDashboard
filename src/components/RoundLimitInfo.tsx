import { mayMakeCutoff, mayMakeTimeLimit } from '../lib/domain/persons';
import { getParticipationConditionTextForRound } from '../lib/wcif/rounds';
import { renderResultByEventId } from '../lib/utils/utils';
import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { type Event, type EventId, formatCentiseconds, type Person, type Round } from '@wca/helpers';

interface RoundLimitInfoProps {
  event: Event | null;
  round: Round;
  eventId: string;
  personsShouldBeInRound: Person[];
}

export const RoundLimitInfo = ({ event, round, eventId, personsShouldBeInRound }: RoundLimitInfoProps) => {
  const participationConditionText = event
    ? getParticipationConditionTextForRound(event, round.id)
    : null;

  return (
    <Box sx={{ display: 'flex' }}>
      {round.timeLimit && (
        <Tooltip title="Defined by the number of people who have a PR single under the timelimit">
          <Box sx={{ px: 3, py: 1 }}>
            <Typography>Time Limit: {formatCentiseconds(round.timeLimit.centiseconds)}</Typography>
            {personsShouldBeInRound.length > 0 && (
              <Typography>
                May make TimeLimit:{' '}
                {mayMakeTimeLimit(eventId as EventId, round, personsShouldBeInRound)?.length}
              </Typography>
            )}
          </Box>
        </Tooltip>
      )}
      {round.timeLimit && round.cutoff && <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />}
      {round.cutoff && (
        <Tooltip title="Defined by the number of people who have a PR average under the cutoff">
          <Box sx={{ px: 3, py: 1 }}>
            <Typography>
              Cutoff: {round.cutoff.numberOfAttempts} attempts to get {'< '}
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
      )}
      {participationConditionText && (
        <>
          {(round.timeLimit || round.cutoff) && <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />}
          <Box sx={{ px: 3, py: 1 }}>
            <Typography>Participation: {participationConditionText}</Typography>
          </Box>
        </>
      )}
    </Box>
  );
};
