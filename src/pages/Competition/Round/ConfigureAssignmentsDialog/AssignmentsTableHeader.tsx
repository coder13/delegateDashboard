import { parseActivityCode, type ActivityWithRoom } from '../../../../lib/domain/activities';
import type { AssignmentsTableHeaderProps } from './types';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { memo } from 'react';

const AssignmentsTableHeader = memo(
  ({ groupsRooms, groups, activityCode }: AssignmentsTableHeaderProps) => {
    return (
      <TableHead>
        <TableRow>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          {groupsRooms.map((room) => (
            <TableCell
              key={room.id}
              style={{ textAlign: 'center' }}
              colSpan={
                room.activities.find((ra) => ra.activityCode === activityCode)?.childActivities
                  ?.length ?? 1
              }>
              {room.name}
            </TableCell>
          ))}
          <TableCell></TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ width: '1em' }}>#</TableCell>
          <TableCell style={{ width: '20%' }}>Name</TableCell>
          <TableCell style={{ width: '1em' }}>Age</TableCell>
          <TableCell style={{ width: '1em', textAlign: 'center' }}>Seed Result</TableCell>
          <TableCell style={{ width: '1em', textAlign: 'center' }}>Registered</TableCell>
          {groupsRooms.map((room) =>
            groups
              .filter((group) => (group.parent as ActivityWithRoom).room.name === room.name)
              .map((group) => (
                <TableCell key={group.id} style={{ textAlign: 'center', width: '1em' }}>
                  g{parseActivityCode(group.activityCode).groupNumber}
                </TableCell>
              ))
          )}
          <TableCell style={{ width: '1em' }}>Stream</TableCell>
          <TableCell style={{ width: '1em' }}>Total Staff Assignments</TableCell>
        </TableRow>
      </TableHead>
    );
  }
);

AssignmentsTableHeader.displayName = 'AssignmentsTableHeader';

export default AssignmentsTableHeader;
