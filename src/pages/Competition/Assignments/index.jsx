import EventSelector from '../../../components/EventSelector';
import {
  useBreadcrumbsEffect,
  useMenuState,
  useWcif,
  useAcceptedPersons,
  useWcifRooms,
} from '../../../hooks';
import { findAllActivities } from '../../../lib/domain/activities';
import { useAppDispatch } from '../../../store';
import { resetAllGroupAssignments } from '../../../store/actions';
import { MoreVert } from '@mui/icons-material';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import { flatten } from 'lodash';
import { useConfirm } from 'material-ui-confirm';
import React, { useMemo, useState } from 'react';

const AssignmentsPage = () => {
  const wcif = useWcif();
  const acceptedPersons = useAcceptedPersons();
  const eventIds = useMemo(() => wcif.events.map((e) => e.id), [wcif.events]);
  const stages = useWcifRooms();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const [eventFilter, setEventFilter] = useState(eventIds);
  const [stageFilter, setStageFilter] = useState(stages.map((stage) => stage.name));
  const { anchorEl, handleOpen, handleClose } = useMenuState();

  useBreadcrumbsEffect([{ text: 'Assignments' }]);

  const _allActivities = findAllActivities(wcif);

  const allPersonsAssignments = useMemo(
    () =>
      flatten(
        acceptedPersons.map((person) =>
          person.assignments.map((assignment) => ({
            assignment,
            activity: _allActivities.find((a) => a.id === assignment.activityId),
            person,
          }))
        )
      ),
    [_allActivities, acceptedPersons]
  );

  const groupActivitiesByStage = useMemo(
    () =>
      stages
        .filter((stage) => stageFilter.indexOf(stage.name) > -1)
        .map((stage) => ({
          stage,
          groups: flatten(
            stage.activities.map((roundActivity) => roundActivity.childActivities)
          ).filter(({ activityCode }) => eventFilter.indexOf(activityCode.split('-')[0]) > -1),
        })),
    [stages, stageFilter, eventFilter]
  );

  const handleChangeStage = (name) => {
    if (stageFilter.indexOf(name) > -1) {
      setStageFilter(stageFilter.filter((n) => n !== name));
    } else {
      setStageFilter([...stageFilter, name]);
    }
  };

  const handleResetAssignments = () => {
    confirm('Are you sure you want to reset all assignments?').then(() => {
      dispatch(resetAllGroupAssignments());
    });
  };

  return (
    <Grid container direction="column">
      <Grid item>
        <Typography>This page exists for troubleshooting purposes only</Typography>
      </Grid>
      <Grid item>
        <Paper
          direction="row"
          sx={{
            padding: 2,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <div>
            <Typography>Stage</Typography>
            <FormGroup>
              {stages.map(({ name }) => (
                <FormControlLabel
                  key={name}
                  control={
                    <Checkbox
                      checked={stageFilter.indexOf(name) > -1}
                      onChange={() => handleChangeStage(name)}
                    />
                  }
                  label={name}
                />
              ))}
            </FormGroup>
          </div>
          <div>
            <Typography>Events</Typography>
            <EventSelector
              eventIds={eventIds}
              value={eventFilter}
              onChange={(e) => setEventFilter(e)}
            />
          </div>
          <div style={{ display: 'flex', flex: 1 }} />
          <IconButton onClick={handleOpen} size="large">
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}>
            <MenuItem onClick={handleResetAssignments}>Reset Assignments</MenuItem>
          </Menu>
        </Paper>
      </Grid>
      <Grid item>
        <List>
          {groupActivitiesByStage.map(({ stage, groups }) => (
            <div key={stage.id}>
              {allPersonsAssignments.filter((person) => !person.activity).length ? (
                <>
                  <ListSubheader>Unknown Group</ListSubheader>
                  {allPersonsAssignments
                    .filter((person) => !person.activity)
                    .map(({ person, assignment }) => (
                      <ListItem key={`${person.registrantId}-unknown`} button>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItem>
                    ))}
                </>
              ) : null}

              {groups.map((groupActivity) => (
                <React.Fragment key={groupActivity.id}>
                  <ListSubheader>
                    {groupActivity.name} ({stage.name})
                  </ListSubheader>
                  {allPersonsAssignments
                    .filter(({ activity }) => activity.id === groupActivity.id)
                    .map(({ person, activity, assignment }, index) => (
                      <ListItem key={`${person.registrantId}-${activity.id}-${index}`} button>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItem>
                    ))}
                </React.Fragment>
              ))}
            </div>
          ))}
        </List>
      </Grid>
    </Grid>
  );
};

export default AssignmentsPage;
