import ActionMenu from '../components/ActionMenu';
import { activityCodeToName } from '../lib/domain/activities/activityCode';
import { type ActivityWithRoom } from '../lib/domain/types';
import { formatTimeRange } from '../lib/utils/time';
import { byName } from '../lib/utils/utils';
import { cumulativeGroupCount } from '../lib/wcif/groups';
import { RoundLimitInfo } from './RoundLimitInfo';
import {
  Button,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { type Competition, type Person, type Round } from '@wca/helpers';
import { type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface RoundStatisticsCardProps {
  activityCode: string;
  roundActivities: ActivityWithRoom[];
  round: Round;
  eventId: string;
  personsShouldBeInRound: Person[];
  personsAssigned: Person[];
  personsAssignedWithCompetitorAssignmentCount: number;
  wcif: Competition | null;
  onOpenRawRoundData: () => void;
  onOpenRawActivitiesData: () => void;
  onOpenPersonsDialog: (title: string, persons: Person[]) => void;
  onOpenPersonsAssignmentsDialog: () => void;
  actionButtons: ReactNode;
  linkedRounds?: Array<{
    roundId: string;
    onCopyAssignments?: () => void;
  }>;
  competitionId?: string;
}

export const RoundStatisticsCard = ({
  activityCode,
  roundActivities,
  round,
  eventId,
  personsShouldBeInRound,
  personsAssigned,
  personsAssignedWithCompetitorAssignmentCount,
  wcif,
  onOpenRawRoundData,
  onOpenRawActivitiesData,
  onOpenPersonsDialog,
  onOpenPersonsAssignmentsDialog,
  actionButtons,
  linkedRounds = [],
  competitionId,
}: RoundStatisticsCardProps) => {
  const event = wcif?.events.find((candidate) => candidate.id === eventId) ?? null;

  return (
    <Card>
      <CardHeader
        title={activityCodeToName(activityCode)}
        action={
          <ActionMenu
            items={[
              {
                label: 'Dangerously Edit Raw Round Data',
                onClick: onOpenRawRoundData,
              },
              {
                label: 'Dangerously Edit Raw Round Activities Data',
                onClick: onOpenRawActivitiesData,
              },
            ]}
          />
        }
      />
      {linkedRounds.length > 0 && (
        <>
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Linked Rounds
            </Typography>
            <List dense disablePadding>
              {linkedRounds.map(({ roundId, onCopyAssignments }) => (
                <ListItemButton
                  key={roundId}
                  selected={roundId === activityCode}
                  disabled={!competitionId || roundId === activityCode}
                  component={competitionId && roundId !== activityCode ? RouterLink : 'div'}
                  to={
                    competitionId && roundId !== activityCode
                      ? `/competitions/${competitionId}/events/${roundId}`
                      : undefined
                  }
                  sx={{ borderRadius: 1 }}>
                  <ListItemText primary={activityCodeToName(roundId)} />
                  {onCopyAssignments && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onCopyAssignments();
                      }}>
                      Copy assignments to this round
                    </Button>
                  )}
                </ListItemButton>
              ))}
            </List>
          </CardContent>
          <Divider />
        </>
      )}
      <List dense subheader={<ListSubheader id="stages">Stages</ListSubheader>}>
        {roundActivities.map(({ id, startTime, endTime, room }) => (
          <ListItemButton key={id}>
            {room?.name}: {new Date(startTime).toLocaleDateString()}{' '}
            {formatTimeRange(startTime, endTime)} (
            {(new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60} Minutes)
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ textAlign: 'center' }}>Round Size</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
              Persons In Round
              <br />
              <Typography variant="caption">Based on WCA-Live data</Typography>
            </TableCell>
            <TableCell sx={{ textAlign: 'center' }}>Competitors assigned</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>Persons with any assignment</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
              Groups Configured <br />
              (per stage)
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}
              onClick={() =>
                onOpenPersonsDialog(
                  'People who should be in the round',
                  personsShouldBeInRound?.sort(byName) || []
                )
              }>
              {personsShouldBeInRound?.length || '???'}
            </TableCell>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}
              onClick={() =>
                onOpenPersonsDialog(
                  'People in the round according to wca-live',
                  round.results.length > 0
                    ? round.results
                        .map(({ personId }) =>
                          wcif?.persons.find(({ registrantId }) => registrantId === personId)
                        )
                        .filter((p): p is Person => p !== undefined)
                        .sort(byName) || []
                    : []
                )
              }>
              {round?.results?.length}
            </TableCell>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}>
              {personsAssignedWithCompetitorAssignmentCount}
            </TableCell>
            <TableCell
              className="MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButtonBase-root MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium css-1rmkli1-MuiButtonBase-root-MuiButton-root-MuiTableCell-root"
              sx={{ textAlign: 'center' }}
              onClick={onOpenPersonsAssignmentsDialog}>
              {personsAssigned.length}
            </TableCell>
            <TableCell sx={{ textAlign: 'center' }}>{cumulativeGroupCount(round)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <RoundLimitInfo
        event={event}
        round={round}
        eventId={eventId}
        personsShouldBeInRound={personsShouldBeInRound}
      />
      <Divider />

      <CardActions>{actionButtons}</CardActions>
    </Card>
  );
};
