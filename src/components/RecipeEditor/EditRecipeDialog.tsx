import { Round, activityCodeToName } from '@wca/helpers';
import { useState } from 'react';
import { Add, MoreVert } from '@mui/icons-material';
import {
  Avatar,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { AssignmentStep, RecipeConfig, Step, StepLibrary } from '../../lib/recipes';
import { EditStepDialog } from './EditStepDialog';

interface EditRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  recipeConfig: RecipeConfig;
  round: Round;
}

export const EditRecipeDialog = ({ open, onClose, recipeConfig, round }: EditRecipeDialogProps) => {
  const [selectedStep, setSelectedStep] = useState<Step | undefined>(undefined);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>
          Editing Recipe {recipeConfig.name} for {activityCodeToName(round.id)}
        </DialogTitle>
        <DialogContent>
          <List>
            {recipeConfig.steps.map((step, index) => {
              const stepDefinition = StepLibrary[step.id];
              if (!stepDefinition) {
                return null;
              }

              return (
                <ListItem
                  key={step.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => setSelectedStep(step)}>
                      <MoreVert />
                    </IconButton>
                  }>
                  <ListItemAvatar>
                    <Avatar>{index + 1}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={stepDefinition.name} />
                </ListItem>
              );
            })}
            <ListItemButton>
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText primary="Add step" />
            </ListItemButton>
          </List>
          <Divider />
        </DialogContent>
      </Dialog>
      <EditStepDialog
        step={selectedStep as AssignmentStep}
        onClose={() => setSelectedStep(undefined)}
        round={round}
      />
    </>
  );
};
