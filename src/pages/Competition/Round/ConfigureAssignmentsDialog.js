import { formatCentiseconds } from '@wca/helpers';
import clsx from 'clsx';
import { useConfirm } from 'material-ui-confirm';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EmojiPeople } from '@mui/icons-material';
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
  Select,
  ListItemText,
  FormHelperText,
  Tooltip,
} from '@mui/material';
import { grey, red, yellow } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import { styled, useTheme } from '@mui/system';
import Assignments from '../../../config/assignments';
import { parseActivityCode, activityCodeToName } from '../../../lib/activities';
import {
  acceptedRegistration,
  byPROrResult,
  getSeedResult,
  isOrganizerOrDelegate,
  registeredForEvent,
  shouldBeInRound,
} from '../../../lib/persons';
import { flatten } from '../../../lib/utils';
import {
  upsertPersonAssignments,
  removePersonAssignments,
  bulkRemovePersonAssignments,
} from '../../../store/actions';
import { selectWcifRooms } from '../../../store/selectors';
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

function calcRanking(person, lastPerson) {
  if (!lastPerson?.seedResult?.ranking) {
    return 1;
  }

  if (person?.seedResult?.rankingResult === lastPerson?.seedResult?.rankingResult) {
    return lastPerson.seedResult.ranking;
  }

  return lastPerson.seedResult.ranking + 1;
}

