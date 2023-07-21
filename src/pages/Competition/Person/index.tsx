import { Activity, Assignment } from '@wca/helpers';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@mui/material';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { findActivityById } from '../../../lib/activities';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppSelector } from '../../../store';

const PersonPage = () => {
  const { registrantId } = useParams<{ registrantId: string }>();
  const { setBreadcrumbs } = useBreadcrumbs();

  const wcif = useAppSelector((state) => state.wcif);
  const person =
    registrantId &&
    wcif &&
    wcif.persons.find((i) => i.registrantId.toString() === registrantId.toString());

  const [assignments, setAssignments] = useState<
    (Assignment & {
      activity: Activity;
    })[]
  >([]);

  useEffect(() => {
    if (!person) {
      return;
    }

    setAssignments(
      person?.assignments
        ?.map((assignment) => ({
          activity: findActivityById(wcif, assignment.activityId),
          ...assignment,
        }))
        ?.sort(
          (a, b) =>
            new Date(a.activity.startTime).getTime() - new Date(b.activity.startTime).getTime()
        ) || []
    );

    setBreadcrumbs([
      {
        text: person.name,
      },
    ]);
  }, [wcif, person, setBreadcrumbs]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
      }}>
      <Grid container direction="column" spacing={2}>
        {person && (
          <Card>
            <CardHeader title={person.name} />
            <CardContent>
              <Typography>{person.wcaId ? `WCA ID: ${person.wcaId}` : 'First-Timer'}</Typography>
            </CardContent>
          </Card>
        )}
        <br />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Assignment</TableCell>
                <TableCell>Start Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(assignments || []).map((assignment) => (
                <TableRow key={assignment.activityId}>
                  <TableCell>{assignment.activity.activityCode}</TableCell>
                  <TableCell>{assignment.assignmentCode}</TableCell>
                  <TableCell>{new Date(assignment.activity.startTime).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </div>
  );
};

export default PersonPage;
