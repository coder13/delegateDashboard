import { Competition } from '@wca/helpers';
import { intlFormat } from 'date-fns';
import { useSelector } from 'react-redux';
import { Card, CardContent, Typography } from '@mui/material';
import { shortEventNameById } from '../lib/events';
import { acceptedRegistrations } from '../lib/persons';
import { pluralize } from '../lib/utils';

export default function CompetitionSummary() {
  const wcif = useSelector((state: { wcif: Competition }) => state.wcif);
  const approvedRegistrations = acceptedRegistrations(wcif.persons);

  const formattedDate = intlFormat(new Date(wcif.schedule.startDate), {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" paragraph>
          {wcif.name}
        </Typography>
        <Typography>
          <b>Date: </b>
          {formattedDate} ({pluralize(wcif.schedule.numberOfDays, 'day', 'days')})
        </Typography>
        <Typography>
          <b>Competitors: </b>
          {approvedRegistrations.length}
        </Typography>
        <Typography>
          <b>Events: </b>
          {wcif.events.map((event) => shortEventNameById(event.id)).join(', ')}
        </Typography>
      </CardContent>
    </Card>
  );
}
