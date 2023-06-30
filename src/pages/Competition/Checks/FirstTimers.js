import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, List, ListItem, ListItemText, ListSubheader, Typography } from '@mui/material';
import { acceptedRegistrations } from '../../../lib/persons';
import CheckFirstTimerDialog from './CheckFirstTimerDialog';

export default function FirstTimers() {
  const wcif = useSelector((state) => state.wcif);

  const persons = acceptedRegistrations(wcif.persons).filter((p) => !p.wcaId);

  const [selectedPerson, setSelectedPerson] = useState(null);

  return (
    <div>
      <Typography variant="p">
        Use this page to check if these first timers are indeed first timers.
      </Typography>
      <List dense>
        <ListSubheader>First Timers</ListSubheader>
        {persons.map((p) => (
          <ListItem
            key={p.registrantId}
            secondaryAction={<Button onClick={() => setSelectedPerson(p)}>Check</Button>}>
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
      <CheckFirstTimerDialog
        open={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        person={selectedPerson}
      />
    </div>
  );
}
