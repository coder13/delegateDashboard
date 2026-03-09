import { useState, useCallback } from 'react';

/**
 * Hook for managing dialog open/close state
 * @returns Object with open state, handleOpen, handleClose, and toggle functions
 */
export const useDialogState = (initialState = false) => {
  const [open, setOpen] = useState(initialState);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return {
    open,
    handleOpen,
    handleClose,
    toggle,
    setOpen,
  };
};
