import { activityCodeIsChild, parseActivityCode, roomByActivity } from '../../../lib/activities';
import { byPROrResult, getSeedResult } from '../../../lib/persons';
import { bulkUpsertPersonAssignments, upsertPersonAssignments } from '../../../store/actions';
import { selectPersonsAssignedForRound, selectActivityById } from '../../../store/selectors';
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
import { formatCentiseconds } from '@wca/helpers';
import { useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../store/initialState';

const ConfigureStationNumbersDialog = ({ open, onClose, activityCode }: any) => {
  const wcif = useSelector((state: AppState) => state.wcif);

  if (!wcif) return null;
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getActivityFromId = useSelector((state: AppState) => selectActivityById(state));

  const personsAssigned = useSelector((state: AppState) =>
    selectPersonsAssignedForRound(state, activityCode)
  );

  const { eventId, roundNumber } = parseActivityCode(activityCode);

  const event = wcif.events.find((e) => e.id === eventId);

  const personsAssignedToCompeteOrJudge = useMemo(
    () =>
      personsAssigned
        .flatMap((p) => {
          const assigments = (p.assignments || [])
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
            .filter(({ activity }) => activityCodeIsChild(activityCode, activity.activityCode));

          const competitorAssignment = assigments.find(
            ({ assignmentCode }) => assignmentCode === 'competitor'
          );

          const judgeAssignment = assigments.find(({ assignmentCode }) =>
            assignmentCode.includes('judge')
          );

          let a = [];

          if (competitorAssignment) {
            a.push({
              ...p,
              assignment: competitorAssignment,
              seedResult: getSeedResult(wcif, activityCode, p),
            });
          }

          if (judgeAssignment) {
            a.push({
              ...p,
              assignment: judgeAssignment,
            });
          }

          return a;

          // return {
          //   ...p,
          //   seedResult: getSeedResult(wcif, activityCode, p),
          //   assignment: (p.assignments || [])
          //     .map((a) => {
          //       const activity = getActivityFromId(a.activityId);

          //       if (!activity?.activityCode) {
          //         return a;
          //       }

          //       return {
          //         ...a,
          //         activity,
          //         room: roomByActivity(wcif, a.activityId),
          //         groupNumber: parseActivityCode(activity.activityCode).groupNumber,
          //       };
          //     })
          //     .find(
          //       ({ assignmentCode, activity }) =>
          //         ['competitor', 'staff-judge'].includes(assignmentCode) &&
          //         activityCodeIsChild(activityCode, activity.activityCode)
          //     ),
          // };
        })
        .filter((p) => Boolean(p.assignment)),
    [activityCode, getActivityFromId, personsAssigned, wcif]
  ).sort((a, b) => {
    if (
      a.assignment.assignmentCode &&
      b.assignment.assignmentCode &&
      a.assignment.assignmentCode !== b.assignment.assignmentCode
    ) {
      return a.assignment.assignmentCode.localeCompare(b.assignment.assignmentCode);
      // const isACompetitor = a.assignment.assignmentCode === 'competitor';
      // const isBCompetitor = b.assignment.assignmentCode === 'competitor';
      // if (isACompetitor !== isBCompetitor) {
      //   return isACompetitor ? -1 : 1;
      // }
    }

    return byPROrResult(event, roundNumber)(a, b);
  });

  console.log(personsAssignedToCompeteOrJudge);

  const rows = personsAssignedToCompeteOrJudge.map(({ assignment, seedResult, ...person }) => ({
    id: person.registrantId,
    assignment: assignment,
    assignmentCode: assignment.assignmentCode,
    name: person.name,
    seedResult,
    roomName: assignment.room.name,
    groupNumber: assignment.groupNumber,
    stationNumber: assignment.stationNumber,
  }));

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, editable: false },
    { field: 'assignmentCode', headerName: 'AssignmentCode', flex: 1, editable: false },
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

  const arbitrarilyAssignStationNumbers = (assignmentCode) => {
    const newAssignments = [];
    const lastStationNumberMap = new Map();
    const personsAssignedForCode = personsAssignedToCompeteOrJudge.filter(
      ({ assignment }) => assignment.assignmentCode === assignmentCode
    );

    for (let i = 0; i < personsAssignedForCode.length; i++) {
      const groupId = personsAssignedForCode[i].assignment.activity.id;
      const stationNumber = lastStationNumberMap.get(groupId) || 1;

      newAssignments.push({
        registrantId: personsAssignedForCode[i].registrantId,
        activityId: groupId,
        assignment: {
          assignmentCode: assignmentCode,
          stationNumber: stationNumber,
        },
      });

      lastStationNumberMap.set(groupId, stationNumber + 1);
    }

    dispatch(bulkUpsertPersonAssignments(newAssignments));
  };

  const resetStationNumbers = (props?: any) => {
    dispatch(
      bulkUpsertPersonAssignments(
        personsAssignedToCompeteOrJudge.map(({ registrantId, assignment }) => ({
          registrantId,
          activityId: assignment.activity.id,
          assignment: {
            assignmentCode: assignment.assignmentCode,
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
            assignmentCode: row.assignmentCode,
            stationNumber: parseInt(event.target.value, 10),
          },
        ])
      );
    }
  };

  const Toolbar = (props?: any) => (
    <GridToolbarContainer>
      <Button
        sx={{ m: 1 }}
        variant="contained"
        onClick={() => arbitrarilyAssignStationNumbers('competitor')}>
        Assign For Competitors
      </Button>
      <Button
        sx={{ m: 1 }}
        variant="contained"
        onClick={() => arbitrarilyAssignStationNumbers('staff-judge')}>
        Assign For Judges
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
          getRowId={(row) => row.assignmentCode + row.id}
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
