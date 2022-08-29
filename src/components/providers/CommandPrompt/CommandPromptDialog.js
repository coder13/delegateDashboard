import Fuse from 'fuse.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton, InputBase, List, Paper } from '@mui/material';
import { useTheme } from '@mui/styles';
import { allActivities } from '../../../lib/activities';
import { acceptedRegistrations } from '../../../lib/persons';
import useDebounce from '../../hooks/useDebounce';
import ActivityListItem from './ActivityListItem';
import PersonListItem from './PersonListItem';

const options = {
  keys: ['name', 'wcaId', 'activityCode'],
  minMatchCharLength: 3,
  includeScore: true,
};

function CommandPromptDialog({ open, onClose }) {
  const wcif = useSelector((state) => state.wcif);
  const theme = useTheme();
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(0);

  const persons = useMemo(() => acceptedRegistrations(wcif.persons), [wcif]);
  const activities = useMemo(() => allActivities(wcif), [wcif]);

  const fuse = useMemo(
    () =>
      new Fuse(
        [
          ...persons.map((p) => ({
            ...p,
            class: 'person',
            id: p.registrantId,
          })),
          ...activities.map((a) => ({
            ...a,
            class: 'activity',
          })),
        ],
        options
      ),
    [persons, activities]
  );

  const debouncedCommand = useDebounce(command, 400);

  useEffect(() => {
    if (debouncedCommand) {
      setSearchResults(fuse.search(debouncedCommand).filter(({ score }) => score < 1));
    } else {
      setSearchResults([]);
    }
    setSelected(0);
  }, [debouncedCommand, fuse]);

  const handleClose = useCallback(() => {
    setCommand('');
    setSearchResults([]);
    onClose();
  }, [onClose]);

  const onEnter = useCallback((result) => {
    const selectedItem = (result || searchResults[selected])?.item;
    if (!selectedItem) {
      return;
    }

    switch (selectedItem.class) {
      case 'person':
        navigate(`/competitions/${wcif.id}/persons/${selectedItem.id}`);
        break;
      case 'activity':
        navigate(`/competitions/${wcif.id}/events/${selectedItem.activityCode}`);
        break;
      default:
        break;
    }

    handleClose();
  }, [handleClose, navigate, searchResults, selected, wcif.id])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        setSelected((selected + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        setSelected((selected - 1) % searchResults.length);
      } else if (e.key === 'Enter') {
        const result = searchResults[selected];
        if (result) {
          onEnter();
        }
      } else if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose, onEnter, searchResults, selected]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
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
                setCommand(e.target.value);
              }}
              placeholder="Search for competitors, rounds, and more..."
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
              <List>
                {searchResults.map((result, index) =>
                  result?.item?.class === 'person' ? (
                    <PersonListItem
                      key={result.item.class + result.item.id}
                      selected={selected === index}
                      {...result.item}
                      onClick={() => onEnter(result)}
                    />
                  ) : (
                    <ActivityListItem
                      key={result.item.class + result.item.id}
                      selected={selected === index}
                      {...result.item}
                      onClick={() => onEnter(result)}
                    />
                  )
                )}
              </List>
            ) : (
              <Paper style={{ padding: '1em' }}>Nothing found</Paper>
            )}
          </div>
        </Paper>
      </Box>
    </>
  );
}

export default CommandPromptDialog;
