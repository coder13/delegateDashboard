import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { activityById } from '../../lib/activities'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'Column',
    flex: 1,
    width: '100%',
  },
  paper: {
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const PersonPage = () => {
  const classes = useStyles();
  const { params } = useRouteMatch();

  const wcif = useSelector((state) => state.wcif);
  const person = wcif.persons.find(i => i.registrantId.toString() === params.registrantId.toString());

  const [assignments, setAssignments] = useState([]);

  React.useEffect(() => {
    if (!person) {
      return;
    }

    setAssignments(person.assignments.map((assignment) => ({
      activity: activityById(wcif, assignment.activityId),
      ...assignment,
    })).sort((a,b) => 
      new Date(a.activity.startTime).getTime() - new Date(b.activity.startTime).getTime()
    ))
  }, [wcif, person]);

  console.log(30, person, assignments);

  return (
    <div className={classes.root}>
      <Grid container direction="column" spacing={2}>
        <Typography>Name: {person.name}</Typography>
        <Typography>WCA ID: {person.wcaId}</Typography>

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
            { assignments.map((assignment) => (
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
