import { getPastManageableCompetitions } from '../../lib/api';
import { APICompetition, CompetitionLink } from './CompetitionLink';
import { Container } from '@mui/material';
import { useEffect, useState } from 'react';

export const PastCompetitions = () => {
  const [competitions, setCompetitions] = useState<APICompetition[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getPastManageableCompetitions().then(setCompetitions).catch(setError);
  }, []);

  if (error) {
    return (
      <Container
        maxWidth="sm"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {error.message}
      </Container>
    );
  }

  return (
    <>
      {competitions?.map((comp) => (
        <CompetitionLink key={comp.id} comp={comp} />
      ))}
    </>
  );
};
