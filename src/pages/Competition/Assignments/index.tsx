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
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { Activity, EventId, Person, Room } from '@wca/helpers';
import { flatten } from 'lodash';
import { useConfirm } from 'material-ui-confirm';
import React, { useMemo, useState } from 'react';

type Assignment = NonNullable<Person['assignments']>[number];

interface PersonAssignment {
  assignment: Assignment;
  activity: Activity | undefined;
  person: Person;
}

interface GroupsByStage {
  stage: Room;
  groups: Activity[];
}

const AssignmentsPage = () => {
  const wcif = useWcif();
  const acceptedPersons = useAcceptedPersons();
  const stages = useWcifRooms();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { anchorEl, handleOpen, handleClose } = useMenuState();

  useBreadcrumbsEffect([{ text: 'Assignments' }]);

  const eventIds = useMemo<EventId[]>(() => wcif?.events.map((e) => e.id) || [], [wcif?.events]);
  const [eventFilter, setEventFilter] = useState<EventId[]>(eventIds);
  const [stageFilter, setStageFilter] = useState<string[]>(stages.map((stage) => stage.name));

  const allPersonsAssignments = useMemo<PersonAssignment[]>(() => {
    const allActivities = wcif ? findAllActivities(wcif) : [];
    return flatten(
      acceptedPersons.map((person) =>
        (person.assignments || []).map((assignment) => ({
          assignment,
          activity: allActivities.find((activity) => activity.id === assignment.activityId),
          person,
        }))
      )
    );
  }, [acceptedPersons, wcif]);

  const groupActivitiesByStage = useMemo<GroupsByStage[]>(
    () =>
      stages
        .filter((stage) => stageFilter.indexOf(stage.name) > -1)
        .map((stage) => ({
          stage,
          groups: flatten(
            stage.activities.map((roundActivity) => roundActivity.childActivities || [])
          ).filter(
            ({ activityCode }) => eventFilter.indexOf(activityCode.split('-')[0] as EventId) > -1
          ),
        })),
    [stages, stageFilter, eventFilter]
  );

  const handleChangeStage = (name: string) => {
    if (stageFilter.indexOf(name) > -1) {
      setStageFilter(stageFilter.filter((n) => n !== name));
    } else {
      setStageFilter([...stageFilter, name]);
    }
  };

  const handleResetAssignments = () => {
    confirm({ description: 'Are you sure you want to reset all assignments?' }).then(() => {
      dispatch(resetAllGroupAssignments());
    });
  };

  if (!wcif) {
    return null;
  }

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
            <EventSelector eventIds={eventIds} value={eventFilter} onChange={setEventFilter} />
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
              {allPersonsAssignments.filter((personAssignment) => !personAssignment.activity)
                .length ? (
                <>
                  <ListSubheader>Unknown Group</ListSubheader>
                  {allPersonsAssignments
                    .filter((personAssignment) => !personAssignment.activity)
                    .map(({ person, assignment }) => (
                      <ListItemButton key={`${person.registrantId}-unknown`}>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItemButton>
                    ))}
                </>
              ) : null}

              {groups.map((groupActivity) => (
                <React.Fragment key={groupActivity.id}>
                  <ListSubheader>
                    {groupActivity.name} ({stage.name})
                  </ListSubheader>
                  {allPersonsAssignments
                    .filter(({ activity }) => activity?.id === groupActivity.id)
                    .map(({ person, activity, assignment }, index) => (
                      <ListItemButton key={`${person.registrantId}-${activity?.id}-${index}`}>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItemButton>
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
