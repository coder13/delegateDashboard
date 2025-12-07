import {
  earliestStartTimeForRound,
  hasDistributedAttempts,
  parseActivityCode,
} from '../../lib/domain/activities';
import { eventNameById } from '../../lib/domain/events';
import { useCommandPrompt } from '../../providers/CommandPromptProvider';
import { useAppSelector } from '../../store';
import RoundListItem from './RoundListItem';
import '@cubing/icons';
import { Collapse, Divider, FormControlLabel, Switch } from '@mui/material';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { Round } from '@wca/helpers';
import React, { useEffect, useState } from 'react';
import { TransitionGroup } from 'react-transition-group';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
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

interface RoundSelectorProps {
  competitionId: string;
  onSelected: (roundId: string) => void;
}

const RoundSelector = ({ onSelected }: RoundSelectorProps) => {
  const wcif = useAppSelector((state) => state.wcif);
  const classes = useStyles();
  const { open: commandPromptOpen } = useCommandPrompt();

  const [showAllRounds, setShowAllRounds] = useState(false);
  const [selectedId, setSelectedId] = useState(wcif?.events[0]?.rounds[0]?.id || null);

  const shouldShowRound = (round: Round) => {
    if (!wcif) return false;

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

  const rounds = wcif
    ? wcif.events
        .map((e) => e.rounds)
        .flat()
        .filter(shouldShowRound)
    : [];

  const roundIds = rounds.flatMap((r) =>
    hasDistributedAttempts(r.id)
      ? new Array(r.format === 'm' ? 3 : +r.format)
          .fill(0)
          .map((_, index) => `${r.id}-a${index + 1}`)
      : r.id
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (commandPromptOpen) {
      return;
    }

    if (e.key === 'ArrowUp') {
      const selectedIndex = roundIds.indexOf(selectedId || '');
      const nextIndex = (selectedIndex - 1 + roundIds.length) % roundIds.length;
      setSelectedId(roundIds[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      const selectedIndex = roundIds.indexOf(selectedId || '');
      const nextIndex = (selectedIndex + 1 + roundIds.length) % roundIds.length;
      setSelectedId(roundIds[nextIndex]);
    } else if (e.key === 'Enter') {
      if (selectedId) {
        onSelected(selectedId);
      }
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

  if (!wcif) {
    return null;
  }

  return (
    <>
      <FormControlLabel
        control={<Switch />}
        label={'Show All Rounds'}
        checked={showAllRounds}
        onChange={(_, checked) => setShowAllRounds(checked)}
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
                {!hasDistributedAttempts(event.id)
                  ? roundsForEvent.map((round) => (
                      <RoundListItem
                        key={round.id}
                        activityCode={round.id}
                        round={round}
                        selected={round.id === selectedId}
                        in
                      />
                    ))
                  : roundsForEvent.flatMap((round) => {
                      const attempts = new Array(round.format === 'm' ? 3 : +round.format) // TODO: create helper function to calculate attempts
                        .fill(0);

                      return attempts.map((_, index) => {
                        const attemptActivityCode = `${round.id}-a${index + 1}`;

                        return (
                          <RoundListItem
                            key={attemptActivityCode}
                            activityCode={attemptActivityCode}
                            round={round}
                            selected={attemptActivityCode === selectedId}
                            in
                          />
                        );
                      });
                    })}
              </TransitionGroup>
            </React.Fragment>
          );
        })}
      </List>
    </>
  );
};

export default RoundSelector;
