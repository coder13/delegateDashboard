import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Avatar from '@mui/material/Avatar';
import grey from '@mui/material/colors/grey';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing(1),
  },
  input: {
    padding: theme.spacing(1),
  },
  stationInput: {
    width: theme.spacing(10),
  },
  editing: {
    backgroundColor: grey[50],
  },
  submit: {
    display: 'none',
  },
  grabCursor: {
    cursor: 'grab',
  },
  avatar: ({ stage }) => ({
    backgroundColor: (stage && stage.name) || 'white',
    width: theme.spacing(4),
    height: theme.spacing(4),
  }),
  divider: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  }
}))

const EditableStageInput = (({ stage = {}, ...props }) => {
  const classes = useStyles({ stage });
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(stage.name || '');
  const [stations, setStations] = React.useState(stage.stations || 1);

  const cancel = () => {
    setName(stage.name || '');
    setStations(stage.stations || 0)
  };

  const handleStationsChange = (e) => {
    if (e.target.value > 0) {
      setStations(+e.target.value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      e.preventDefault();
      cancel();
    }
  }

  const handleClickAway = () => {
    cancel();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (props.onSubmit && name && stations) {
      props.onSubmit({
        id: stage.id,
        name,
        stations,
      });
    }
    setEditing(false);
  };

  return (
    <ClickAwayListener
      onClickAway={handleClickAway}
    >
      <Box
        onClick={() => setEditing(true)}
        component="form"
        onSubmit={onSubmit}
        noValidate
        autoComplete="off"
        className={clsx(classes.root, {
          [classes.grabCursor]: !editing,
          [classes.editing]: editing,
        })}
      >
        <InputBase
          label="name"
          placeholder="blue"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={!editing}
          className={classes.input}
        />
        <Divider
          orientation="vertical"
          flexItem
          className={classes.divider}
        />
        <InputBase
          label="stations"
          placeholder="8"
          type="number"
          value={stations}
          onChange={handleStationsChange}
          onKeyDown={handleKeyDown}
          readOnly={!editing}
          className={clsx(classes.input, classes.stationInput)}
        />
        {stage.name &&
          <Box
            ml={2}
          >
            <Avatar
              className={classes.avatar}
            >
              {stage.name[0]}
            </Avatar>
          </Box>
        }
        <Button type="submit" className={classes.submit}/>
      </Box>
    </ClickAwayListener>
  );
});

export default EditableStageInput;
