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
import { Person } from '@wca/helpers';
import { findGroupActivitiesByRound, parseActivityCode } from '../lib/activities';
import { byName } from '../lib/utils';
import { AppState } from '../store/initialState';

interface PersonsAssignmentsDialogProps {
  open: boolean;
  onClose: () => void;
  roundId: string;
  persons: Person[];
}

const PersonsAssignmentsDialog = ({ open, onClose, roundId, persons }: PersonsAssignmentsDialogProps) => {
  const wcif = useSelector((state: AppState) => state.wcif);

  if (!wcif) return null;

  const groupActivities = findGroupActivitiesByRound(wcif, roundId);

  const personAssignmentsInRound = useCallback(
    (person: Person) =>
      (person.assignments || []).filter((assignment) =>
        groupActivities.find((activity) => activity.id === assignment.activityId)
      ),
    [groupActivities]
  );

  const activitiesByPersonAndAssignmentCode = useCallback(
    (person: Person, assignmentCode: string) =>
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
                    .filter(Boolean)
                    .map(
                      (activity: any) =>
                        `${activity.parent.room.name}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'staff-scrambler')
                    .filter(Boolean)
                    .map(
                      (activity: any) =>
                        `${activity.parent.room.name}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'staff-judge')
                    .filter(Boolean)
                    .map(
                      (activity: any) =>
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
