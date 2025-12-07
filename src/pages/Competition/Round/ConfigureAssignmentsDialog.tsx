import AssignmentPicker from '../../../components/AssignmentPicker';
import Assignments from '../../../config/assignments';
import {
  parseActivityCode,
  activityCodeToName,
  ActivityWithParent,
  ActivityWithRoom,
} from '../../../lib/domain/activities';
import { roundFormatById } from '../../../lib/domain/events';
import {
  acceptedRegistration,
  byPROrResult,
  getSeedResult,
  isOrganizerOrDelegate,
  registeredForEvent,
  shouldBeInRound,
} from '../../../lib/domain/persons';
import { parseCompetitorAssignment } from '../../../lib/importExport';
import { flatten } from '../../../lib/utils/utils';
import {
  getGroupifierActivityConfig,
  setGroupifierActivityConfig,
} from '../../../lib/wcif/extensions/groupifier';
import { useAppSelector } from '../../../store';
import {
  upsertPersonAssignments,
  removePersonAssignments,
  bulkRemovePersonAssignments,
  bulkAddPersonAssignments,
  editActivity,
} from '../../../store/actions';
import { selectWcifRooms } from '../../../store/selectors';
import TableAssignmentCell from './TableAssignmentCell';
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
  Typography,
  useMediaQuery,
  Tooltip,
  Box,
  Toolbar,
  Checkbox,
} from '@mui/material';
import { grey, red, yellow } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/system';
import {
  Assignment,
  AttemptResult,
  EventId,
  Person,
  Round,
  formatCentiseconds,
} from '@wca/helpers';
import clsx from 'clsx';
import { useConfirm } from 'material-ui-confirm';
import PapaParse from 'papaparse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

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

// const Toolbar = styled(MuiToolbar)(
//   ({ theme }) => `
//   padding: 0 ${theme.spacing(2)};
//   justify-content: space-between;
// `
// );

function calcRanking(
  person: Person & {
    seedResult?: {
      average?: AttemptResult;
      single?: AttemptResult;
    };
  },
  lastPerson?: Person & {
    seedResult?: {
      ranking?: number;
      average?: AttemptResult;
      single?: AttemptResult;
    };
  }
) {
  if (!lastPerson?.seedResult?.ranking) {
    return 1;
  }

  if (
    (lastPerson?.seedResult?.average &&
      person.seedResult?.average !== lastPerson.seedResult.average) ||
    (lastPerson?.seedResult?.single && person.seedResult?.single !== lastPerson.seedResult.single)
  ) {
    return lastPerson.seedResult.ranking + 1;
  }

  return lastPerson.seedResult.ranking;
}

