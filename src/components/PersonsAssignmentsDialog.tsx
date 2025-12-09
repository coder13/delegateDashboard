import { findGroupActivitiesByRound, parseActivityCode } from '../lib/domain/activities';
import { byName } from '../lib/utils/utils';
import { useAppSelector } from '../store';
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
import { type Person } from '@wca/helpers';
import { useCallback, useMemo } from 'react';

interface PersonsAssignmentsDialogProps {
  open: boolean;
  onClose: () => void;
  roundId: string;
  persons: Person[];
}

const PersonsAssignmentsDialog = ({
  open,
  onClose,
  roundId,
  persons,
}: PersonsAssignmentsDialogProps) => {
  const wcif = useAppSelector((state) => state.wcif);

  const groupActivities = useMemo(
    () => (wcif ? findGroupActivitiesByRound(wcif, roundId) : []),
    [wcif, roundId]
  );

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
        .map(({ activityId }) => groupActivities.find(({ id }) => id === activityId))
        .filter((activity) => activity !== undefined),
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
                        `${(activity as any).parent?.room?.name || 'Unknown'}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'staff-scrambler')
                    .map(
                      (activity) =>
                        `${(activity as any).parent?.room?.name || 'Unknown'}: ${
                          parseActivityCode(activity.activityCode).groupNumber
                        }`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {activitiesByPersonAndAssignmentCode(person, 'staff-judge')
                    .map(
                      (activity) =>
                        `${(activity as any).parent?.room?.name || 'Unknown'}: ${
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
