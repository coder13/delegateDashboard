import { formatCentiseconds } from '@wca/helpers';
import { useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import { activityCodeIsChild, parseActivityCode, roomByActivity } from '../../../lib/activities';
import { getSeedResult } from '../../../lib/persons';
import { bulkUpsertPersonAssignments, upsertPersonAssignments } from '../../../store/actions';
import { selectPersonsAssignedForRound, selectActivityById } from '../../../store/selectors';

const ConfigureStationNumbersDialog = ({ open, onClose, activityCode }) => {
  const wcif = useSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);
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
                activityCodeIsChild(activityCode, activity.activityCode)
            ),
        }))
        .filter((p) => Boolean(p.assignment)),
    [activityCode, getActivityFromId, personsAssigned, wcif]
  );

  const rows = personsAssignedToCompete.map(({ assignment, ...person }) => ({
    id: person.registrantId,
    assignment: assignment,
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

  const arbitrarilyAssignStationNumbers = () => {
    const newAssignments = [];
    const lastStationNumberMap = new Map();

    for (let i = 0; i < personsAssignedToCompete.length; i++) {
      const groupId = personsAssignedToCompete[i].assignment.activity.id;
      const stationNumber = lastStationNumberMap.get(groupId) || 1;

      newAssignments.push({
        registrantId: personsAssignedToCompete[i].registrantId,
        activityId: groupId,
        assignment: {
          assignmentCode: 'competitor',
          stationNumber: stationNumber,
        },
      });

      lastStationNumberMap.set(groupId, stationNumber + 1);
    }

    dispatch(bulkUpsertPersonAssignments(newAssignments));
  };

  const resetStationNumbers = () => {
    dispatch(
      bulkUpsertPersonAssignments(
        personsAssignedToCompete.map(({ registrantId, assignment }) => ({
          registrantId,
          activityId: assignment.activity.id,
          assignment: {
            assignmentCode: 'competitor',
            stationNumber: null,
          },
        }))
      )
    );
  };

  const handleCellEditStop = ({ row }, event) => {
    const stationNumber = parseInt(event?.target?.value, 10);
    if (stationNumber) {
      dispatch(
        upsertPersonAssignments(row.id, [
          {
            activityId: row.assignment.activityId,
            assignmentCode: row.assignment.assignmentCode,
            stationNumber: parseInt(event.target.value, 10),
          },
        ])
      );
    }
  };

  const Toolbar = () => (
    <GridToolbarContainer>
      <Button sx={{ m: 1 }} variant="contained" onClick={arbitrarilyAssignStationNumbers}>
        Arbitrarily Assign Station Numbers
      </Button>
      <div style={{ display: 'flex', flexGrow: 1 }} />
      <Button sx={{ m: 1 }} variant="contained" color="error" onClick={resetStationNumbers}>
        Reset Station Numbers
      </Button>
    </GridToolbarContainer>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Configuring Station Numbers {activityCode}</DialogTitle>
      <DialogContent sx={{ height: '80vh', p: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          components={{ Toolbar }}
          componentsProps={{ Toolbar: { p: 2 } }}
          ref={dataGridRef}
          experimentalFeatures={{ newEditingApi: true }}
          onCellEditStop={handleCellEditStop}
        />
      </DialogContent>
      <DialogActions style={{ display: 'flex' }}>
        <Typography>
          Assigns station numbers in order of registration ID (i.e. first registered person). Column
          sorting does nothing.
        </Typography>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <Button onClick={onClose}>Close</Button>{' '}
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureStationNumbersDialog;
