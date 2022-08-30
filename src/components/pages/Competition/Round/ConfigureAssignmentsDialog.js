import { formatCentiseconds } from '@wca/helpers';
import clsx from 'clsx';
import { useConfirm } from 'material-ui-confirm';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar as MuiToolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { grey, red, yellow } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import { styled, useTheme } from '@mui/system';
import { rooms, parseActivityCode, activityCodeToName } from '../../../../lib/activities';
import { acceptedRegistration, isOrganizerOrDelegate } from '../../../../lib/persons';
import { flatten } from '../../../../lib/utils';
import {
  upsertPersonAssignment,
  removePersonAssignment,
  bulkRemovePersonAssignment,
} from '../../../../store/actions';
import TableAssignmentCell from './TableAssignmentCell';

const useStyles = makeStyles(() => ({
  firstTimer: {
    backgroundColor: grey[50],
    '&:hover': {
      backgroundColor: grey[100],
    },
  },
  delegateOrOrganizer: {
    backgroundColor: yellow[50],
    '&:hover': {
      backgroundColor: yellow[100],
    },
  },
  disabled: {
    backgroundColor: red[50],
    '&:hover': {
      backgroundColor: red[100],
    },
  },
  hover: {},
}));

const Toolbar = styled(MuiToolbar)(
  ({ theme }) => `
  padding: 0 ${theme.spacing(2)};
  justify-content: space-between;
`
);

const Assignments = [
  {
    id: 'competitor',
    name: 'Competitor',
    key: 'c',
  },
  {
    id: 'staff-scrambler',
    name: 'Scrambler',
    key: 's',
  },
  {
    id: 'staff-runner',
    name: 'Runner',
    key: 'r',
  },
  {
    id: 'staff-judge',
    name: 'Judge',
    key: 'j',
  },
];

