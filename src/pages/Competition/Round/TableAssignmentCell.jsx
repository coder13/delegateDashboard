// Shows a Table Cell for configuring an assignment
import { TableCell } from '@mui/material';
import { styled } from '@mui/system';
import { AssignmentsMap } from '../../../config/assignments';

const TableButton = styled(TableCell, { shouldForwardProp: (prop) => prop !== 'assignmentColor' })(
  ({ theme, assignmentColor }) => `
  text-align: center;
  vertical-align: middle;
  font-size: 1em;
  padding: 0;
  border-left: 1px dashed ${theme.palette.divider};
  border-right: 1px dashed ${theme.palette.divider};
  border-bottom: 1px solid ${theme.palette.divider};
  border-radius: 0px;
  transition: ${theme.transitions.create(['background-color'], {
    easing: theme.transitions.easeInOut,
    duration: theme.transitions.duration.shortest,
  })};
  ${assignmentColor ? `background-color: ${assignmentColor[200]};` : ''}
  cursor: pointer;
  
  &:hover {
    filter: brightness(95%);
  }
`
);

// for a person and a group.
function TableAssignmentCell({ value, onClick }) {
  return (
    <TableButton
      onMouseEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.bubbles = false;
        if (e.buttons === 1) {
          onClick();
        }
      }}
      onMouseDown={(e) => {
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
