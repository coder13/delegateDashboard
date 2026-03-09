import { getLocalStorage, setLocalStorage, searchPersons } from '../../../lib/api';
import { type WcaPersonSearchResult } from '../../../lib/api/types';
import { acceptedRegistrations } from '../../../lib/domain/persons';
import { useAppSelector } from '../../../store';
import FirstTimerCard from './FirstTimerCard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { type Person } from '@wca/helpers';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

interface PersonMatch {
  id: number;
  search: WcaPersonSearchResult[];
}

export default function FirstTimers() {
  const { competitionId = '' } = useParams<{ competitionId?: string }>();
  const wcif = useAppSelector((state) => state.wcif);
  const [{ index, firstTimer }, setFirstTimer] = useState<{
    index: number;
    firstTimer: Person | null;
  }>({
    index: 0,
    firstTimer: null,
  });
  const [personMatches, setPersonMatches] = useState<PersonMatch[]>(() => {
    const stored = getLocalStorage(`${competitionId}.personMatches`);
    if (stored) {
      return JSON.parse(stored) as PersonMatch[];
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  const firstTimers = acceptedRegistrations(wcif?.persons ?? []).filter((p) => !p.wcaId);

  const incrementIndex = (i = 0) => {
    if (i >= firstTimers.length) {
      setLoading(false);
      return;
    }

    const firstTimer = firstTimers[i];

    setFirstTimer({
      index: i,
      firstTimer,
    });

    searchPersons(firstTimer.name).then((personSearch) => {
      setPersonMatches((_personMatches) => {
        const newMatches = [..._personMatches];
        newMatches[i] = {
          id: firstTimer.registrantId,
          search: personSearch.filter((p) => p.person.name === firstTimer.name),
        };

        setLocalStorage(`${competitionId}.personMatches`, JSON.stringify(newMatches));
        return newMatches;
      });
    });

    setTimeout(() => incrementIndex(i + 1), 500);
  };

  const checkFirstTimer = () => {
    setLoading(true);
    incrementIndex(0);
  };

  return (
    <div>
      <Typography variant="body1" component="p">
        Use this page to check if these first timers are indeed first timers.
      </Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>First Timers</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {firstTimers.map((p) => (
              <ListItem key={p.registrantId}>
                <ListItemText
                  primary={p.name}
                  secondary={
                    <div>
                      <span>{p.birthdate}</span>
                      {' | '}
                      <a href={`mailto:${p.email}`}>{p.email}</a>
                    </div>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
      <Divider />
      <Button onClick={checkFirstTimer}>
        {loading
          ? 'Checking...'
          : personMatches?.length
            ? 'Re-check All First-Timers'
            : 'Check All First-Timers'}
      </Button>
      {loading && (
        <span>
          Checking {firstTimer?.name} | {index + 1} of {firstTimers.length}
        </span>
      )}
      <Divider />
      <Typography variant="h6" sx={{ my: 1 }}>
        Matches
      </Typography>
      <Stack spacing={2}>
        {personMatches
          .filter((pm) => pm.search?.length > 0)
          .map((pm) => {
            const person = firstTimers.find((f) => f.registrantId === pm.id);

            if (!person) {
              return null;
            }

            return <FirstTimerCard key={pm.id} person={person} matches={pm.search} />;
          })}
      </Stack>
    </div>
  );
}
