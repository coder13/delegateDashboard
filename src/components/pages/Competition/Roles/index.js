import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableFooter from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import grey from '@mui/material/colors/grey';
import red from '@mui/material/colors/red';
import yellow from '@mui/material/colors/yellow';
import { makeStyles } from '@mui/styles';
import { acceptedRegistration, isOrganizerOrDelegate } from '../../../../lib/persons';
import { pluralize } from '../../../../lib/utils';
import { togglePersonRole } from '../../../../store/actions';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import Link from '../../../shared/MaterialLink';

const ROLES = [
  // {
  //   id: 'staff-judge',
  //   name: 'Judge',
  // },
  {
    id: 'staff-scrambler',
    name: 'Scrambler',
  },
  {
    id: 'staff-runner',
    name: 'Runner',
  },
];

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

const Roles = () => {
  const wcif = useSelector((state) => state.wcif);
  const { competitionId } = useParams();
  const classes = useStyles();
  const dispatch = useDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Roles',
      },
    ]);
  }, [setBreadcrumbs]);

  const [filterDeleted] = useState(true);
  const [filterPending] = useState(true);
  const filteredPersons =
    filterDeleted || filterPending
      ? wcif.persons.filter((person) => {
        if (filterDeleted && person.registration?.status === 'deleted') {
          return false;
        }

        if (filterDeleted && person.registration?.status === 'pending') {
          return false;
        }

        return true;
      })
      : wcif.persons;

  const handleChange = (e, registrantId, roleId) => {
    const person = filteredPersons.find((p) => p.registrantId === registrantId);
    if (acceptedRegistration(person)) {
      dispatch(togglePersonRole(registrantId, roleId));
    }
  };

  return (
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
                textAlign: 'center',
              }}>
              Role
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.bold} />
            <TableCell className={classes.bold} />
            <TableCell className={classes.bold} />
            <TableCell className={classes.bold}>Delegate</TableCell>
            <TableCell className={classes.bold}>Organizer</TableCell>
            {ROLES.map((role) => (
              <TableCell key={role.id} className={classes.bold}>
                {role.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPersons
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((person) => (
              <TableRow
                key={person.registrantId}
                hover
                className={clsx({
                  [classes.firstTimer]: acceptedRegistration(person) && !person.wcaId,
                  [classes.delegateOrOrganizer]:
                    acceptedRegistration(person) && isOrganizerOrDelegate(person),
                  [classes.disabled]: !acceptedRegistration(person),
                })}
                classes={{
                  hover: classes.hover,
                }}>
                <TableCell>
                  <Link to={`/competitions/${competitionId}/persons/${person.registrantId}`}>
                    {person.name}
                  </Link>
                </TableCell>
                <TableCell>{person.wcaId}</TableCell>
                <TableCell>{person.birthdate}</TableCell>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    disabled
                    checked={person.roles.indexOf('delegate') > -1}
                  />
                </TableCell>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    disabled
                    checked={person.roles.indexOf('organizer') > -1}
                  />
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role.id} padding="checkbox">
                    <Checkbox
                      disabled={!acceptedRegistration(person)}
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
              {wcif.persons.reduce(
                (acc, person) => acc + (acceptedRegistration(person) ? 1 : 0),
                0
              )}
              {' Staff'}
            </TableCell>
            <TableCell className={classes.bold}>
              {pluralize(
                wcif.persons.reduce(
                  (acc, person) => acc + (person.registration && !person.wcaId ? 1 : 0),
                  0
                ),
                'First-Timer'
              )}
            </TableCell>
            <TableCell />
            <TableCell className={classes.bold}>
              {wcif.persons.reduce(
                (acc, person) => acc + (person.roles.indexOf('delegate') > -1 ? 1 : 0),
                0
              )}
            </TableCell>
            <TableCell className={classes.bold}>
              {wcif.persons.reduce(
                (acc, person) => acc + (person.roles.indexOf('organizer') > -1 ? 1 : 0),
                0
              )}
            </TableCell>
            {ROLES.map((role) => (
              <TableCell key={role.id} className={classes.bold}>
                {wcif.persons.reduce(
                  (acc, person) => acc + (person.roles.indexOf(role.id) > -1 ? 1 : 0),
                  0
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default Roles;
