import React, { useState } from 'react';
import clsx from 'clsx';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Checkbox from '@material-ui/core/Checkbox';
import TableHead from '@material-ui/core/TableHead';
import TableFooter from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import yellow from '@material-ui/core/colors/yellow';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';
import { togglePersonRole } from '../../store/actions';
import { pluralize } from '../../lib/utils';

const ROLES = [{
  id: 'staff-judge',
  name: 'Judge',
}, {
  id: 'staff-scrambler',
  name: 'Scrambler',
}];

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
  bold: {
    fontWeight: 600,
  },
  firstTimer: {
    backgroundColor: grey[50],
    '&$hover:hover': {
      backgroundColor: grey[100],
    },
  },
  delegateOrOrganizer: {
    backgroundColor: yellow[50],
    '&$hover:hover': {
      backgroundColor: yellow[100],
    },
  },
  disabled: {
    backgroundColor: red[50],
    '&$hover:hover': {
      backgroundColor: red[100],
    },
  },
  hover: {},
}));

const canStaff = (person) =>
  !person.registration || (person.registration && person.registration.status === 'accepted');

const isOrganizerOrDelegate = (person) =>
  person.registration && (person.roles.indexOf('delegate') > -1 || person.roles.indexOf('organizer') > -1);

const Roles = ({ wcif }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [ filterDeleted ] = useState(true);
  const [ filterPending ] = useState(true);
  const filteredPersons = (filterDeleted || filterPending) ? wcif.persons.filter((person) => {
    if (filterDeleted && person.registration.status === 'deleted') {
      return false;
    }

    if (filterDeleted && person.registration.status === 'pending') {
      return false;
    }

    return true;
  }) : wcif.persons;

  const handleChange = (e, person, roleId) => {
    if (canStaff(person)) {
      dispatch(togglePersonRole(person, roleId));
    }
  };

  return (
    <Grid container direction="column" spacing={2} className={classes.root}>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell className={classes.bold}>Name</TableCell>
              <TableCell className={classes.bold}>WCA ID</TableCell>
              <TableCell className={classes.bold}>DOB</TableCell>
              <TableCell
                className={classes.bold}
                colSpan={ROLES.length + 2}
                style={{
                  textAlign: 'center'
                }}
              >Role</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={classes.bold}/>
              <TableCell className={classes.bold}/>
              <TableCell className={classes.bold}/>
              <TableCell className={classes.bold}>Delegate</TableCell>
              <TableCell className={classes.bold}>Organizer</TableCell>
              { ROLES.map((role) => (
                <TableCell key={role.id} className={classes.bold}>{role.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
          { filteredPersons.map((person) => (
            <TableRow
              key={person.registrantId}
              hover
              className={clsx({
                [classes.firstTimer]: canStaff(person) && !person.wcaId,
                [classes.delegateOrOrganizer]: canStaff(person) && isOrganizerOrDelegate(person),
                [classes.disabled]: !canStaff(person),
              })}
              classes={{
                hover: classes.hover,
              }}
            >
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.wcaId}</TableCell>
              <TableCell>{person.birthdate}</TableCell>
              <TableCell padding="checkbox">
                <Checkbox color="primary" disabled checked={person.roles.indexOf('delegate') > -1}/>
              </TableCell>
              <TableCell padding="checkbox">
                <Checkbox color="primary" disabled checked={person.roles.indexOf('organizer') > -1}/>
              </TableCell>
              { ROLES.map((role) => (
                <TableCell key={role.id} padding="checkbox">
                  <Checkbox
                    disabled={!canStaff(person)}
                    color="primary"
                    checked={person.roles.indexOf(role.id) > -1}
                    onChange={(e) => handleChange(e, person.registrantId, role.id)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className={classes.bold}>
                {wcif.persons.reduce((acc, person) => acc + (person.roles.length > 0 ? 1 : 0), 0)}
                {' / '}
                {wcif.persons.reduce((acc, person) => acc + (canStaff(person) ? 1 : 0), 0)}
                {' Staff'}
              </TableCell>
              <TableCell className={classes.bold}>
                {pluralize(wcif.persons.reduce((acc, person) => acc + (person.registration && !person.wcaId ? 1 : 0), 0), 'First-Timer')}
              </TableCell>
              <TableCell/>
              <TableCell className={classes.bold}>
                {wcif.persons.reduce((acc, person) => acc + (person.roles.indexOf('delegate') > -1 ? 1 : 0), 0)}
              </TableCell>
              <TableCell className={classes.bold}>
                {wcif.persons.reduce((acc, person) => acc + (person.roles.indexOf('organizer') > -1 ? 1 : 0), 0)}
              </TableCell>
              {ROLES.map((role) => (
                <TableCell key={role.id} className={classes.bold}>
                  {wcif.persons.reduce((acc, person) => acc + (person.roles.indexOf(role.id) > -1 ? 1 : 0), 0)}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Grid>
  );
};

const mapStateToProps = (state) => ({
  wcif: state.wcif,
});

export default connect(mapStateToProps)(Roles);
