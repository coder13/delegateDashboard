import EventSelector from '../../../components/EventSelector';
import { findAllActivities, findRooms } from '../../../lib/activities';
import { acceptedRegistrations } from '../../../lib/persons';
import { flatten } from '../../../lib/utils';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { resetAllGroupAssignments } from '../../../store/actions';
import { AppState } from '../../../store/initialState';
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
import { useConfirm } from 'material-ui-confirm';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AssignmentsPage = () => {
  const wcif = useSelector((state: AppState) => state.wcif);
  const eventIds = useMemo(() => (wcif ? wcif.events.map((e) => e.id) : []), [wcif?.events]);
  const stages = useMemo(() => (wcif ? findRooms(wcif) : []), [wcif]);
  const dispatch = useDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const confirm = useConfirm();
  const [eventFilter, setEventFilter] = useState(eventIds);
  const [stageFilter, setStageFilter] = useState(stages.map((stage) => stage.name));
  const [anchorEl, setAnchorEl] = useState<any>(null);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Assignments',
      },
    ]);
  }, [setBreadcrumbs]);

  const _allActivities = wcif && findAllActivities(wcif);

  const allPersonsAssignments = useMemo(
    () =>
      wcif &&
      flatten(
        acceptedRegistrations(wcif.persons).map((person) =>
          person.assignments?.map((assignment) => ({
            assignment,
            activity: _allActivities?.find((a) => a.id === assignment.activityId),
            person,
          }))
        )
      ),
    [_allActivities, wcif?.persons]
  );

  const groupActivitiesByStage = useMemo(
    () =>
      eventFilter &&
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

  const handleResetAssignments = (props?: any) => {
    confirm({
      title: 'Are you sure you want to reset all assignments?',
    }).then(() => {
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
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="large">
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
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
