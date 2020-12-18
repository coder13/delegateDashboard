import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
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

  const editStage = (stage, index) => {
    setStages(stages.map((s, i) => i === index ? stage : s));
    console.log(stages);
  }

  const handleSave = () => {
    handleClose();
    handleSaveStages(stages);
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
        <EditableStageInput key={stage.id} stage={stage} onSubmit={(s) => editStage(s, index)}/>
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
