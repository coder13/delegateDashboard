import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
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
import Link from '../../../components/MaterialLink';
import { acceptedRegistration, isOrganizerOrDelegate } from '../../../lib/persons';
import { pluralize } from '../../../lib/utils';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { togglePersonRole } from '../../../store/actions';

const ROLES = [
  // {
  //   id: 'staff-judge',
  //   name: 'Judge',
  // },
  {
    id: 'staff-scrambler',
    name: 'Staff',
  },
  // {
  //   id: 'staff-runner',
  //   name: 'Runner',
  // },
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

const Staff = () => {
  const wcif = useSelector((state) => state.wcif);
  const { competitionId } = useParams();
  const classes = useStyles();
  const dispatch = useDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [competitorSort, setCompetitorSort] = useState('name');

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Staff',
      },
    ]);
  }, [setBreadcrumbs]);

  const [filterDeleted] = useState(true);
  const [filterPending] = useState(true);

  const acceptedPersons = wcif.persons.filter(acceptedRegistration);

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
    <>
      <div>
        <FormControl margin="none">
          <FormLabel>Sort</FormLabel>
          <RadioGroup
            row
            value={competitorSort}
            onChange={(e) => setCompetitorSort(e.target.value)}>
            <FormControlLabel value="name" control={<Radio />} label="Name" />
            <FormControlLabel value="wcaId" control={<Radio />} label="Wca ID" />
            <FormControlLabel value="dob" control={<Radio />} label="Age" />
          </RadioGroup>
        </FormControl>
      </div>
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
              .sort((a, b) => {
                if (competitorSort === 'name') {
                  return a.name.localeCompare(b.name);
                }

                if (competitorSort === 'wcaId') {
                  return (a.wcaId || '').localeCompare(b.wcaId || '');
                }

                if (competitorSort === 'dob') {
                  return a.birthdate.localeCompare(b.birthdate);
                }

                return 0;
              })
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
                {acceptedPersons.filter((person) => person.roles.length > 0).length}
                {' / '}
                {wcif.persons.filter(acceptedRegistration).length}
                {' Staff'}
              </TableCell>
              <TableCell className={classes.bold}>
                {pluralize(
                  wcif.persons.filter(acceptedRegistration).filter((person) => !person.wcaId)
                    .length,
                  'First-Timer'
                )}
              </TableCell>
              <TableCell />
              <TableCell className={classes.bold}>
                {
                  acceptedPersons.filter((person) =>
                    person.roles.some((r) => r.includes('delegate'))
                  ).length
                }
              </TableCell>
              <TableCell className={classes.bold}>
                {acceptedPersons.filter((person) => person.roles.includes('organizer')).length}
              </TableCell>
              {ROLES.map((role) => (
                <TableCell key={role.id} className={classes.bold}>
                  {
                    wcif.persons
                      .filter(acceptedRegistration)
                      .filter((person) => person.roles.includes(role.id)).length
                  }
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </>
  );
};

export default Staff;
