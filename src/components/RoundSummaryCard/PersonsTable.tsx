import { Person, Round } from '@wca/helpers';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { parseActivityCode } from '../../lib/activities';
import { personsShouldBeInRound } from '../../lib/persons';
import { byName } from '../../lib/utils';
import { getExtensionData } from '../../lib/wcif-extensions';
import { useAppSelector } from '../../store';
import { selectPersonsAssignedForRound } from '../../store/selectors';
import PersonsAssignmentsDialog from '../Dialogs/PersonsAssignmentsDialog';
import PersonsDialog from '../PersonsDialog';

interface PersonsDialogProps {
  open: boolean;
  persons: Person[];
  title?: string;
}

export const PersonsTable = ({ activityCode }) => {
  const { eventId } = parseActivityCode(activityCode);
  const wcif = useAppSelector((state) => state.wcif);
  const [showPersonsDialog, setShowPersonsDialog] = useState<PersonsDialogProps>({
    open: false,
    persons: [],
  });
  const [showPersonsAssignmentsDialog, setShowPersonsAssignmentsDialog] = useState(false);

  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode) as Round;
  const personsInRound = round ? personsShouldBeInRound(round)(wcif.persons) : [];

  const personsAssigned = useAppSelector(selectPersonsAssignedForRound(round.id));

  const groupsData = getExtensionData('groups', round);

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ textAlign: 'center' }}>Round Size</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
              Persons In Round
              <br />
              <Typography variant="caption">Based on WCA-Live data</Typography>
            </TableCell>
            <TableCell sx={{ textAlign: 'center' }}>Assigned Persons</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
              Groups Configured <br />
              (per stage)
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}
              onClick={() =>
                setShowPersonsDialog({
                  open: true,
                  persons: personsInRound?.sort(byName) || [],
                  title: 'People who should be in the round',
                })
              }>
              {personsShouldBeInRound?.length || '???'}
            </TableCell>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}
              onClick={() =>
                setShowPersonsDialog({
                  open: !!round?.results?.length,
                  persons:
                    (
                      round?.results
                        ?.map(({ personId }) =>
                          wcif.persons.find(({ registrantId }) => registrantId === personId)
                        )
                        .filter(Boolean) as Person[]
                    ).sort(byName) || [],
                  title: 'People in the round according to wca-live',
                })
              }>
              {round?.results?.length}
            </TableCell>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}
              onClick={() => setShowPersonsAssignmentsDialog(true)}>
              {personsAssigned.length}
            </TableCell>
            <TableCell sx={{ textAlign: 'center' }}>{groupsData.groups}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PersonsDialog
        open={showPersonsDialog?.open}
        persons={showPersonsDialog?.persons}
        title={showPersonsDialog?.title}
        onClose={() =>
          setShowPersonsDialog({
            open: false,
            title: undefined,
            persons: [],
          })
        }
      />
      {!!round && (
        <PersonsAssignmentsDialog
          open={showPersonsAssignmentsDialog}
          persons={personsInRound}
          roundId={round.id}
          onClose={() => setShowPersonsAssignmentsDialog(false)}
        />
      )}
    </>
  );
};
