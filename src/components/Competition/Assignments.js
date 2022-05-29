import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material';
import { allActivities, rooms } from '../../lib/activities';
import { acceptedRegistrations } from '../../lib/persons';
import { flatten } from '../../lib/utils';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';
import EventSelector from '../shared/EventSelector';

const AssignmentsPage = () => {
  const wcif = useSelector((state) => state.wcif);
  const eventIds = useMemo(() => wcif.events.map((e) => e.id), [wcif.events]);
  const stages = useMemo(() => rooms(wcif), [wcif]);
  const { setBreadcrumbs } = useBreadcrumbs();
  const [eventFilter, setEventFilter] = useState(eventIds);
  const [stageFilter, setStageFilter] = useState(stages.map((stage) => stage.name));

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Assignments',
      },
    ]);
  }, [setBreadcrumbs]);

  const _allActivities = allActivities(wcif);

  const allPersonsAssignments = useMemo(
    () =>
      flatten(
        acceptedRegistrations(wcif.persons).map((person) =>
          person.assignments.map((assignment) => ({
            assignment,
            activity: _allActivities.find((a) => a.id === assignment.activityId),
            person,
          }))
        )
      ),
    [_allActivities, wcif.persons]
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

  return (
    <Grid container direction="column">
      <Grid item>
        <Typography>This page exists for troubleshooting purposes only</Typography>
      </Grid>
      <Grid
        item
        container
        direction="row"
        style={{ border: '1px solid gray', borderRadius: '4px', padding: '1em' }}>
        <Grid item direction="column" style={{ width: '10em', justifyContent: 'center' }}>
          <Typography>Stage</Typography>
          <FormGroup>
            {stages.map(({ name }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={stageFilter.indexOf(name) > -1}
                    onChange={() => {
                      if (stageFilter.indexOf(name) > -1) {
                        setStageFilter(stageFilter.filter((n) => n !== name));
                      } else {
                        setStageFilter([...stageFilter, name]);
                      }
                    }}
                  />
                }
                label={name}
              />
            ))}
          </FormGroup>
        </Grid>
        <Grid item style={{ display: 'flex', justifyContent: 'center' }}>
          <Typography>Events</Typography>
          <EventSelector
            eventIds={eventIds}
            value={eventFilter}
            onChange={(e) => setEventFilter(e)}
          />
        </Grid>
      </Grid>
      <Grid item>
        <List>
          {groupActivitiesByStage.map(({ stage, groups }) => (
            <div key={stage.name}>
              {groups.map((groupActivity) => (
                <div key={groupActivity.id}>
                  <ListSubheader>Unknown Group</ListSubheader>
                  {allPersonsAssignments
                    .filter((person) => !person.activity)
                    .map(({ person, assignment }) => (
                      <ListItem key={`${person.registrantId}unknown`} button>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItem>
                    ))}

                  <ListSubheader>
                    {groupActivity.name} ({stage.name})
                  </ListSubheader>
                  {allPersonsAssignments
                    .filter(({ activity }) => activity.id === groupActivity.id)
                    .map(({ person, activity, assignment }) => (
                      <ListItem key={`${person.registrantId}${activity.id}`} button>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItem>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </List>
      </Grid>
    </Grid>
  );
};

export default AssignmentsPage;
