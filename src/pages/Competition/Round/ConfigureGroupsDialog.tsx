import { createGroupActivity, findAllActivities } from '../../../lib/activities';
import { formatTimeRange } from '../../../lib/time';
import { omit } from '../../../lib/utils';
import { useAppSelector, useAppDispatch } from '../../../store';
import { updateRoundChildActivities } from '../../../store/actions';
import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Delete,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import { Activity, activityCodeToName, parseActivityCode } from '@wca/helpers';
import { formatDuration } from 'date-fns';
import React, { Fragment, useCallback } from 'react';

export const ConfigurableGroupList = ({
  roundActivity,
  groups,
}: {
  roundActivity: Activity;
  groups: Activity[];
}) => {
  const dispatch = useAppDispatch();
  const handleDeleteGroup = (activity: Activity) => {
    console.log('delete', activity);
    const filteredGroups = groups.filter((g) => g.id !== activity.id);
    const numberOfGroups = filteredGroups.length;
    const startDate = new Date(roundActivity.startTime);
    const endDate = new Date(roundActivity.endTime);
    const dateDiff = endDate.getTime() - startDate.getTime();

    const newGroups = filteredGroups.map((g, i) => ({
      ...g,
      startTime: new Date(startDate.getTime() + (dateDiff / numberOfGroups) * i),
      endTime: new Date(startDate.getTime() + (dateDiff / numberOfGroups) * (i + 1)),
    }));

    dispatch(updateRoundChildActivities(roundActivity.id, newGroups));
  };

  return (
    <List>
      {groups.map((activity) => {
        const duration =
          new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime();
        const minutes = duration / 1000 / 60;

        return (
          <ListItem
            key={activity.id}
            secondaryAction={
              <>
                <Input type="number" style={{ width: '5em' }} name="duration" />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteGroup(activity)}>
                  <Delete />
                </IconButton>
              </>
            }>
            <ListItemText
              primary={activity.name}
              secondary={`${activity.activityCode} | ${formatTimeRange(
                activity.startTime,
                activity.endTime
              )} (${formatDuration({ minutes })})`}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export const ConfigurableGroupTable = ({
  roundActivity,
  groups,
  addGroup,
  editGroups,
}: {
  roundActivity: Activity;
  groups: Activity[];
  addGroup: () => void;
  editGroups: (Activities: Activity[]) => void;
}) => {
  const dispatch = useAppDispatch();
  const handleDeleteGroup = (activity: Activity) => {
    console.log('delete', activity);
    const filteredGroups = groups.filter((g) => g.id !== activity.id);
    const numberOfGroups = filteredGroups.length;
    const startDate = new Date(roundActivity.startTime);
    const endDate = new Date(roundActivity.endTime);
    const dateDiff = endDate.getTime() - startDate.getTime();

    const newGroups = filteredGroups.map((g, i) => ({
      ...g,
      startTime: new Date(startDate.getTime() + (dateDiff / numberOfGroups) * i),
      endTime: new Date(startDate.getTime() + (dateDiff / numberOfGroups) * (i + 1)),
    }));

    dispatch(updateRoundChildActivities(roundActivity.id, newGroups));
  };

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    const activity = groups.find((g) => g.id === id);
    if (!activity) return;

    handleDeleteGroup(activity);
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  const processRowUpdate = (newRow: GridRowModel<Activity & { duration: number }>) => {
    const newEndTimestamp = new Date(newRow.startTime).getTime() + newRow.duration * 60 * 1000;
    const newEndTime = new Date(newEndTimestamp);

    const newGroup: Activity = {
      ...omit(newRow, 'duration'),
      endTime: newEndTime.toISOString(),
    };
    // the following group should have it's start Time increased based on the new endTime
    const groupAfter = groups.find((g) => g.startTime > newRow.startTime) as Activity;

    const newGroupAfter = {
      ...groupAfter,
      startTime: newGroup.endTime,
    };

    editGroups(
      groups.reduce((acc, g) => {
        if (g.id === newGroup.id) {
          return [...acc, newGroup];
        } else if (g.id === newGroupAfter.id) {
          return [...acc, newGroupAfter];
        } else {
          return [...acc, g];
        }
      }, [])
    );

    return newGroup;
  };

  const columns: GridColDef<Activity>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      editable: true,
    },
    {
      field: 'timeFrame',
      headerName: 'Time Frame',
      flex: 1,
      editable: false,
      valueGetter: ({ row }) => `${formatTimeRange(row.startTime, row.endTime)}`,
    },
    {
      field: 'duration',
      headerName: 'Duration',
      type: 'number',
      width: 80,
      align: 'left',
      headerAlign: 'left',
      editable: true,
      valueGetter: ({ row }) => {
        const duration = new Date(row.endTime).getTime() - new Date(row.startTime).getTime();
        const minutes = duration / 1000 / 60;
        return minutes;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            // @ts-ignore - React 18 type compatibility issue with @mui/x-data-grid v5
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            // @ts-ignore - React 18 type compatibility issue with @mui/x-data-grid v5
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          // @ts-ignore - React 18 type compatibility issue with @mui/x-data-grid v5
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          // @ts-ignore - React 18 type compatibility issue with @mui/x-data-grid v5
          <GridActionsCellItem
            icon={<Delete />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <DataGrid
      autoHeight
      rows={groups}
      columns={columns}
      editMode="row"
      rowModesModel={rowModesModel}
      onRowEditStop={handleRowEditStop}
      processRowUpdate={processRowUpdate}
      components={{
        Toolbar: () => (
          <GridToolbarContainer>
            <Button color="primary" startIcon={<AddIcon />} onClick={addGroup}>
              Add Group
            </Button>
          </GridToolbarContainer>
        ),
      }}
    />
  );
};

export const ConfigureGroupsDialog = ({ open, onClose, activityCode }) => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useAppDispatch();

  // Rooms that have this activity
  const rooms = wcif?.schedule?.venues
    .flatMap((venue) => venue.rooms)
    ?.filter((room) => room.activities.some((ra) => ra.activityCode === activityCode));

  const addGroup = useCallback(
    (ra: Activity) => {
      const maxId = wcif
        ? findAllActivities(wcif).reduce((max, a) => Math.max(max, a.id), 0) + 1
        : -1;
      const groups = ra.childActivities.sort(
        (a, b) =>
          (parseActivityCode(a.activityCode).groupNumber ?? 0) -
          (parseActivityCode(b.activityCode).groupNumber ?? 0)
      );
      const lastGroup = parseActivityCode(groups[groups.length - 1].activityCode);
      const newGroupNumber = (lastGroup?.groupNumber ?? 0) + 1;
      const startDate = new Date(ra.startTime);
      const endDate = new Date(ra.endTime);
      const dateDiff = endDate.getTime() - startDate.getTime();

      const newGroups = [
        ...groups,
        createGroupActivity(maxId, ra, newGroupNumber, ra.startTime, ra.endTime),
      ].map((g, i, arr) => ({
        ...g,
        startTime: new Date(startDate.getTime() + (dateDiff / arr.length) * i).toISOString(),
        endTime: new Date(startDate.getTime() + (dateDiff / arr.length) * (i + 1)).toISOString(),
      }));

      dispatch(
        updateRoundChildActivities(
          ra.id,
          newGroups.sort((a, b) => a.startTime.localeCompare(b.startTime))
        )
      );
    },
    [dispatch, wcif]
  );

  const editGroups = useCallback(
    (ra: Activity, groups: Activity[]) => {
      dispatch(
        updateRoundChildActivities(
          ra.id,
          groups.sort((a, b) => a.startTime.localeCompare(b.startTime))
        )
      );
    },
    [dispatch]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex' }}>
        <span>Configuring groups for {activityCodeToName(activityCode)}</span>
      </DialogTitle>
      <DialogContent>
        <br />
        <Grid container direction="row" spacing={1}>
          {rooms?.map((room) => (
            <Grid key={room.id} item xs={12 / rooms.length}>
              <Typography variant="h5">{room.name}</Typography>
              {room.activities
                .filter((ra) => ra.activityCode === activityCode)
                .map((ra) => (
                  <Fragment key={ra.id}>
                    <Typography variant="h6">{ra.name}</Typography>
                    <Typography variant="caption">
                      {formatTimeRange(ra.startTime, ra.endTime)}
                    </Typography>
                    <ConfigurableGroupTable
                      roundActivity={ra}
                      groups={
                        room.activities.find((ra) => ra.activityCode === activityCode)
                          ?.childActivities || []
                      }
                      addGroup={() => addGroup(ra)}
                      editGroups={(groups) => editGroups(ra, groups)}
                    />
                    <Typography></Typography>
                  </Fragment>
                ))}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
