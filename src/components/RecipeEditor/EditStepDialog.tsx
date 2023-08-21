import { Round } from '@wca/helpers';
import { Constraints } from 'wca-group-generators';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Step, StepLibrary } from '../../lib/recipes';

interface EditStepDialogProps {
  onClose: () => void;
  step?: Step;
  round: Round;
}

export const EditStepDialog = ({ onClose, step, round }: EditStepDialogProps) => {
  const stepDefinition = step && StepLibrary[step?.id];
  console.log(24, step);
  return (
    <Dialog open={!!step} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Editing Step {stepDefinition?.name} for {round.id}
      </DialogTitle>
      <DialogContent>
        <div>{stepDefinition?.description}</div>
        <Typography>Generator: {step?.generator}</Typography>
        <Typography>Cluster: {step?.cluster}</Typography>
        <Typography>Activities: {step?.activities}</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Constraint</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {step?.constraints.map(({ constraint, weight }) => {
              const constraintDef = Constraints[constraint];
              console.log(constraintDef);
              return (
                <TableRow key={constraint}>
                  <TableCell>{constraintDef?.name}</TableCell>
                  <TableCell>{weight}</TableCell>
                  <TableCell>{constraint.options}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};
