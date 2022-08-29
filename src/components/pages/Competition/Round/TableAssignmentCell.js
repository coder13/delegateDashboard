// Shows a Table Cell for configuring an assignment
import { TableCell } from '@mui/material';
import { yellow, blue, green, red, grey } from '@mui/material/colors';
import { styled } from '@mui/system';

const assignmentMap = {
  competitor: {
    letter: 'C',
    color: green,
  },
  'staff-judge': {
    letter: 'J',
    color: blue,
  },
  'staff-scrambler': {
    letter: 'S',
    color: yellow,
  },
  'staff-runner': {
    letter: 'R',
    color: red,
  },
  'staff-other': {
    letter: 'O',
    color: grey,
  },
};

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
    <TableButton onClick={onClick} assignmentColor={value && assignmentMap[value]?.color}>
      {value && assignmentMap[value]?.letter}
    </TableButton>
  );
}

export default TableAssignmentCell;
