import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { getLocalStorage, setLocalStorage } from '../../../lib/localStorage';
import { acceptedRegistrations } from '../../../lib/persons';
import { searchPersons } from '../../../lib/wcaAPI';
import FirstTimerCard from './FirstTimerCard';

export default function FirstTimers() {
  const { competitionId } = useParams();
  const wcif = useSelector((state) => state.wcif);
  const [{ index, firstTimer }, setFirstTimer] = useState({
    index: 0,
    firstTimer: null,
  });
  const [personMatches, setPersonMatches] = useState(() => {
    const stored = getLocalStorage(`${competitionId}.personMatches`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  const firstTimers = acceptedRegistrations(wcif.persons).filter((p) => !p.wcaId);

  const incrementIndex = async (i = 0) => {
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
        console.log(
          firstTimer.name,
          personSearch.filter((p) => p.person.name === firstTimer.name)
        );

        const newMatches = [..._personMatches];
        newMatches[i] = {
          id: firstTimer.registrantId,
          search: personSearch.filter((p) => p.person.name === firstTimer.name),
        };

        setLocalStorage(`${competitionId}.personMatches`, JSON.stringify(newMatches));
        return newMatches;
      });
    });

    console.log(i);
    setTimeout(() => incrementIndex(i + 1), 500);
  };

  const checkFirstTimer = () => {
    setLoading(true);
    incrementIndex(0);
  };

  return (
    <div>
      <Typography variant="p">
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
      <LoadingButton loading={loading} loadingIndicator="Checking…" onClick={checkFirstTimer}>
        {personMatches?.length ? 'Re-check All First-Timers' : 'Check All First-Timers'}
      </LoadingButton>
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
