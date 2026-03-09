import { useState, useCallback } from 'react';
import type { MouseEvent } from 'react';

/**
 * Hook for managing Material-UI Menu anchor state
 * @returns Object with anchorEl, open boolean, handleOpen, and handleClose functions
 */
export const useMenuState = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);

  return {
    anchorEl,
    open,
    handleOpen,
    handleClose,
    setAnchorEl,
  };
};
