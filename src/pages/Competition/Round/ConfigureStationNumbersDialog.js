import { formatCentiseconds } from '@wca/helpers';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import { activityCodeIsChild, parseActivityCode, roomByActivity } from '../../../lib/activities';
import { getSeedResult } from '../../../lib/persons';
import { selectPersonsAssignedForRound, selectActivityById } from '../../../store/selectors';

const ConfigureStationNumbersDialog = ({ open, onClose, activityCode }) => {
  const wcif = useSelector((state) => state.wcif);
  // const dispatch = useDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getActivityFromId = useSelector((state) => selectActivityById(state));

  const personsAssigned = useSelector((state) =>
    selectPersonsAssignedForRound(state, activityCode)
  );

  const personsAssignedToCompete = useMemo(
    () =>
      personsAssigned
        .map((p) => ({
          ...p,
          assignment: p.assignments
            .map((a) => {
              const activity = getActivityFromId(a.activityId);

              if (!activity?.activityCode) {
                return a;
              }

              return {
                ...a,
                activity,
                room: roomByActivity(wcif, a.activityId),
                groupNumber: parseActivityCode(activity.activityCode).groupNumber,
              };
            })
            .find(
              ({ assignmentCode, activity }) =>
                assignmentCode === 'competitor' &&
                activityCodeIsChild(activityCode)(activity.activityCode)
            ),
        }))
        .filter((p) => Boolean(p.assignment)),
    [activityCode, getActivityFromId, personsAssigned, wcif]
  );

  const rows = personsAssignedToCompete.map(({ assignment, ...person }) => ({
    id: person.registrantId,
    name: person.name,
    seedResult: getSeedResult(wcif, activityCode, person),
    roomName: assignment.room.name,
    groupNumber: assignment.groupNumber,
    stationNumber: assignment.stationNumber,
  }));

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, editable: false },
    { field: 'roomName', headerName: 'Room', flex: 0.75, hideable: true, editable: false },
    { field: 'groupNumber', headerName: 'Group', flex: 0.5, editable: false, type: 'number' },
    {
      field: 'seedResult',
      headerName: 'Seed',
      flex: 0.5,
      editable: false,
      valueFormatter: ({ value }) =>
        value?.rankingResult ? formatCentiseconds(value.rankingResult) : '-',
      sortComparator: (a, b) =>
        (b?.ranking || Number.MAX_SAFE_INTEGER) - (a?.ranking || Number.MAX_SAFE_INTEGER),
      type: 'number',
    },
    {
      field: 'stationNumber',
      headerName: 'Station Number',
      flex: 0.5,
      type: 'number',
      editable: true,
    },
  ];

  const arbitrarilyAssignStationNumbers = () => {};

  const Toolbar = () => (
    <GridToolbarContainer>
      <Button variant="contained" onClick={arbitrarilyAssignStationNumbers}>
        Arbitrarily Assign Station Numbers
      </Button>
    </GridToolbarContainer>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Configuring Station Numbers {activityCode}</DialogTitle>
      <DialogContent sx={{ height: '80vh', p: 0 }}>
        <DataGrid
          rows={rows}
          experimentalFeatures={{ newEditingApi: true }}
          columns={columns}
          components={{ Toolbar }}
          componentsProps={{ Toolbar: { p: 2 } }}
        />
      </DialogContent>
      <DialogActions style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <Button onClick={onClose}>Close</Button>{' '}
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureStationNumbersDialog;
