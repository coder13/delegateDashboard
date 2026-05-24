import { AssignmentsMap } from '../config/assignments';
import type { ActivityWithParent } from '../lib/domain/types';
import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { parseActivityCode, type Person } from '@wca/helpers';

const trackedAssignments = [
  { assignmentCode: 'competitor', label: 'Competitor' },
  { assignmentCode: 'staff-scrambler', label: 'Scrambler' },
  { assignmentCode: 'staff-runner', label: 'Runner' },
  { assignmentCode: 'staff-judge', label: 'Judge' },
] as const;

type TrackedAssignmentCode = (typeof trackedAssignments)[number]['assignmentCode'];

type AssignmentCountRow = {
  groupId: number;
  stageName: string;
  groupNumber: number | string;
  counts: Record<TrackedAssignmentCode, number>;
};

type StageHeader = {
  id: number;
  name: string;
  groups: AssignmentCountRow[];
};

const emptyCounts = () =>
  trackedAssignments.reduce(
    (counts, { assignmentCode }) => ({
      ...counts,
      [assignmentCode]: 0,
    }),
    {} as Record<TrackedAssignmentCode, number>
  );

const buildAssignmentCountRows = (
  groups: ActivityWithParent[],
  persons: Person[]
): AssignmentCountRow[] =>
  groups.map((group) => {
    const counts = emptyCounts();
    const groupAssignments = persons.flatMap((person) =>
      (person.assignments ?? []).filter((assignment) => assignment.activityId === group.id)
    );

    for (const assignment of groupAssignments) {
      if (assignment.assignmentCode in counts) {
        counts[assignment.assignmentCode as TrackedAssignmentCode] += 1;
      }
    }

    return {
      groupId: group.id,
      stageName: group.parent.room.name,
      groupNumber: parseActivityCode(group.activityCode).groupNumber ?? '-',
      counts,
    };
  });

const buildStageHeaders = (rows: AssignmentCountRow[]) =>
  rows.reduce<StageHeader[]>((headers, row) => {
    const header = headers.find((candidate) => candidate.name === row.stageName);
    if (header) {
      header.groups.push(row);
      return headers;
    }

    return [
      ...headers,
      {
        id: row.groupId,
        name: row.stageName,
        groups: [row],
      },
    ];
  }, []);

interface RoundAssignmentCountsTableProps {
  groups: ActivityWithParent[];
  persons: Person[];
}

export const RoundAssignmentCountsTable = ({
  groups,
  persons,
}: RoundAssignmentCountsTableProps) => {
  const rows = buildAssignmentCountRows(groups, persons);
  const stageHeaders = buildStageHeaders(rows);
  const totalsByAssignment = rows.reduce((totalCounts, row) => {
    for (const { assignmentCode } of trackedAssignments) {
      totalCounts[assignmentCode] += row.counts[assignmentCode];
    }

    return totalCounts;
  }, emptyCounts());

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader title="Assignment Counts" />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              {stageHeaders.map((stage) => (
                <TableCell
                  key={stage.id}
                  align="center"
                  colSpan={stage.groups.length}
                  sx={{ fontWeight: 600 }}>
                  {stage.name}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Assignment</TableCell>
              {rows.map((row) => (
                <TableCell key={row.groupId} align="center" sx={{ fontWeight: 600 }}>
                  g{row.groupNumber}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trackedAssignments.map(({ assignmentCode, label }) => (
              <TableRow
                key={assignmentCode}
                sx={{ backgroundColor: alpha(AssignmentsMap[assignmentCode].color[200], 0.5) }}>
                <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
                {rows.map((row) => (
                  <TableCell key={row.groupId} align="center">
                    {row.counts[assignmentCode]}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {totalsByAssignment[assignmentCode]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
