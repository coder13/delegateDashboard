import { getUser, searchUsers } from '../lib/api';
import {
  Autocomplete,
  Avatar,
  FormControl,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  debounce,
} from '@mui/material';
import { Fragment, useEffect, useMemo, useState } from 'react';

export type User = {
  id: number;
  name: string;
  delegate_status: string | null;
  wca_id: string | null;
  country_iso2: string | null;
  country?: {
    id: string;
    name: string;
    continentId: string;
    iso2: string;
  };
  avatar: {
    url: string;
    thumb_url: string;
  };
};

export default function PersonSearchField({
  value,
  setValue,
}: {
  value: User | null;
  setValue: (user: User | null) => void;
}) {
  // const wcif = useAppSelector((state) => state.wcif);
  // const persons = wcif?.persons;
  // const userIds = persons?.map((i) => i.wcaUserId);
  const [userInput, setUserInput] = useState('');
  const [autoCompleteOpen, setAutoCompleteOpen] = useState(false);
  const [options, setOptions] = useState<readonly User[]>([]);

  const fetch = useMemo(
    () =>
      debounce((request: { input: string }, callback: (results?: readonly User[]) => void) => {
        if (isNaN(Number(request.input))) {
          searchUsers(request.input).then((data) => {
            callback(data.result as User[]);
          });
        } else {
          // fetch by user id
          getUser(Number(request.input)).then((data) => {
            callback([data.user as User]);
          });
        }
      }, 400),
    []
  );

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  useEffect(() => {
    let active = true;

    if (userInput === '') {
      setOptions(value ? [value] : []);
      return;
    }

    fetch({ input: userInput }, (results?: readonly User[]) => {
      if (active) {
        let newOptions: readonly User[] = [];

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions); //.filter((p) => !userIds?.includes(p.id)));
      }
    });

    return () => {
      active = false;
    };
  }, [value, userInput, fetch]);

  return (
    <FormControl fullWidth>
      <Autocomplete
        open={autoCompleteOpen}
        onOpen={() => {
          setAutoCompleteOpen(true);
        }}
        onClose={() => {
          setAutoCompleteOpen(false);
        }}
        autoComplete
        filterOptions={(x) => x}
        noOptionsText="No Users Found"
        options={options}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.name}
        value={value}
        onChange={(_, newValue: User | null) => {
          setOptions(newValue ? [...options] : options);
          setValue(newValue);
        }}
        onInputChange={(_, e) => {
          setUserInput(e);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="User Search"
            InputProps={{
              ...params.InputProps,
              endAdornment: <Fragment>{params.InputProps.endAdornment}</Fragment>,
            }}
          />
        )}
        renderOption={(props, option) => {
          return (
            <ListItem {...props}>
              <ListItemAvatar>
                <Avatar src={option.avatar.thumb_url} />
              </ListItemAvatar>
              <ListItemText
                primary={`${option.name}${option.wca_id ? ` (${option.wca_id})` : ''}`}
                secondary={option.country?.name}
              />
            </ListItem>
          );
        }}
      />
    </FormControl>
  );
}
