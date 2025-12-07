import { ValidationError, ValidationErrorType, WcifError } from '../../lib/wcif/validation';
import { ValidationErrorRenderer } from './renderers/ValidationErrorRenderer';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface ErrorDialogProps<T extends object> {
  error?: WcifError<T>;
  onClose: () => void;
}

export function ErrorDialog<T extends object>({ error, onClose }: ErrorDialogProps<T>) {
  return (
    <Dialog open={!!error} onClose={onClose}>
      <DialogTitle>{error?.message}</DialogTitle>
      <DialogContent>{error ? <ErrorRenderer error={error} /> : null}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const ErrorRenderer = <T extends object>({ error }: { error: WcifError<T> }) => {
  switch (error.type as ValidationErrorType) {
    case 'person_assignment_schedule_conflict':
      return <ValidationErrorRenderer error={error as ValidationError} />;
    default:
      return <div>No renderer for this error type.</div>;
  }
};
