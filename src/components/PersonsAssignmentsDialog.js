import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { groupActivitiesByRound, parseActivityCode } from '../lib/activities';
import { byName } from '../lib/utils';

const PersonsAssignmentsDialog = ({ open, onClose, roundId, persons }) => {
  const wcif = useSelector((state) => state.wcif);

  const groupActivities = groupActivitiesByRound(wcif, roundId);

  const personAssignmentsInRound = useCallback(
    (person) =>
      person.assignments.filter((assignment) =>
        groupActivities.find((activity) => activity.id === assignment.activityId)
      ),
    [groupActivities]
  );

  const activitiesByPersonAndAssignmentCode = useCallback(
    (person, assignmentCode) =>
      personAssignmentsInRound(person)
        .filter((assignment) => assignment.assignmentCode === assignmentCode)
        .map(({ activityId }) => groupActivities.find(({ id }) => id === activityId)),
    [groupActivities, personAssignmentsInRound]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Assignments</DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Competeting</TableCell>
              <TableCell>Scrambling</TableCell>
              <TableCell>Judging</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {persons.sort(byName).map((person) => (
              <TableRow key={person.registrantId}>
                <TableCell>{person.name}</TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'competitor')
                    .map(
                      (activity) =>
                        `${activity.parent.room.name}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'staff-scrambler')
                    .map(
                      (activity) =>
                        `${activity.parent.room.name}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'staff-judge')
                    .map(
                      (activity) =>
                        `${activity.parent.room.name}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
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

export default PersonsAssignmentsDialog;
