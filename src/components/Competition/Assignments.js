import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Grid, List, ListItem, ListItemText, ListSubheader, Typography } from '@mui/material';
import { allActivities, rooms } from '../../lib/activities';
import { acceptedRegistrations } from '../../lib/persons';
import { flatten } from '../../lib/utils';
import { useBreadcrumbs } from '../providers/BreadcrumbsProvider';

const AssignmentsPage = () => {
  const wcif = useSelector((state) => state.wcif);
  const { setBreadcrumbs } = useBreadcrumbs();

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

  const stages = rooms(wcif);

  const groupActivitiesByStage = stages.map((stage) => ({
    stage,
    groups: flatten(stage.activities.map((roundActivity) => roundActivity.childActivities)),
  }));

  return (
    <Grid container direction="column">
      <Grid item>
        <Typography>This page exists for troubleshooting purposes only</Typography>
      </Grid>
      <Grid item>
        <List>
          {groupActivitiesByStage.map(({ stage, groups }) => (
            <>
              {groups.map((groupActivity) => (
                <>
                  <ListSubheader>
                    {groupActivity.name} ({stage.name})
                  </ListSubheader>
                  {allPersonsAssignments
                    .filter(({ activity }) => activity.id === groupActivity.id)
                    .map(({ person, assignment }) => (
                      <ListItem button>
                        <ListItemText primary={person.name} secondary={assignment.assignmentCode} />
                      </ListItem>
                    ))}
                </>
              ))}
            </>
          ))}
        </List>
      </Grid>
    </Grid>
  );
};

export default AssignmentsPage;
