import '@cubing/icons';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { TransitionGroup } from 'react-transition-group';
import { Collapse, Divider, FormControlLabel, Switch } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { makeStyles } from '@mui/styles';
import { activityById, groupActivitiesByRound, parseActivityCode } from '../../../lib/activities';
import { eventNameById } from '../../../lib/events';
import { personsShouldBeInRound } from '../../../lib/persons';
import { flatMap, pluralize } from '../../../lib/utils';
import { getExtensionData } from '../../../lib/wcif-extensions';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';

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
  const navigate = useNavigate();
  const wcif = useSelector((state) => state.wcif);
  const classes = useStyles();

  const [showAllRounds, setShowAllRounds] = useState(false);
  const [selectedId, setSelectedId] = useState(wcif?.events[0].rounds[0].id || null);

  const rounds = flatMap(wcif.events, (event) => event.rounds.map((r) => r.id)).filter((rId) => {
    if (showAllRounds) {
      return true;
    }

    const { roundNumber } = parseActivityCode(rId);
    return roundNumber === 1;
  });

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Events',
      },
    ]);
  }, [setBreadcrumbs]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      const selectedIndex = rounds.indexOf(selectedId);
      const nextIndex = (selectedIndex - 1 + rounds.length) % rounds.length;
      setSelectedId(rounds[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      const selectedIndex = rounds.indexOf(selectedId);
      const nextIndex = (selectedIndex + 1 + rounds.length) % rounds.length;
      setSelectedId(rounds[nextIndex]);
    } else if (e.key === 'Enter') {
      navigate(`/competitions/${competitionId}/events/${selectedId}`);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  return (
    <>
      <FormControlLabel
        control={<Switch />}
        label={'Show All Rounds'}
        checked={showAllRounds}
        onChange={(event) => setShowAllRounds(event.target.checked)}
      />
      <Divider />
      <List className={classes.root}>
        {wcif.events.map((event) => (
          <React.Fragment key={event.id}>
            <Collapse in={showAllRounds}>
              <ListSubheader>{eventNameById(event.id)}</ListSubheader>
            </Collapse>
            <TransitionGroup>
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

                  const realGroupsGeneratedText =
                    realGroups?.length &&
                    `${pluralize(realGroups.length, 'group', 'groups')} generated`;
                  const configuredGroupsText = groupsData?.groups
                    ? `${pluralize(groupsData?.groups, 'group', 'groups')} configured`
                    : 'No Groups Configured';

                  const textToShow = [
                    realGroups?.length ? realGroupsGeneratedText : configuredGroupsText,
                    `${pluralize(personsAssigned, 'person', 'people')} assigned of ${
                      _personsShouldBeInRound || '???'
                    }`,
                  ];

                  return (
                    <Collapse key={round.id}>
                      <ListItem
                        button
                        component={RouterLink}
                        to={`/competitions/${competitionId}/events/${round.id}`}
                        selected={round.id === selectedId}>
                        <ListItemAvatar>
                          <span className={`cubing-icon event-${event.id}`} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${eventNameById(event.id)} Round ${index + 1}`}
                          secondary={textToShow.join(' | ')}
                        />
                      </ListItem>
                    </Collapse>
                  );
                })}
            </TransitionGroup>
          </React.Fragment>
        ))}
      </List>
    </>
  );
};

export default RoundSelectorPage;
