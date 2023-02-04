import { formatCentiseconds } from '@wca/helpers';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
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
import { selectWcifRooms } from '../../store/selectors';

interface AssignmentsTableProps {
  activityCode: string;
  competitorSort: 'speed' | 'name';
  showAllCompetitors: boolean;
  onAssignmentClick: (registrantId: number, groupActivityId: number) => void;
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
  onAssignmentClick,
}: AssignmentsTableProps) {
  const wcif = useAppSelector((state) => state.wcif);
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode);
  const classes = useStyles();
  const wcifRooms = useAppSelector((state) => selectWcifRooms(state));

  const groups = findGroupActivitiesByRound(wcif, activityCode);

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
    if (!roundNumber || !event || !round) {
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
              {'rankingResult' in person?.seedResult &&
                !isNaN(+person?.seedResult?.rankingResult) &&
                formatCentiseconds(+person.seedResult.rankingResult)}
            </TableCell>
            <TableCell
              style={{
                paddingTop: 0,
                paddingBottom: 0,
                textAlign: 'center',
              }}>
              {person?.registration?.eventIds?.includes(eventId) ? (
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
                    onClick={() => onAssignmentClick(person.registrantId, groupActivity.id)}
                  />
                ))
            )}
            <TableCell>
              {person?.assignments?.filter((a) => a.assignmentCode.startsWith('staff-'))?.length}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
