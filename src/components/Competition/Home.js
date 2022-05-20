import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Card, Grid, Typography } from '@mui/material';
import { CardContent } from '@mui/material';
import { acceptedRegistrations } from '../../lib/persons';
import { pluralize } from '../../lib/utils';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import Link from '../shared/MaterialLink';
import RoundSelectorPage from './RoundSelector';

const CompetitionSummary = () => {
  const wcif = useSelector((state) => state.wcif);
  const approvedRegistrations = acceptedRegistrations(wcif.persons).filter(
    (person) => person.registration.status === 'accepted'
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" paragraph>
          {wcif.name}
        </Typography>
        <Typography>
          <b>Competitors: </b>
          {approvedRegistrations.length}
        </Typography>
        <Typography>
          <b>Date: </b>
          {wcif.schedule.startDate} (
          {pluralize(wcif.schedule.numberOfDays, 'day', 'days')})
        </Typography>
      </CardContent>
    </Card>
  );
};

// const Rounds = () => {
//   const wcif = useSelector((state) => state.wcif);

//   const needToEdit = (activity) => {
//     const { eventId, roundNumber } = parseActivityCode(activity.activityCode);
//     const event = wcif.events.find((e) => e.id === eventId);
//     const round = event.rounds.find((r) => r.id === activity.activityCode);
//     const nextRound = event.rounds.find(
//       (r) => r.id === `${eventId}-r${roundNumber + 1}`
//     );

//     const hasNextRound = !!nextRound;

//     // Only show opened first rounds.
//     if (
//       roundNumber === 1 &&
//       round.results.length > 0 &&
//       (hasNextRound ? nextRound.results.length === 0 : true)
//     ) {
//       return true;
//     }
//     return false;
//   };

//   const activityCodes = allRoundActivities(wcif)
//     .filter((activity) => activity.activityCode.split('-')[0] !== 'other')
//     .map((activity) => activity.activityCode)
//     .filter(needToEdit);

//   if (activityCodes.length === 0) {
//     return (
//       <div>
//         <Typography>Open rounds on wca-live first</Typography>
//         <Typography>
//           After you synchronize, the opened rounds should appear here
//         </Typography>
//       </div>
//     );
//   }

//   return (
//     <div>
//       {activityCodes.map((activity) => {
//         const { eventId } = parseActivityCode(activity.activityCode);

//         return (
//           <Card
//             key={activity.id}
//             style={{ marginTop: '1em', marginBottom: '1em' }}
//           >
//             <CardHeader
//               avatar={
//                 <Box
//                   component="span"
//                   className={`cubing-icon event-${eventId}`}
//                   sx={{
//                     color: (theme) =>
//                       theme.palette.mode === 'dark'
//                         ? '#fff'
//                         : 'rgba(0, 0, 0, 0.54)',
//                     fontSize: 32,
//                   }}
//                 />
//               }
//               title={activity.name}
//               subheader={moment(activity.startTime).format('LTS')}
//               action={
//                 <IconButton>
//                   <MoreVertIcon />
//                 </IconButton>
//               }
//             />
//             <Divider />
//             <CardContent>
//               <Typography>
//                 <b>Groups: </b>
//                 <span>{0}</span>
//               </Typography>
//             </CardContent>
//             <Divider />
//             <CardActions>
//               <Button>Pick Scramblers</Button>
//               <Button>Generate Groups</Button>
//               <div style={{ display: 'flex', flex: 1 }} />
//               <Button>View More</Button>
//             </CardActions>
//           </Card>
//         );
//       })}
//     </div>
//   );
// };

const CompetitionHome = () => {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <CompetitionSummary />
      </Grid>
      <Grid item>
        <Alert severity="error">
          <Link to={'roles'}>Pick Staff!</Link>
        </Alert>
      </Grid>
      <Grid item>
        <RoundSelectorPage />
      </Grid>
    </Grid>
  );
};

export default CompetitionHome;
