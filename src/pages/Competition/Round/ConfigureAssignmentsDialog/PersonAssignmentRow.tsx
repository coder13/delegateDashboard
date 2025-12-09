import { type ActivityWithParent, type ActivityWithRoom } from '../../../../lib/domain/activities';
import { roundFormatById } from '../../../../lib/domain/events';
import { acceptedRegistration, isOrganizerOrDelegate } from '../../../../lib/domain/persons';
import TableAssignmentCell from '../TableAssignmentCell';
import StaffAssignmentsSummary from './StaffAssignmentsSummary';
import type { PersonWithSeedResult, Room } from './types';
import { EmojiPeople } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { Checkbox, TableCell, TableRow, Tooltip } from '@mui/material';
import { grey, red, yellow } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import type { EventId, Person, Round } from '@wca/helpers';
import { formatCentiseconds } from '@wca/helpers';
import clsx from 'clsx';
import { memo } from 'react';

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
}));

interface PersonAssignmentRowProps {
  person: PersonWithSeedResult;
  eventId: EventId;
  groups: ActivityWithParent[];
  groupsRooms: Room[];
  round: Round;
  featuredCompetitors: number[];
  getAssignmentCodeForPersonGroup: (registrantId: number, activityId: number) => string | undefined;
  handleUpdateAssignmentForPerson: (registrantId: number, activityId: number) => () => void;
  toggleFeaturedCompetitor: (person: Person) => void;
}

const PersonAssignmentRow = memo(
  ({
    person,
    eventId,
    groups,
    groupsRooms,
    round,
    featuredCompetitors,
    getAssignmentCodeForPersonGroup,
    handleUpdateAssignmentForPerson,
    toggleFeaturedCompetitor,
  }: PersonAssignmentRowProps) => {
    const classes = useStyles();

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
            [assignment.assignmentCode]:
              (acc[assignment.assignmentCode as keyof typeof acc] || 0) + 1,
          };
        }, {} as Record<string, number>) || {};

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
          {person?.registration?.eventIds?.includes(eventId) && <CheckIcon fontSize="small" />}
        </TableCell>
        {groupsRooms.map((room) =>
          groups
            .filter((group) => (group.parent as ActivityWithRoom).room.name === room.name)
            .map((groupActivity) => (
              <TableAssignmentCell
                key={groupActivity.id}
                value={getAssignmentCodeForPersonGroup(person.registrantId, groupActivity.id)}
                onClick={handleUpdateAssignmentForPerson(person.registrantId, groupActivity.id)}
              />
            ))
        )}
        <TableCell>
          <Checkbox checked={isFeatured} onClick={() => toggleFeaturedCompetitor(person)} />
        </TableCell>

        <TableCell>
          <StaffAssignmentsSummary totalStaffAssignments={totalStaffAssignments} />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    // Custom equality check to prevent unnecessary re-renders
    return (
      prevProps.person.registrantId === nextProps.person.registrantId &&
      prevProps.person.assignments === nextProps.person.assignments &&
      prevProps.featuredCompetitors === nextProps.featuredCompetitors &&
      prevProps.groups === nextProps.groups
    );
  }
);

PersonAssignmentRow.displayName = 'PersonAssignmentRow';

export default PersonAssignmentRow;
