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
import { parseActivityCode } from "../../../lib/activities";
import { addPersonAssignment, removePersonAssignment } from "../../../store/actions";

const ConfigureScramblersDialog = ({ open, onClose, roundActivity }) => {
  const wcif = useSelector((state) => state.wcif);
  const dispatch = useDispatch();

  const { activityCode } = roundActivity;
  const { eventId } = parseActivityCode(activityCode);

  const compStaff = wcif.persons
    .filter((p) => p.roles.some((r) => r.indexOf('staff') > -1))
    .map((person) => ({
      ...person,
      pr: person.personalBests.find(
        (pb) => pb.eventId === eventId && pb.type === 'average'
      )?.best,
    }))
    .sort((a, b) => a.pr - b.pr);
  const groups = roundActivity.childActivities;

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl">
      <DialogTitle>Configuring Staff For {activityCode}</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Average</TableCell>
              {groups.map((group, index) => (
                <TableCell key={group.id} style={{ textAlign: 'center' }}>Group {index + 1}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {compStaff.map((person) => (
              <TableRow key={person.registrantId}>
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.pr}</TableCell>
                {groups.map((group) => (
                  <TableCell key={group.id}>
                    <Checkbox
                      checked={getAssignmentForPersonGroup(person.registrantId, group.id)}
                      onChange={handleUpdateAssignmentForPerson(person.registrantId, group.id)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureScramblersDialog;
