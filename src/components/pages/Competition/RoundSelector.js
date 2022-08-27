import '@cubing/icons';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useParams } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { makeStyles } from '@mui/styles';
import { activityById, groupActivitiesByRound, parseActivityCode } from '../../../lib/activities';
import { eventNameById } from '../../../lib/events';
import { personsShouldBeInRound } from '../../../lib/persons';
import { pluralize } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import { Divider, FormControlLabel, Switch } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'Column',
    flex: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    marginTop: '1em',
  },
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
  listSection: {
    backgroundColor: 'inherit',
  },
  ul: {
    backgroundColor: 'inherit',
    padding: 0,
  },
}));

const RoundSelectorPage = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { competitionId } = useParams();
  const wcif = useSelector((state) => state.wcif);
  const classes = useStyles();

  const [showAllRounds, setShowAllRounds] = React.useState(false);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Events',
      },
    ]);
  }, [setBreadcrumbs]);

  return (
    <>
      <FormControlLabel
        control={<Switch />}
        label={'Show All Rounds'}
        checked={showAllRounds}
        onChange={(event) => setShowAllRounds(event.target.checked)}
        inputProps={{ 'aria-label': 'controlled' }}
      />
      <Divider />
      <List className={classes.root}>
        {wcif.events.map((event) => (
          <li key={event.id} className={classes.listSection}>
            <ul className={classes.ul}>
              {showAllRounds && <ListSubheader>{eventNameById(event.id)}</ListSubheader>}
              {event.rounds
                .filter((round) => {
                  const { roundNumber } = parseActivityCode(round.id);
                  return roundNumber === 1 || showAllRounds;
                })
                .map((round, index) => {
                  const realGroups = groupActivitiesByRound(wcif, round.id);
                  const groupsData = getExtensionData('groups', round);

                  const _personsShouldBeInRound = personsShouldBeInRound(wcif, round)?.length;

                  const personsAssigned = wcif.persons.filter((p) =>
                    p.assignments.find((a) => {
                      const activity = activityById(wcif, a.activityId);
                      return (
                        activity.activityCode.split('-')[0] === round.id.split('-')[0] &&
                        activity.activityCode.split('-')[1] === round.id.split('-')[1]
                      );
                    })
                  ).length;

                  const realGroupsGeneratedText = realGroups?.length && `${pluralize(realGroups.length, 'group', 'groups')} generated`;
                  const configuredGroupsText = groupsData?.groups
                    ? `${pluralize(groupsData?.groups, 'group', 'groups')} configured`
                    : 'No Groups Configured';


                  const textToShow = [
                    realGroups?.length ? realGroupsGeneratedText : configuredGroupsText,
                    `${pluralize(personsAssigned, 'person', 'people')} assigned of ${_personsShouldBeInRound || '???'
                    }`,
                  ];

                  return (
                    <ListItem
                      key={round.id}
                      button
                      component={RouterLink}
                      to={`/competitions/${competitionId}/events/${round.id}`}>
                      <ListItemAvatar>
                        <span className={`cubing-icon event-${event.id}`} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${eventNameById(event.id)} Round ${index + 1}`}
                        secondary={textToShow.join(' | ')}
                      />
                    </ListItem>
                  );
                })}
            </ul>
          </li>
        ))}
      </List>
    </>
  );
};

export default RoundSelectorPage;
