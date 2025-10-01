// Shows a Table Cell for configuring an assignment
import { TableCell } from '@mui/material';
import { styled, Theme } from '@mui/system';
import { AssignmentsMap } from '../../../config/assignments';

const TableButton = styled(TableCell, { shouldForwardProp: (prop) => prop !== 'assignmentColor' })<{
  assignmentColor?: any;
}>(
  ({ theme, assignmentColor }: { theme: Theme; assignmentColor?: any }) => `
  text-align: center;
  vertical-align: middle;
  font-size: 1em;
  padding: 0;
  border-left: 1px dashed ${(theme as any).palette.divider};
  border-right: 1px dashed ${(theme as any).palette.divider};
  border-bottom: 1px solid ${(theme as any).palette.divider};
  border-radius: 0px;
  transition: ${(theme as any).transitions.create(['background-color'], {
    easing: (theme as any).transitions.easeInOut,
    duration: (theme as any).transitions.duration.shortest,
  })};
  ${assignmentColor ? `background-color: ${assignmentColor[200]};` : ''}
  cursor: pointer;
  
  &:hover {
    filter: brightness(95%);
  }
`
);

interface TableAssignmentCellProps {
  value?: string;
  onClick: () => void;
}

// for a person and a group.
function TableAssignmentCell({ value, onClick }: TableAssignmentCellProps) {
  return (
    <TableButton
      onMouseEnter={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
        e.bubbles = false;
        if (e.buttons === 1) {
          onClick();
        }
      }}
      onMouseDown={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
        e.bubbles = false;
        onClick();
      }}
      assignmentColor={value && AssignmentsMap[value]?.color}>
      {value && AssignmentsMap[value]?.letter}
    </TableButton>
  );
}

export default TableAssignmentCell;