const ConfigureScramblersDialog = ({ open, onClose, activityCode, groups }) => {
  const classes = useStyles();
  const wcif = useSelector((state) => state.wcif);
  const dispatch = useDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const confirm = useConfirm();
  const { eventId } = parseActivityCode(activityCode);

  const [showAllCompetitors, setShowAllCompetitors] = useState(false);
  const [paintingAssignmentCode, setPaintingAssignmentCode] = useState('staff-scrambler');
  const [lastPaintingAssignmentCode, setLastPaintingAssignmentCode] = useState('staff-scrambler');
  const [competitorSort, setCompetitorSort] = useState('speed');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const groupsRooms = useMemo(
    () =>
      rooms(wcif).filter((room) =>
        flatten(room.activities.map((activity) => activity.childActivities)).some((activity) =>
          groups.find((g) => g.id === activity.id)
        )
      ),
    [groups, wcif]
  );

  const persons = useMemo(
    () =>
      wcif.persons
        .filter(
          (p) =>
            isOrganizerOrDelegate(p) ||
            (p?.registration?.status === 'accepted' &&
              (p.roles.some((r) => r.indexOf('staff') > -1) || showAllCompetitors) &&
              p?.registration?.eventIds.indexOf(eventId) > -1)
        )
        .map((person) => ({
          ...person,
          pr: person.personalBests.find((pb) => pb.eventId === eventId && pb.type === 'average')
            ?.best,
        }))
        .sort((a, b) => {
          if (competitorSort === 'speed') {
            return (a.pr || Number.MAX_VALUE) - (b.pr || Number.MAX_VALUE);
          }

          return a.name.localeCompare(b.name);
        }),
    [competitorSort, eventId, showAllCompetitors, wcif.persons]
  );

  const getAssignmentCodeForPersonGroup = useCallback(
    (registrantId, activityId) => {
      const assignments = persons.find((p) => p.registrantId === registrantId).assignments;
      return assignments.find((a) => a.activityId === activityId)?.assignmentCode;
    },
    [persons]
  );

  const handleUpdateAssignmentForPerson = (registrantId, activityId) => () => {
    if (getAssignmentCodeForPersonGroup(registrantId, activityId) === paintingAssignmentCode) {
      dispatch(removePersonAssignment(registrantId, activityId));
    } else {
      dispatch(
        upsertPersonAssignment(registrantId, {
          activityId,
          assignmentCode: paintingAssignmentCode,
        })
      );
    }
  };

  const handleResetAssignments = () => {
    confirm('Are you sure you want to reset all assignments and start over').then(() => {
      dispatch(
        bulkRemovePersonAssignment(
          groups.map((groupActivity) => ({
            activityId: groupActivity.id,
          }))
        )
      );
    });
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey) {
      return;
    }

    const assignment = Assignments.find((a) => a.key === e.key);
    if (assignment) {
      if (paintingAssignmentCode === assignment.id) {
        setLastPaintingAssignmentCode(paintingAssignmentCode);
        setPaintingAssignmentCode(lastPaintingAssignmentCode);
      } else {
        setLastPaintingAssignmentCode(paintingAssignmentCode);
        setPaintingAssignmentCode(assignment.id);
      }
    }

    if (e.key === 'a') {
      setShowAllCompetitors(!showAllCompetitors);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ paddingTop: '0.25em', paddingBottom: '0.25em' }}>
        Configuring Assignments For {activityCodeToName(activityCode)}
      </DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <Toolbar className="flex-row">
          <div>
            <FormControl margin="none">
              <FormLabel>Assignment</FormLabel>
              <RadioGroup
                row
                value={paintingAssignmentCode}
                onChange={(e) => setPaintingAssignmentCode(e.target.value)}>
                {Assignments.map((assignment) => (
                  <FormControlLabel
                    key={assignment.id}
                    value={assignment.id}
                    control={<Radio />}
                    label={assignment.name}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </div>
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div>
            <FormControl margin="none">
              <FormLabel>Sort</FormLabel>
              <RadioGroup
                row
                value={competitorSort}
                onChange={(e) => setCompetitorSort(e.target.value)}>
                <FormControlLabel value="speed" control={<Radio />} label="Speed" />
                <FormControlLabel value="name" control={<Radio />} label="Name" />
              </RadioGroup>
            </FormControl>
            <FormControl margin="none">
              <FormLabel>Show All Competitors</FormLabel>
              <Switch
                checked={showAllCompetitors}
                onChange={(e) => setShowAllCompetitors(e.target.checked)}
              />
            </FormControl>
          </div>
          <IconButton onClick={handleMenuOpen} className="flex-shrink">
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="Configure-scramblers-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
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
        </Toolbar>

        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              {groupsRooms.map((room) => (
                <TableCell
                  key={room.id}
                  style={{ textAlign: 'center' }}
                  colSpan={groups.length / groupsRooms.length}>
                  {room.name}
                </TableCell>
              ))}
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ width: '20%' }}>Name</TableCell>
              <TableCell style={{ width: '1em' }}>Average</TableCell>
              <TableCell style={{ width: '1em' }}>Registered</TableCell>
              {groupsRooms.map((room) =>
                groups
                  .filter((group) => group.parent.room.name === room.name)
                  .map((group) => (
                    <TableCell key={group.id} style={{ textAlign: 'center', width: '1em' }}>
                      g{parseActivityCode(group.activityCode).groupNumber}
                    </TableCell>
                  ))
              )}
              <TableCell style={{ width: '1em' }}>Total Staff Assignments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {persons.map((person) => (
              <TableRow
                hover
                key={person.registrantId}
                className={clsx({
                  [classes.firstTimer]: acceptedRegistration(person) && !person.wcaId,
                  [classes.delegateOrOrganizer]:
                    acceptedRegistration(person) && isOrganizerOrDelegate(person),
                  [classes.disabled]: !acceptedRegistration(person),
                })}>
                <TableCell>{person.name}</TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  {person.pr && formatCentiseconds(person.pr)}
                </TableCell>
                <TableCell
                  style={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    textAlign: 'center',
                  }}>
                  {person?.registration?.eventIds.indexOf(eventId) > -1 ? (
                    <CheckIcon fontSize="small" />
                  ) : (
                    ''
                  )}
                </TableCell>
                {groupsRooms.map((room) =>
                  groups
                    .filter((group) => group.parent.room.name === room.name)
                    .map((groupActivity) => (
                      <TableAssignmentCell
                        key={groupActivity.id}
                        value={getAssignmentCodeForPersonGroup(
                          person.registrantId,
                          groupActivity.id
                        )}
                        onClick={handleUpdateAssignmentForPerson(
                          person.registrantId,
                          groupActivity.id
                        )}
                      />
                    ))
                )}
                <TableCell>
                  {person.assignments.filter((a) => a.assignmentCode.indexOf('staff-') > -1).length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <div style={{ display: 'flex', flexDirction: 'row' }}>
          <Typography>
            <span>Assigning: </span>
            <b>{Assignments.find((a) => a.id === paintingAssignmentCode)?.name}</b>
            {' | '}
            <span>Showing: </span>
            <b>{showAllCompetitors ? 'All Competitors' : 'staff'}</b>
            {' | '}
            <span>Sorting By: </span>
            <b>{competitorSort}</b>
            {' | '}
            <span>Total Persons Shown: </span>
            <b>{persons.length}</b>
          </Typography>
        </div>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureScramblersDialog;