const ConfigureAssignmentsDialog = ({
  open,
  onClose,
  round,
  activityCode,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  round: Round;
  activityCode: string;
  groups: ActivityWithParent[];
}) => {
  const wcif = useAppSelector((state) => state.wcif);
  const { eventId, roundNumber } = parseActivityCode(activityCode) as {
    eventId: EventId;
    roundNumber: number;
  };
  const event = wcif?.events?.find((e) => e.id === eventId);
  const classes = useStyles();
  const wcifRooms = useAppSelector((state) => selectWcifRooms(state));

  const dispatch = useDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const confirm = useConfirm();

  const [showAllCompetitors, setShowAllCompetitors] = useState(false);
  const [paintingAssignmentCode, setPaintingAssignmentCode] = useState('staff-scrambler');
  const [competitorSort, setCompetitorSort] = useState('speed');
  const [showCompetitorsNotInRound, setShowCompetitorsNotInRound] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
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

  const persons = useMemo(() => {
    if (!wcif?.persons || !event) {
      return [];
    }

    const personsWithSeedResult = wcif.persons
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
        return isRegistered(p) && round && shouldBeInRound(round)(p);
      })
      .map((person) => ({
        ...person,
        seedResult: getSeedResult(wcif, activityCode, person),
      }))
      .sort((a, b) => byPROrResult(event, roundNumber)(a, b));

    return personsWithSeedResult
      .reduce((persons, person) => {
        const lastPerson = persons[persons.length - 1];

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
          p.roles?.some((r) => r.indexOf('staff') > -1)
      )
      .sort((a, b) => {
        if (competitorSort === 'speed') {
          return 0;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    activityCode,
    competitorSort,
    event,
    isRegistered,
    round,
    roundNumber,
    showAllCompetitors,
    showCompetitorsNotInRound,
    wcif,
  ]);

  const personAssignments = useCallback(
    (registrantId) => persons?.find((p) => p.registrantId === registrantId)?.assignments,
    [persons]
  );

  const getAssignmentCodeForPersonGroup = useCallback(
    (registrantId, activityId) => {
      return personAssignments(registrantId)?.find((a) => a.activityId === activityId)
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
            stationNumber: null,
          },
        ])
      );
    }
  };

  const handleResetAssignments = () => {
    confirm({
      title: 'Are you sure you want to reset all assignments and start over',
    }).then(() => {
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

  const onPaste = useCallback((e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) {
      return;
    }
    const data = clipboardData.getData('text');
    if (!data) {
      return;
    }

    const parsedData = PapaParse.parse<{
      id: string;
      g?: string;
      group?: string;
      h?: string;
      helping?: string;
      staff?: string;
    }>(data, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      worker: false,
    });

    if (!parsedData?.data) {
      return;
    }

    confirm({
      title: 'Are you sure',
      description: 'Are you sure you want to overwrite existing data?',
    })
      .then(() => {
        const competitorGroupSizes = {};
        const staffGroupSizes = {};

        const assignments = parsedData.data
          .filter((row) => {
            return !!row.id;
          })
          .flatMap((row) => {
            const a: Array<{
              activityId: number;
              registrantId: number;
              assignment: Assignment;
            }> = [];
            const competitorGroupData = row.g || row.group;

            if (!competitorGroupData) {
              return;
            }

            const parsed = parseCompetitorAssignment(competitorGroupData);

            if (!parsed) {
              return;
            }

            const room = parsed.stage
              ? groupsRooms.find(
                  (r) => r.name[0].toLowerCase() === (parsed.stage as string).toLowerCase()
                )
              : undefined;

            const competitorGroupActivities = groups
              .filter(
                (g) =>
                  parseActivityCode(g.activityCode).groupNumber === parsed.groupNumber &&
                  (room ? (g.parent as ActivityWithRoom).room.id === room.id : true)
              )
              .map((activity) => ({
                g: activity,
                score: competitorGroupSizes[activity.id] || 0,
              }))
              .sort((a, b) => a.score - b.score);

            const competitorGroupActivity = competitorGroupActivities[0].g;

            competitorGroupSizes[competitorGroupActivity.id] =
              (competitorGroupSizes[competitorGroupActivity.id] || 0) + 1;

            a.push({
              activityId: competitorGroupActivity.id,
              registrantId: +row.id,
              assignment: {
                assignmentCode: 'competitor',
                stationNumber: null,
                activityId: competitorGroupActivity.id,
              },
            });

            const helpingGroup = row.h || row.helping || row.staff;
            if (helpingGroup) {
              const assignmentLetter = helpingGroup[0].toLowerCase();
              const staffGroupNumber = helpingGroup[1];
              const assignmentCode = Assignments.find(
                (assignment) => assignment.key.toLowerCase() === assignmentLetter
              )?.id;

              if (!assignmentCode) {
                return;
              }

              const staffGroupActivities = groups
                .filter((g) => {
                  const parsedActivityCode = parseActivityCode(g.activityCode);
                  return parsedActivityCode.groupNumber?.toString() === staffGroupNumber;
                })
                .map((g) => ({
                  g,
                  score: staffGroupSizes?.[assignmentCode]?.[g.id] || 0,
                }))
                .sort((a, b) => a.score - b.score);

              const staffGroupActivity = staffGroupActivities[0].g;

              if (!staffGroupSizes[assignmentCode]) {
                staffGroupSizes[assignmentCode] = {};
              }

              staffGroupSizes[assignmentCode][staffGroupActivity.id] =
                (staffGroupSizes?.[assignmentCode]?.[staffGroupActivity.id] || 0) + 1;

              a.push({
                activityId: staffGroupActivity.id,
                registrantId: +row.id,
                assignment: {
                  assignmentCode,
                  stationNumber: null,
                  activityId: staffGroupActivity.id,
                },
              });
            }

            return a;
          })
          .filter(Boolean) as Array<{
          activityId: number;
          registrantId: number;
          assignment: Assignment;
        }>;

        if (assignments.length === 0) {
          console.error('No assignments found');
        }

        dispatch(
          bulkRemovePersonAssignments(assignments.map((i) => ({ registrantId: i.registrantId })))
        );
        dispatch(bulkAddPersonAssignments(assignments));
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPaste]);

  // Array of wcaUserIds
  const featuredCompetitors = useMemo(
    () =>
      groups.flatMap((activity) => {
        const extensionData = getGroupifierActivityConfig(activity);
        return extensionData?.featuredCompetitorWcaUserIds || [];
      }),
    [groups]
  );

  const toggleFeaturedCompetitor = useCallback(
    (person: Person) => {
      const competingActivity = groups.find((activity) => {
        const assignment = person.assignments?.find(
          (a) => a.activityId === activity.id && a.assignmentCode === 'competitor'
        );
        return !!assignment;
      });

      if (!competingActivity) {
        return;
      }

      const activityFeaturedCompetitors =
        getGroupifierActivityConfig(competingActivity)?.featuredCompetitorWcaUserIds || [];

      const {
        // @ts-expect-error
        parent: __,
        // @ts-expect-error
        room: _,
        ...competingActivityWithoutRoom
      } = competingActivity as ActivityWithRoom | ActivityWithParent;

      const newActivity = setGroupifierActivityConfig(competingActivityWithoutRoom, {
        featuredCompetitorWcaUserIds: activityFeaturedCompetitors.includes(person.wcaUserId)
          ? activityFeaturedCompetitors.filter((id) => id !== person.wcaUserId)
          : [...activityFeaturedCompetitors, person.wcaUserId],
      });

      dispatch(editActivity(competingActivity, newActivity));
    },
    [groups, featuredCompetitors]
  );

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ paddingTop: '0.25em', paddingBottom: '0.25em' }}>
        Configuring Assignments For {activityCodeToName(activityCode)}
      </DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <Toolbar
          className="flex-row"
          sx={(theme) => ({
            padding: theme.spacing(2),
            justifyContent: 'space-between',
          })}>
          <div
            className="flex-grow"
            style={{ display: 'flex', flexGrow: 1, alignItems: 'flex-start' }}>
            <AssignmentPicker value={paintingAssignmentCode} setValue={setPaintingAssignmentCode} />
          </div>
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div
            style={{
              display: 'flex',
              flexGrow: 1,
              justifyContent: 'space-around',
            }}>
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
            id="Configure-assignments-menu"
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
              <TableCell></TableCell>
              {groupsRooms.map((room) => (
                <TableCell
                  key={room.id}
                  style={{ textAlign: 'center' }}
                  colSpan={
                    room.activities.find((ra) => ra.activityCode === activityCode)?.childActivities
                      ?.length ?? 1
                  }>
                  {room.name}
                </TableCell>
              ))}
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ width: '1em' }}>#</TableCell>
              <TableCell style={{ width: '20%' }}>Name</TableCell>
              <TableCell style={{ width: '1em' }}>Age</TableCell>
              <TableCell style={{ width: '1em', textAlign: 'center' }}>Seed Result</TableCell>
              <TableCell style={{ width: '1em', textAlign: 'center' }}>Registered</TableCell>
              {groupsRooms.map((room) =>
                groups
                  .filter((group) => (group.parent as ActivityWithRoom).room.name === room.name)
                  .map((group) => (
                    <TableCell key={group.id} style={{ textAlign: 'center', width: '1em' }}>
                      g{parseActivityCode(group.activityCode).groupNumber}
                    </TableCell>
                  ))
              )}
              <TableCell style={{ width: '1em' }}>Stream</TableCell>
              <TableCell style={{ width: '1em' }}>Total Staff Assignments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {persons?.map((person) => {
              const roundFormat = roundFormatById(round.format)?.rankingResult || 'single';

              const rankingResult =
                roundFormat === 'average' ? person.seedResult?.average : person.seedResult?.single;

              const formattedRankingResult =
                rankingResult && !isNaN(rankingResult) && formatCentiseconds(rankingResult);

              const totalStaffAssignments =
                person?.assignments
                  ?.filter((a) => a.assignmentCode.indexOf('staff-') > -1)
                  ?.reduce((acc, assignment) => {
                    return {
                      ...acc,
                      [assignment.assignmentCode]: (acc[assignment.assignmentCode] || 0) + 1,
                    };
                  }, {}) || {};

              const age =
                person.birthdate &&
                Math.floor(
                  (Date.now() - new Date(person.birthdate).getTime()) / 1000 / 60 / 60 / 24 / 365.25
                );

              const isFeatured = featuredCompetitors.includes(person.wcaUserId);

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
                  <TableCell>{age}</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{formattedRankingResult}</TableCell>
                  <TableCell
                    style={{
                      paddingTop: 0,
                      paddingBottom: 0,
                      textAlign: 'center',
                    }}>
                    {person?.registration?.eventIds?.includes(eventId) && (
                      <CheckIcon fontSize="small" />
                    )}
                  </TableCell>
                  {groupsRooms.map((room) =>
                    groups
                      .filter((group) => (group.parent as ActivityWithRoom).room.name === room.name)
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
                    <Checkbox
                      checked={isFeatured}
                      onClick={() => toggleFeaturedCompetitor(person)}
                    />
                  </TableCell>

                  <TableCell>
                    {Object.keys(totalStaffAssignments)
                      .filter((key) => Assignments.find((a) => a.id === key))
                      .sort((a, b) => a.localeCompare(b))
                      .map((key, index, arry) => {
                        const assignment = Assignments.find((a) => a.id === key);
                        if (!assignment) return '';

                        return (
                          <div
                            style={{
                              marginRight: '0.25em',
                              display: 'inline',
                            }}>
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
        </Table>
      </DialogContent>
      <DialogActions>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
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
            <b>{persons?.length}</b>
          </Typography>
        </Box>
        <div style={{ display: 'flex', flexGrow: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureAssignmentsDialog;