const ConfigureAssignmentsDialog = ({ open, onClose, activityCode, groups }) => {
  const wcif = useSelector((state) => state.wcif);
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode);
  const classes = useStyles();
  const wcifRooms = useSelector((state) => selectWcifRooms(state));

  const dispatch = useDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const confirm = useConfirm();

  const [showAllCompetitors, setShowAllCompetitors] = useState(false);
  const [paintingAssignmentCode, setPaintingAssignmentCode] = useState('staff-scrambler');
  const [competitorSort, setCompetitorSort] = useState('speed');
  const [showCompetitorsNotInRound, setShowCompetitorsNotInRound] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const groupsRooms = useMemo(
    () =>
      wcifRooms.filter((room) =>
        flatten(room.activities.map((activity) => activity.childActivities)).some((activity) =>
          groups.find((g) => g.id === activity.id)
        )
      ),
    [groups, wcifRooms]
  );

  const isRegistered = registeredForEvent(eventId);

  const persons = useMemo(
    () =>
      wcif.persons
        .filter((p) => {
          // if competitor does not have an accepted registration, do not show them
          if (!acceptedRegistration(p)) {
            return false;
          }

          // If we want to show every anyways, return true
          if (showCompetitorsNotInRound) {
            return true;
          }

          // Else make sure they are registered and should be in the round.
          return isRegistered(p) && shouldBeInRound(round)(p);
        })
        .map((person) => ({
          ...person,
          seedResult: getSeedResult(wcif, activityCode, person),
        }))
        .sort((a, b) => byPROrResult(event, roundNumber)(a, b))
        .reduce((persons, person) => {
          const lastPerson = persons[persons.length - 1];
          console.log(lastPerson, person);
          return [
            ...persons,
            {
              ...person,
              seedResult: {
                ...person.seedResult,
                ranking: calcRanking(person, lastPerson),
              },
            },
          ];
        }, [])
        .filter(
          (p) =>
            showAllCompetitors ||
            isOrganizerOrDelegate(p) ||
            p.roles.some((r) => r.indexOf('staff') > -1)
        )
        .sort((a, b) => {
          if (competitorSort === 'speed') {
            return 0;
          }

          return a.name.localeCompare(b.name);
        }),
    [
      activityCode,
      competitorSort,
      event,
      isRegistered,
      round,
      roundNumber,
      showAllCompetitors,
      showCompetitorsNotInRound,
      wcif,
    ]
  );

  console.log(177, persons);

  // const personsForActivityId = useCallback(
  //   (activityId, role) =>
  //     persons.filter((p) => p.assignments.some((a) => a.assignmentCode === role)),
  //   [persons]
  // );

  const personAssignments = useCallback(
    (registrantId) => persons.find((p) => p.registrantId === registrantId).assignments,
    [persons]
  );

  const getAssignmentCodeForPersonGroup = useCallback(
    (registrantId, activityId) => {
      return personAssignments(registrantId).find((a) => a.activityId === activityId)
        ?.assignmentCode;
    },
    [personAssignments]
  );

  const handleUpdateAssignmentForPerson = (registrantId, activityId) => () => {
    if (getAssignmentCodeForPersonGroup(registrantId, activityId) === paintingAssignmentCode) {
      dispatch(removePersonAssignments(registrantId, activityId));
    } else {
      dispatch(
        upsertPersonAssignments(registrantId, [
          {
            activityId,
            assignmentCode: paintingAssignmentCode,
          },
        ])
      );
    }
  };

  const handleResetAssignments = () => {
    confirm('Are you sure you want to reset all assignments and start over').then(() => {
      dispatch(
        bulkRemovePersonAssignments(
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
      setPaintingAssignmentCode(assignment.id);
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
          <div
            className="flex-grow"
            style={{ display: 'flex', flexGrow: 1, alignItems: 'flex-start' }}>
            <FormControl margin="none" fullWidth>
              <FormLabel>Assignment</FormLabel>
              <Select
                className="paintingAssignment"
                value={paintingAssignmentCode}
                onChange={(e) => setPaintingAssignmentCode(e.target.value)}
                renderValue={(value) => {
                  const assignment = Assignments.find((a) => a.id === value);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemText>{assignment.name}</ListItemText>
                    </div>
                  );
                }}>
                {Assignments.map((assignment) => (
                  <MenuItem key={assignment.id} value={assignment.id}>
                    <ListItemText>{assignment.name}</ListItemText>
                    {assignment.key && <Typography>{assignment.key.toUpperCase()}</Typography>}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Or press the respective key</FormHelperText>
            </FormControl>
          </div>
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'space-around' }}>
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
            <FormControl margin="none">
              <FormLabel>Show Competitors Not In Round</FormLabel>
              <Switch
                checked={showCompetitorsNotInRound}
                onChange={(e) => setShowCompetitorsNotInRound(e.target.checked)}
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
              <TableCell style={{ width: '1em' }}>#</TableCell>
              <TableCell style={{ width: '20%' }}>Name</TableCell>
              <TableCell style={{ width: '1em', textAlign: 'center' }}>Seed Result</TableCell>
              <TableCell style={{ width: '1em', textAlign: 'center' }}>Registered</TableCell>
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
            {persons.map((person) => {
              const rankingResult =
                !isNaN(person?.seedResult?.rankingResult) &&
                formatCentiseconds(person.seedResult.rankingResult);

              const totalStaffAssignments = person.assignments
                .filter((a) => a.assignmentCode.indexOf('staff-') > -1)
                .reduce((acc, assignment) => {
                  return {
                    ...acc,
                    [assignment.assignmentCode]: (acc[assignment.assignmentCode] || 0) + 1,
                  };
                }, {});

              return (
                <TableRow
                  hover
                  key={person.registrantId}
                  className={clsx({
                    [classes.firstTimer]: acceptedRegistration(person) && !person.wcaId,
                    [classes.delegateOrOrganizer]:
                      acceptedRegistration(person) && isOrganizerOrDelegate(person),
                    [classes.disabled]: !acceptedRegistration(person),
                  })}>
                  <TableCell>{person?.seedResult?.ranking}</TableCell>
                  <TableCell>
                    {person.name}{' '}
                    {!person.wcaId && (
                      <Tooltip title="newcomer">
                        <EmojiPeople />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{rankingResult}</TableCell>
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
                    {Object.keys(totalStaffAssignments)
                      .filter((key) => Assignments.find((a) => a.id === key))
                      .sort((a, b) => a.localeCompare(b))
                      .map((key, index, arry) => {
                        const assignment = Assignments.find((a) => a.id === key);
                        if (!assignment) return '';

                        return (
                          <div style={{ marginRight: '0.25em', display: 'inline' }}>
                            <b>{totalStaffAssignments[key]}</b>
                            {assignment.letter}
                            {index < arry.length - 1 ? ', ' : ''}
                          </div>
                        );
                      })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {/* <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>{'Total Competitors'}</TableCell>
              {groupsRooms.map((room) =>
                groups
                  .filter((group) => group.parent.room.name === room.name)
                  .map((groupActivity) => (
                    <TableCell>
                      {personsForActivityId(groupActivity.id, 'competitor').length}
                    </TableCell>
                  ))
              )}
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>{'Total Judges'}</TableCell>
              {groupsRooms.map((room) =>
                groups
                  .filter((group) => group.parent.room.name === room.name)
                  .map((groupActivity) => (
                    <TableCell>
                      {personsForActivityId(groupActivity.id, 'staff-judge').length}
                    </TableCell>
                  ))
              )}
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>{'Total Scramblers'}</TableCell>
              {groupsRooms.map((room) =>
                groups
                  .filter((group) => group.parent.room.name === room.name)
                  .map((groupActivity) => (
                    <TableCell>
                      {personsForActivityId(groupActivity.id, 'staff-scrambler').length}
                    </TableCell>
                  ))
              )}
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>{'Total Runners'}</TableCell>
              {groupsRooms.map((room) =>
                groups
                  .filter((group) => group.parent.room.name === room.name)
                  .map((groupActivity) => (
                    <TableCell>
                      {personsForActivityId(groupActivity.id, 'staff-runner').length}
                    </TableCell>
                  ))
              )}
              <TableCell></TableCell>
            </TableRow>
          </TableFooter> */}
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

export default ConfigureAssignmentsDialog;
