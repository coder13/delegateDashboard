import { shortEventNameById } from '../lib/domain/events';
import { acceptedRegistrations } from '../lib/domain/persons';
import { useAppSelector } from '../store';
import { Card, CardContent, Typography } from '@mui/material';
import { useMemo } from 'react';

export default function CompetitionSummary() {
  const wcif = useAppSelector((state) => state.wcif);
  const approvedRegistrations = acceptedRegistrations(wcif?.persons || []);

  const startDate = useMemo(() => {
    if (!wcif) return new Date();
    const start = new Date(wcif.schedule.startDate);
    start.setHours(start.getHours() + new Date().getTimezoneOffset() / 60);
    return start;
  }, [wcif]);

  const endDate = useMemo(() => {
    if (!wcif || wcif.schedule.numberOfDays <= 1) return undefined;

    const end = new Date(wcif.schedule.startDate);
    end.setDate(startDate.getDate() + wcif.schedule.numberOfDays);
    return end;
  }, [startDate, wcif]);

  if (!wcif) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" paragraph>
          {wcif.name}
        </Typography>
        <Typography>
          <b>Date: </b>
          {startDate.toLocaleDateString()}
          {endDate ? ` - ${endDate.toLocaleDateString()}` : ''}
        </Typography>
        <Typography>
          <b>Competitors: </b>
          {approvedRegistrations.length}
        </Typography>
        <Typography>
          <b>Events: </b>
          {wcif.events.map((event) => shortEventNameById(event.id)).join(', ')} (
          {wcif.events.length})
        </Typography>
      </CardContent>
    </Card>
  );
}
