import type { DialogProps } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import type { ReactNode } from 'react';

export interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  fullScreen?: boolean;
  closeButtonText?: string;
}

/**
 * Base Dialog component with standardized structure
 * Provides common Dialog/DialogTitle/DialogContent/DialogActions layout
 */
export const BaseDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  closeButtonText = 'Close',
}: BaseDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        {actions || <Button onClick={onClose}>{closeButtonText}</Button>}
      </DialogActions>
    </Dialog>
  );
};
