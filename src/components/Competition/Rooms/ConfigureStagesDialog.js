import React from 'react';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Avatar from '@material-ui/core/Avatar';
import grey from '@material-ui/core/colors/grey';

const EditableStageInput = withStyles((theme) => ({
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
}))(({ classes, stage = {}, ...props }) => {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(stage.name || '');
  const [stations, setStations] = React.useState(stage.stations || 1);

  const cancel = () => {
    setEditing(false);
    setName(stage.name || '');
    setStations(stage.stations || 0)
  };

  const handleStationsChange = (e) => {
    if (e.target.value > 0) {
      setStations(e.target.value);
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
        name,
        stations,
      })
    }
    cancel();
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

const ConfigureStagesDialog = ({ open, handleClose, handleSave, roomName, currentStages = [] }) => {
  const [stages, setStages] = React.useState(currentStages);

  const addStage = (stage) => {
    setStages([...stages, stage]);
  }

  const editStage = (stage, index) => {
    setStages(stages.map((s, i) => i === index ? stage : s));
  }

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="configure-stages-dial2og"
      open={open}
      maxWidth="md"
      fullWidth={true}
      disableEscapeKeyDown
    >
      <DialogTitle id="configure-stages-dialog">Configuring Stages for <b>{roomName}</b></DialogTitle>
      <DialogContent>
      {stages.map((stage, index) =>
        <EditableStageInput key={index} stage={stage} onSubmit={(s) => editStage(s, index)}/>
      )}
      <EditableStageInput onSubmit={addStage}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">Cancel</Button>
        <Button onClick={handleSave} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureStagesDialog;
