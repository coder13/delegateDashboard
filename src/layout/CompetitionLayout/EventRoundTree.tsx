import { activityCodeToName, parseActivityCode } from '../../lib/domain/activities';
import { eventNameById } from '../../lib/domain/events';
import { useAppSelector } from '../../store';
import '@cubing/icons';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

const roundNameFor = (roundId: string) => {
  const { roundNumber } = parseActivityCode(roundId);
  return roundNumber ? `Round ${roundNumber}` : activityCodeToName(roundId);
};

export const EventRoundTree = () => {
  const wcif = useAppSelector((state) => state.wcif);
  const { competitionId, roundId } = useParams<{
    competitionId: string;
    roundId?: string;
  }>();
  const events = wcif?.events ?? [];

  const selectedActivity = roundId ? parseActivityCode(roundId) : undefined;
  const selectedEventId = selectedActivity?.eventId;
  const firstEventId = events[0]?.id;
  const [expandedEventId, setExpandedEventId] = useState<string | false>(
    selectedEventId ?? firstEventId ?? false
  );

  useEffect(() => {
    if (selectedEventId) {
      setExpandedEventId(selectedEventId);
      return;
    }

    if (firstEventId) {
      setExpandedEventId((currentEventId) => currentEventId || firstEventId);
    }
  }, [firstEventId, selectedEventId]);

  const eventsWithRounds = events.filter((event) => event.rounds.length > 0);

  if (!wcif || eventsWithRounds.length === 0) {
    return null;
  }

  return (
    <List
      dense
      sx={{
        py: 0,
        '& .MuiAccordion-root:before': { display: 'none' },
      }}>
      {eventsWithRounds.map((event) => (
        <Accordion
          key={event.id}
          disableGutters
          elevation={0}
          square
          expanded={expandedEventId === event.id}
          onChange={(_, expanded) => setExpandedEventId(expanded ? event.id : false)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`${event.id}-rounds-content`}
            id={`${event.id}-rounds-header`}
            sx={{
              minHeight: 40,
              px: 2,
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1.5,
                my: 0.75,
                minWidth: 0,
              },
            }}>
            <span className={`cubing-icon event-${event.id}`} />
            <Typography variant="body2" noWrap>
              {eventNameById(event.id)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense disablePadding>
              {event.rounds.map((round) => (
                <ListItemButton
                  key={round.id}
                  component={RouterLink}
                  to={`/competitions/${competitionId ?? wcif.id}/events/${round.id}`}
                  selected={
                    selectedActivity?.eventId === event.id &&
                    selectedActivity.roundNumber === parseActivityCode(round.id).roundNumber
                  }
                  sx={{ pl: 5 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <span className={`cubing-icon event-${event.id}`} />
                  </ListItemIcon>
                  <ListItemText primary={roundNameFor(round.id)} />
                </ListItemButton>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </List>
  );
};
