import { formatCentiseconds } from '@wca/helpers';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { grey, red, yellow } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import {
  parseActivityCode,
  findGroupActivitiesByRound,
  ActivityWithRoom,
} from '../../lib/activities';
import {
  acceptedRegistration,
  byPROrResult,
  getSeedResult,
  isOrganizerOrDelegate,
  registeredForEvent,
  shouldBeInRound,
} from '../../lib/persons';
import { flatten } from '../../lib/utils';
import TableAssignmentCell from '../../pages/Competition/Round/TableAssignmentCell';
import { useAppSelector } from '../../store';
import { upsertPersonAssignments, removePersonAssignments } from '../../store/actions';
import { selectWcifRooms } from '../../store/selectors';

interface AssignmentsTableProps {
  activityCode: string;
  competitorSort: 'speed' | 'name';
  showAllCompetitors: boolean;
}

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

function calcRanking(person, lastPerson) {
  if (!lastPerson?.seedResult?.ranking) {
    return 1;
  }

  if (person?.seedResult?.rankingResult === lastPerson?.seedResult?.rankingResult) {
    return lastPerson.seedResult.ranking;
  }

  return lastPerson.seedResult.ranking + 1;
}

export function AssignmentsTable({
  activityCode,
  competitorSort,
  showAllCompetitors,
}: AssignmentsTableProps) {
  const wcif = useAppSelector((state) => state.wcif);
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode);
  const classes = useStyles();
  const wcifRooms = useAppSelector((state) => selectWcifRooms(state));

  const groups = findGroupActivitiesByRound(wcif, activityCode);

  const dispatch = useDispatch();

  const [paintingAssignmentCode, setPaintingAssignmentCode] = useState('staff-scrambler');
  const [lastPaintingAssignmentCode, setLastPaintingAssignmentCode] = useState('staff-scrambler');

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
    if (!roundNumber) {
      return [];
    }

    return wcif.persons
      .filter((p) => acceptedRegistration(p) && isRegistered(p) && shouldBeInRound(round)(p))
      .map((person) => ({
        ...person,
        seedResult: getSeedResult(wcif, activityCode, person),
      }))
      .sort((a, b) => byPROrResult(event, roundNumber)(a, b))
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
          p.roles.some((r) => r.indexOf('staff') > -1)
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
    wcif,
  ]);

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
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  return (
    <Table stickyHeader size="small">
      <TableHead>
        <TableRow>
          <TableCell style={{ top: -24 }}></TableCell>
          <TableCell style={{ top: -24 }}></TableCell>
          <TableCell style={{ top: -24 }}></TableCell>
          <TableCell style={{ top: -24 }}></TableCell>
          {groupsRooms.map((room) => (
            <TableCell
              key={room.id}
              style={{ top: -24, textAlign: 'center' }}
              colSpan={groups.length / groupsRooms.length}>
              {room.name}
            </TableCell>
          ))}
          <TableCell style={{ top: -24 }}></TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ top: 37 - 24, width: '1em' }}>#</TableCell>
          <TableCell style={{ top: 37 - 24, width: '20%' }}>Name</TableCell>
          <TableCell style={{ top: 37 - 24, width: '1em', textAlign: 'center' }}>
            Seed Result
          </TableCell>
          <TableCell style={{ top: 37 - 24, width: '1em', textAlign: 'center' }}>
            Registered
          </TableCell>
          {groupsRooms.map((room) =>
            groups
              .filter((group) => (group.parent as ActivityWithRoom).room.name === room.name)
              .map((group) => (
                <TableCell
                  key={group.id}
                  style={{ top: 37 - 24, textAlign: 'center', width: '1em' }}>
                  g{parseActivityCode(group.activityCode).groupNumber}
                </TableCell>
              ))
          )}
          <TableCell style={{ top: 37 - 24, width: '1em' }}>Total Staff Assignments</TableCell>
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
            <TableCell>{person?.seedResult?.ranking}</TableCell>
            <TableCell>{person.name}</TableCell>
            <TableCell style={{ textAlign: 'center' }}>
              {!isNaN(person?.seedResult?.rankingResult) &&
                formatCentiseconds(person.seedResult.rankingResult)}
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
                .filter((group) => (group.parent as ActivityWithRoom)?.room?.name === room.name)
                .map((groupActivity) => (
                  <TableAssignmentCell
                    key={groupActivity.id}
                    value={getAssignmentCodeForPersonGroup(person.registrantId, groupActivity.id)}
                    onClick={handleUpdateAssignmentForPerson(person.registrantId, groupActivity.id)}
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
  );
}
