import { type ActivityWithParent, type ActivityWithRoom } from '../../lib/domain/activities';
import { roundFormatById } from '../../lib/domain/events';
import { acceptedRegistration, isOrganizerOrDelegate } from '../../lib/domain/persons';
import TableAssignmentCell from '../../components/TableAssignmentCell';
import StaffAssignmentsSummary from './StaffAssignmentsSummary';
import { formatSeedResult } from './formatSeedResult';
import type { PersonWithSeedResult, Room } from './types';
import { EmojiPeople } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { Checkbox, TableCell, TableRow, Tooltip } from '@mui/material';
import { grey, red, yellow } from '@mui/material/colors';
import type { EventId, Person, Round } from '@wca/helpers';
import type { ReactNode } from 'react';

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
  additionalAssignmentCells?: ReactNode;
}

const PersonAssignmentRow = ({
  person,
  eventId,
  groups,
  groupsRooms,
  round,
  featuredCompetitors,
  getAssignmentCodeForPersonGroup,
  handleUpdateAssignmentForPerson,
  toggleFeaturedCompetitor,
  additionalAssignmentCells,
}: PersonAssignmentRowProps) => {
  const roundFormat = roundFormatById(round.format)?.rankingResult || 'single';

  const rankingResult =
    roundFormat === 'average' ? person.seedResult?.average : person.seedResult?.single;

  const formattedRankingResult = formatSeedResult(eventId, roundFormat, rankingResult);

  const totalStaffAssignments =
    person?.assignments
      ?.filter((a) => a.assignmentCode.indexOf('staff-') > -1)
      ?.reduce(
        (acc, assignment) => {
          return {
            ...acc,
            [assignment.assignmentCode]:
              (acc[assignment.assignmentCode as keyof typeof acc] || 0) + 1,
          };
        },
        {} as Record<string, number>
      ) || {};

  const age =
    person.birthdate &&
    Math.floor((Date.now() - new Date(person.birthdate).getTime()) / 1000 / 60 / 60 / 24 / 365.25);

  const isFeatured = featuredCompetitors.includes(person.wcaUserId);
  const isAccepted = acceptedRegistration(person);
  const rowSx = !isAccepted
    ? { backgroundColor: red[50], '&:hover': { backgroundColor: red[100] } }
    : isOrganizerOrDelegate(person)
      ? { backgroundColor: yellow[50], '&:hover': { backgroundColor: yellow[100] } }
      : !person.wcaId
        ? { backgroundColor: grey[50], '&:hover': { backgroundColor: grey[100] } }
        : undefined;

  return (
    <TableRow hover key={person.registrantId} sx={rowSx}>
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
      {additionalAssignmentCells}
      <TableCell>
        <Checkbox checked={isFeatured} onClick={() => toggleFeaturedCompetitor(person)} />
      </TableCell>

      <TableCell>
        <StaffAssignmentsSummary totalStaffAssignments={totalStaffAssignments} />
      </TableCell>
    </TableRow>
  );
};

PersonAssignmentRow.displayName = 'PersonAssignmentRow';

export default PersonAssignmentRow;
