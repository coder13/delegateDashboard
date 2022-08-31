import Fuse from 'fuse.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  InputBase,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/styles';
import useDebounce from '../../hooks/useDebounce';
import { allActivities } from '../../lib/activities';
import { acceptedRegistrations } from '../../lib/persons';
import SearchResultList from './SearchResultList';

const options = {
  keys: ['name', 'wcaId', 'activityCode'],
  minMatchCharLength: 3,
  includeScore: true,
};

function CommandPromptDialog({ open, onClose }) {
  const wcif = useSelector((state) => state.wcif);
  const competitions = useSelector((state) => state.competitions);
  const [currentCompetitionId, setCurrentCompetitionId] = useState(wcif?.id);
  const theme = useTheme();
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setCurrentCompetitionId(wcif.id);
  }, [wcif]);

  const persons = useMemo(() => acceptedRegistrations(wcif.persons), [wcif]);
  const activities = useMemo(() => allActivities(wcif), [wcif]);

  const fuse = useMemo(() => {
    if (currentCompetitionId && wcif) {
      const data = [
        ...persons.map((p) => ({
          ...p,
          class: 'person',
          id: p.registrantId,
        })),
        ...activities.map((a) => ({
          ...a,
          class: 'activity',
        })),
      ];
      return new Fuse(data, {
        ...options,
        keys: ['name', 'wcaId', 'activityCode'],
      });
    } else {
      return new Fuse(
        competitions.map((c) => ({
          ...c,
          class: 'competition',
        })),
        {
          ...options,
          keys: ['name', 'shortName', 'id'],
        }
      );
    }
  }, [currentCompetitionId, wcif, persons, activities, competitions]);

  const debouncedCommand = useDebounce(command, 400);

  useEffect(() => {
    if (debouncedCommand) {
      setSearchResults(fuse.search(debouncedCommand).filter(({ score }) => score < 1));
    } else {
      if (!currentCompetitionId) {
        setSearchResults(
          competitions.slice(0, 3).map((c) => ({
            item: c,
          }))
        );
      } else {
        setSearchResults([]);
      }
    }
    setSelected(0);
  }, [competitions, currentCompetitionId, debouncedCommand, fuse]);

  const handleClose = useCallback(() => {
    setCommand('');
    setSearchResults([]);
    onClose();
  }, [onClose]);

  const onEnter = useCallback(
    (result) => {
      switch (result.class) {
        case 'person':
          navigate(`/competitions/${wcif.id}/persons/${result.id}`);
          break;
        case 'activity':
          navigate(`/competitions/${wcif.id}/events/${result.activityCode}`);
          break;
        case 'competition':
          navigate(`/competitions/${result.id}`);
          break;
        default:
          break;
      }

      handleClose();
    },
    [handleClose, navigate, wcif.id]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((selected + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((selected - 1) % searchResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const result = searchResults[selected];
        if (result) {
          onEnter(result.item);
        }
      } else if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Backspace') {
        if (command.length === 0) {
          setCurrentCompetitionId(null);
        }
      }
    },
    [command.length, handleClose, onEnter, searchResults, selected]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box
        style={{
          zIndex: theme.zIndex.drawer * 10,
          top: open ? 0 : '-100%',
          left: open ? '25%' : '50%',
          width: open ? '50%' : 0,
          maxHeight: '50vh',

          position: 'fixed',
          // display: open ? 'block' : 'none',
          border: theme.palette.divider,
          transition: theme.transitions.create(['top', 'left', 'width']),
          overflow: 'hidden',
          boxShadow: theme.shadows[6],
        }}>
        <Paper
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            maxHeight: '50vh',
            overflow: 'hidden',
          }}>
          <Paper
            component="form"
            sx={{ p: '0.25em 0.5em', display: 'flex', alignItems: 'center' }}
            onSubmit={(e) => e.preventDefault()}>
            <InputBase
              inputRef={(input) => input && input.focus()}
              value={command}
              onChange={(e) => {
                open && setCommand(e.target.value);
              }}
              placeholder={
                currentCompetitionId
                  ? 'Search for competitors, rounds, and more...'
                  : 'Search for competitions...'
              }
              startAdornment={
                <InputAdornment position="start">
                  {currentCompetitionId ? currentCompetitionId : '/'}
                </InputAdornment>
              }
              sx={{
                ml: 1,
                flex: 1,
              }}
            />
            <IconButton type="button" sx={{ p: '0.5em' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
          <div
            style={{
              overflowY: 'auto',
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              transition: theme.transitions.create(['top', 'left', 'width']),
            }}>
            {searchResults?.length ? (
              <SearchResultList
                searchResults={searchResults}
                selected={selected}
                onSelect={onEnter}
              />
            ) : (
              <Paper style={{ padding: '1em' }}>Nothing found</Paper>
            )}
          </div>
        </Paper>
      </Box>
    </ClickAwayListener>
  );
}

export default CommandPromptDialog;
