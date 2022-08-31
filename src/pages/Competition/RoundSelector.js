import '@cubing/icons';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { TransitionGroup } from 'react-transition-group';
import { Collapse, Divider, FormControlLabel, Switch } from '@mui/material';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import { makeStyles } from '@mui/styles';
import { parseActivityCode } from '../../lib/activities';
import { eventNameById } from '../../lib/events';
import { flatMap } from '../../lib/utils';
import { useBreadcrumbs } from '../../providers/BreadcrumbsProvider';
import { useCommandPrompt } from '../../providers/CommandPrompt';
import RoundListItem from './RoundListItem';

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
  const { open: commandPromptOpen } = useCommandPrompt();

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
    if (commandPromptOpen) {
      return;
    }

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
    } else if (e.key === ' ' || e.key === 'a') {
      setShowAllRounds(!showAllRounds);
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
                .map((round) => (
                  <RoundListItem
                    key={round.id}
                    round={round}
                    selected={round.id === selectedId}
                    in={true}
                  />
                ))}
            </TransitionGroup>
          </React.Fragment>
        ))}
      </List>
    </>
  );
};

export default RoundSelectorPage;
