import type { TableCellProps } from '@mui/material';
import { TableCell } from '@mui/material';
import type { ReactNode } from 'react';

export interface ClickableTableCellProps extends Omit<TableCellProps, 'onClick'> {
  children: ReactNode;
  onClick: () => void;
}

/**
 * Clickable TableCell with button-like styling
 * Reduces the need for long className strings
 */
export const ClickableTableCell = ({
  children,
  onClick,
  sx,
  ...props
}: ClickableTableCellProps) => {
  return (
    <TableCell
      className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root"
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        ...sx,
      }}
      onClick={onClick}
      {...props}>
      {children}
    </TableCell>
  );
};
