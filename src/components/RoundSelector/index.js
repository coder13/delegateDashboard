import '@cubing/icons';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TransitionGroup } from 'react-transition-group';
import { Collapse, Divider, FormControlLabel, Switch } from '@mui/material';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import { makeStyles } from '@mui/styles';
import { earliestStartTimeForRound, parseActivityCode } from '../../lib/activities';
import { eventNameById } from '../../lib/events';
import { useCommandPrompt } from '../../providers/CommandPromptProvider';
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

const RoundSelector = ({ competitionId, onSelected }) => {
  const wcif = useSelector((state) => state.wcif);
  const classes = useStyles();
  const { open: commandPromptOpen } = useCommandPrompt();

  const [showAllRounds, setShowAllRounds] = useState(false);
  const [selectedId, setSelectedId] = useState(wcif?.events[0].rounds[0].id || null);

  const shouldShowRound = (round) => {
    const { roundNumber } = parseActivityCode(round.id);
    if (roundNumber === 1 || showAllRounds) {
      return true;
    }

    const earliestStartTime = earliestStartTimeForRound(wcif, round.id);
    if (earliestStartTime && earliestStartTime.getTime() < Date.now()) {
      return true;
    }

    if (round.results?.length) {
      return true;
    }

    return false;
  };

  const rounds = wcif.events
    .map((e) => e.rounds)
    .flat()
    .filter(shouldShowRound);

  const roundIds = rounds.map((r) => r.id);

  const handleKeyDown = (e) => {
    if (commandPromptOpen) {
      return;
    }

    if (e.key === 'ArrowUp') {
      const selectedIndex = roundIds.indexOf(selectedId);
      const nextIndex = (selectedIndex - 1 + roundIds.length) % roundIds.length;
      setSelectedId(roundIds[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      const selectedIndex = roundIds.indexOf(selectedId);
      const nextIndex = (selectedIndex + 1 + roundIds.length) % roundIds.length;
      setSelectedId(roundIds[nextIndex]);
    } else if (e.key === 'Enter') {
      onSelected(selectedId);
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
        {wcif.events.map((event) => {
          const roundsForEvent = rounds.filter((round) => round.id.split('-')[0] === event.id);

          return (
            <React.Fragment key={event.id}>
              <Collapse in={showAllRounds || rounds.length > 1}>
                <ListSubheader>{eventNameById(event.id)}</ListSubheader>
              </Collapse>
              <TransitionGroup>
                {roundsForEvent.map((round) => (
                  <RoundListItem
                    key={round.id}
                    round={round}
                    selected={round.id === selectedId}
                    in={true}
                  />
                ))}
              </TransitionGroup>
            </React.Fragment>
          );
        })}
      </List>
    </>
  );
};

export default RoundSelector;
