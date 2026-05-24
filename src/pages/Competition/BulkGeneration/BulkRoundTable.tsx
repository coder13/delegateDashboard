import type { BulkRoundRow } from './bulkRoundRows';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Checkbox,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';

interface BulkRoundTableProps {
  rows: BulkRoundRow[];
  selectedRoundIds: Set<string>;
  onToggleRound: (roundId: string) => void;
  onMoveRound: (roundId: string, direction: -1 | 1) => void;
}

export const BulkRoundTable = ({
  rows,
  selectedRoundIds,
  onToggleRound,
  onMoveRound,
}: BulkRoundTableProps) => (
  <TableContainer>
    <Table size="small" aria-label="bulk generation rounds">
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">Generate</TableCell>
          <TableCell>Order</TableCell>
          <TableCell>Event/Round</TableCell>
          <TableCell>Scheduled</TableCell>
          <TableCell align="right">Size</TableCell>
          <TableCell align="right">Groups</TableCell>
          <TableCell align="right">Competitors</TableCell>
          <TableCell align="right">Staff</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={row.roundId} selected={selectedRoundIds.has(row.roundId)}>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedRoundIds.has(row.roundId)}
                disabled={!row.selectable}
                onChange={() => onToggleRound(row.roundId)}
                slotProps={{ input: { 'aria-label': `Select ${row.roundId}` } }}
              />
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Move up">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Move ${row.roundId} up`}
                      disabled={index === 0}
                      onClick={() => onMoveRound(row.roundId, -1)}>
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Move ${row.roundId} down`}
                      disabled={index === rows.length - 1}
                      onClick={() => onMoveRound(row.roundId, 1)}>
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </TableCell>
            <TableCell>{row.label}</TableCell>
            <TableCell>{row.scheduledTime}</TableCell>
            <TableCell align="right">{row.roundSize}</TableCell>
            <TableCell align="right">{row.existingGroupCount}</TableCell>
            <TableCell align="right">
              {row.competitorAssignmentCount} / {row.roundSize}
            </TableCell>
            <TableCell align="right">{row.staffAssignmentCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
