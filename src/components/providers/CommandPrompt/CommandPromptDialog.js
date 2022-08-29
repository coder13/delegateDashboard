import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/styles';
import { acceptedRegistrations } from '../../../lib/persons';

/**
 * https://usehooks.com/useDebounce/
 * @param {*} value 
 * @param {*} delay 
 * @returns 
 */
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

const options = {
  keys: ['name', 'wcaId'],
  minMatchCharLength: 3,
  includeScore: true,
};

function CommandPromptDialog({ open, onClose }) {
  const wcif = useSelector((state) => state.wcif);
  const theme = useTheme();
  const [command, setCommand] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const persons = useMemo(() => acceptedRegistrations(wcif.persons), [wcif]);

  const fuse = useMemo(() => new Fuse(persons, options), [persons]);

  const debouncedCommand = useDebounce(command, 1000);

  useEffect(() => {
    if (debouncedCommand) {
      setSearchResults(fuse.search(debouncedCommand).filter(({ score }) => score < 0.20));
    } else {
      setSearchResults([]);
    }
  }, [debouncedCommand, fuse]);

  return (
    <>
      <Box
        style={{
          zIndex: theme.zIndex.drawer * 10,
          top: open ? 0 : '-15%',
          left: open ? '25%' : '50%',
          width: open ? '50%' : 0,
          position: 'fixed',
          // display: open ? 'block' : 'none',
          border: theme.palette.divider,
          transition: theme.transitions.create(['top', 'left', 'width']),
        }}>
        <Paper>
          <Paper
            component="form"
            sx={{ p: '0.25em 0.5em', display: 'flex', alignItems: 'center' }}
            onSubmit={(e) => e.preventDefault()}
          >
            <InputBase
              value={command}
              onChange={(e) => {
                setCommand(e.target.value);
              }}
              placeholder="Search for competitors, rounds, and more..."
              sx={{
                ml: 1,
                flex: 1
              }}
            />
            <IconButton type="button" sx={{ p: '0.5em' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
          {searchResults?.length ? (
            <List>
              {searchResults?.slice(0, 10)?.map((result) => (
                <ListItem>
                  <ListItemText primary={result.item.name} secondary={result.item.wcaId} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper style={{ padding: '1em' }}>Nothing found</Paper>
          )}
        </Paper>
      </Box>
    </>
  );
}

export default CommandPromptDialog;
