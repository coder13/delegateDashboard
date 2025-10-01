// @ts-nocheck
import { Competition } from '@wca/helpers';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../store/initialState';
import { Card, CardContent, Typography } from '@mui/material';
import { shortEventNameById } from '../lib/events';
import { acceptedRegistrations } from '../lib/persons';

export default function CompetitionSummary(props?: any) {
  const wcif = useSelector((state: { wcif: Competition }) => state.wcif);
  const approvedRegistrations = acceptedRegistrations(wcif.persons);

  const startDate = useMemo(() => {
    const start = new Date(wcif.schedule.startDate);
    start.setHours(start.getHours() + new Date().getTimezoneOffset() / 60);
    return start;
  }, [wcif]);

  const endDate = useMemo(() => {
    if (wcif.schedule.numberOfDays <= 1) return undefined;

    const end = new Date(wcif.schedule.startDate);
    end.setDate(startDate.getDate() + wcif.schedule.numberOfDays);
    return end;
  }, [startDate, wcif.schedule.numberOfDays, wcif.schedule.startDate]);

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
