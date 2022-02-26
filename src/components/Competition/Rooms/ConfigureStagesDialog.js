import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import EditableStageInput from './EditableStageInput';

const ConfigureStagesDialog = ({ open, handleClose, handleSaveStages, roomName, currentStages = [] }) => {
  const [stages, setStages] = React.useState(currentStages);

  const addStage = ({ name, stations }) => {
    setStages([...stages, {
      id: Math.max(stages.map(i => i.id)) + 1,
      name,
      stations,
    }]);
  }

  const editStage = (stage) => {
    setStages(stages.map(s => s.id === stage.id ? stage : s));
  }

  const onClose = () => {
    setStages(currentStages);
    handleClose();
  }

  const handleSave = () => {
    handleClose();
    handleSaveStages(stages);
  }

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="configure-stages-dial2og"
      open={open}
      maxWidth="md"
      fullWidth={true}
      disableEscapeKeyDown
    >
      <DialogTitle id="configure-stages-dialog">Configuring Stages for <b>{roomName}</b></DialogTitle>
      <DialogContent>
      {stages.map((stage, index) =>
        <EditableStageInput key={stage.id} stage={stage} onSubmit={(s) => editStage(s)}/>
      )}
      <EditableStageInput key={0} onSubmit={addStage}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">Cancel</Button>
        <Button onClick={() => handleSave(stages)} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureStagesDialog;
