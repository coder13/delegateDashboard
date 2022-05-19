import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { flatten } from "../../../lib/utils";
import { rooms, byGroupNumber, parseActivityCode, roomByActivity } from "../../../lib/activities";
import { isOrganizerOrDelegate } from "../../../lib/persons";
import { addPersonAssignment, removePersonAssignment } from "../../../store/actions";

const ConfigureScramblersDialog = ({ open, onClose, activityCode, groups }) => {
  const wcif = useSelector((state) => state.wcif);
  const groupsRooms = rooms(wcif)
    .filter((room) => (
      flatten(room.activities.map((activity) => activity.childActivities))
        .some((activity) => groups.find((g) => g.id === activity.id))
    ));
  const dispatch = useDispatch();

  const { eventId } = parseActivityCode(activityCode);

  const compStaff = wcif.persons
    .filter((p) => (
      isOrganizerOrDelegate(p) ||
      (p.roles.some((r) => r.indexOf('staff') > -1) && p.registration.eventIds.indexOf(eventId) > -1))
    )
    .map((person) => ({
      ...person,
      pr: person.personalBests.find(
        (pb) => pb.eventId === eventId && pb.type === 'average'
      )?.best,
    }))
    .sort((a, b) => a.pr - b.pr);

  const getAssignmentForPersonGroup = (registrantId, activityId) => {
    const assignments = compStaff.find((p) => p.registrantId === registrantId).assignments;
    return assignments.some((a) => a.activityId === activityId && a.assignmentCode === 'staff-scrambler');
  }

  const handleUpdateAssignmentForPerson = (registrantId, activityId) => (e) => {
    console.log(39, e.target.checked, registrantId, activityId);
    if (e.target.checked) {
      dispatch(addPersonAssignment(registrantId, {
        activityId,
        assignmentCode: 'staff-scrambler',
      }));
    } else {
      dispatch(removePersonAssignment(registrantId, activityId));
    }
  };

  const sortedGroups = groups.sort

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl">
      <DialogTitle>Configuring Staff For {activityCode}</DialogTitle>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell></TableCell>
            {groupsRooms.map((room, index) => (
              <TableCell key={room.id} style={{ textAlign: 'center' }} colSpan={6}>{room.name}</TableCell>
            ))}
            <TableCell></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Average</TableCell>
            {groupsRooms.map((room, index) => (
              groups.filter((group) => group.parent.room.name === room.name).map((group, index) => (
                <TableCell key={group.id} style={{ textAlign: 'center' }}>Group {parseActivityCode(group.activityCode).groupNumber}</TableCell>
              ))
            ))}
            <TableCell>Total Group Assignments</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {compStaff.map((person) => (
            <TableRow hover key={person.registrantId}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.pr}</TableCell>
              {groupsRooms.map((room, index) => (
                groups.filter((group) => group.parent.room.name === room.name).map((group, index) => (
                  <TableCell key={group.id}>
                    <Checkbox
                      checked={getAssignmentForPersonGroup(person.registrantId, group.id)}
                      onChange={handleUpdateAssignmentForPerson(person.registrantId, group.id)}
                    />
                  </TableCell>
                ))
              ))}
              <TableCell>{0}</TableCell>
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
