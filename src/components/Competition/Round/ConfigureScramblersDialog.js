import { useDispatch, useSelector } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { rooms, parseActivityCode } from '../../../lib/activities';
import { isOrganizerOrDelegate } from '../../../lib/persons';
import { formatCentiseconds } from '../../../lib/result';
import { flatten } from '../../../lib/utils';
import { addPersonAssignment, removePersonAssignment } from '../../../store/actions';

const ConfigureScramblersDialog = ({ open, onClose, activityCode, groups }) => {
  const wcif = useSelector((state) => state.wcif);
  const groupsRooms = rooms(wcif).filter((room) =>
    flatten(room.activities.map((activity) => activity.childActivities)).some((activity) =>
      groups.find((g) => g.id === activity.id)
    )
  );
  const dispatch = useDispatch();

  const { eventId } = parseActivityCode(activityCode);

  const compStaff = wcif.persons
    .filter(
      (p) =>
        isOrganizerOrDelegate(p) ||
        (p.roles.some((r) => r.indexOf('staff') > -1) &&
          p.registration.eventIds.indexOf(eventId) > -1)
    )
    .map((person) => ({
      ...person,
      pr: person.personalBests.find((pb) => pb.eventId === eventId && pb.type === 'average')?.best,
    }))
    .sort((a, b) => (a.pr || Number.MAX_VALUE) - (b.pr || Number.MAX_VALUE));

  const getAssignmentForPersonGroup = (registrantId, activityId) => {
    const assignments = compStaff.find((p) => p.registrantId === registrantId).assignments;
    return assignments.some(
      (a) => a.activityId === activityId && a.assignmentCode === 'staff-scrambler'
    );
  };

  const handleUpdateAssignmentForPerson = (registrantId, activityId) => (e) => {
    if (e.target.checked) {
      dispatch(
        addPersonAssignment(registrantId, {
          activityId,
          assignmentCode: 'staff-scrambler',
        })
      );
    } else {
      dispatch(removePersonAssignment(registrantId, activityId));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl">
      <DialogTitle>Configuring Staff For {activityCode}</DialogTitle>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            {groupsRooms.map((room, index) => (
              <TableCell
                key={room.id}
                style={{ textAlign: 'center' }}
                colSpan={groups.length / groupsRooms.length}>
                {room.name}
              </TableCell>
            ))}
            <TableCell></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Average</TableCell>
            <TableCell>Registered</TableCell>
            {groupsRooms.map((room, index) =>
              groups
                .filter((group) => group.parent.room.name === room.name)
                .map((group, index) => (
                  <TableCell key={group.id} style={{ textAlign: 'center' }}>
                    Group {parseActivityCode(group.activityCode).groupNumber}
                  </TableCell>
                ))
            )}
            <TableCell>Total Group Assignments</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {compStaff.map((person) => (
            <TableRow hover key={person.registrantId}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{formatCentiseconds(person.pr)}</TableCell>
              <TableCell>
                {person.registration.eventIds.indexOf(eventId) > -1 ? <CheckIcon /> : ''}
              </TableCell>
              {groupsRooms.map((room, index) =>
                groups
                  .filter((group) => group.parent.room.name === room.name)
                  .map((group, index) => (
                    <TableCell key={group.id}>
                      <Checkbox
                        checked={getAssignmentForPersonGroup(person.registrantId, group.id)}
                        onChange={handleUpdateAssignmentForPerson(person.registrantId, group.id)}
                      />
                    </TableCell>
                  ))
              )}
              <TableCell>
                {person.assignments.filter((a) => a.assignmentCode.indexOf('staff-') > -1).length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureScramblersDialog;
