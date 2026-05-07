import Assignments from '../../config/assignments';
import TableAssignmentCell from '../../components/TableAssignmentCell';
import { activityCodeToName, parseActivityCode } from '../../lib/domain/activities';
import type { ActivityWithParent } from '../../lib/domain/activities';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  bulkRemovePersonAssignments,
  generateRoundAttemptAssignments,
  upsertPersonAssignments,
} from '../../store/actions';
import { selectWcifRooms } from '../../store/selectors';
import AssignmentsTableHeader from './AssignmentsTableHeader';
import AssignmentsToolbar from './AssignmentsToolbar';
import PersonAssignmentRow from './PersonAssignmentRow';
import { useAssignmentHandlers } from './hooks/useAssignmentHandlers';
import { useFeaturedCompetitors } from './hooks/useFeaturedCompetitors';
import { usePersonsData } from './hooks/usePersonsData';
import type { CompetitorSort } from './types';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/system';
import type { Activity, EventId, Round } from '@wca/helpers';
import { flatten } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ConfigureAssignmentsDialog = ({
  open,
  onClose,
  round,
  activityCode,
  groups,
  isDistributedAttemptRoundLevel,
  distributedAttemptGroups,
}: {
  open: boolean;
  onClose: () => void;
  round: Round;
  activityCode: string;
  groups: ActivityWithParent[];
  isDistributedAttemptRoundLevel: boolean;
  distributedAttemptGroups: Array<{
    attemptNumber: number;
    activities: ActivityWithParent[];
  }>;
}) => {
  const wcif = useAppSelector((state) => state.wcif);
  const { eventId, roundNumber } = parseActivityCode(activityCode) as {
    eventId: EventId;
    roundNumber: number;
  };
  const event = wcif?.events?.find((e) => e.id === eventId);
  const wcifRooms = useAppSelector((state) => selectWcifRooms(state));

  const dispatch = useAppDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [showAllCompetitors, setShowAllCompetitors] = useState(isDistributedAttemptRoundLevel);
  const [paintingAssignmentCode, setPaintingAssignmentCode] = useState('staff-scrambler');
  const [competitorSort, setCompetitorSort] = useState<CompetitorSort>('speed');
  const [showCompetitorsNotInRound, setShowCompetitorsNotInRound] = useState(false);

  const groupsRooms = useMemo(
    () =>
      wcifRooms.filter((room) =>
        flatten(room.activities.map((activity: Activity) => activity.childActivities)).some(
          (activity: Activity) => groups.find((g) => g.id === activity.id)
        )
      ),
    [groups, wcifRooms]
  );

  const persons = usePersonsData(
    wcif,
    event,
    round,
    activityCode,
    roundNumber,
    showAllCompetitors,
    showCompetitorsNotInRound,
    competitorSort,
    eventId
  );

  const { featuredCompetitors, toggleFeaturedCompetitor } = useFeaturedCompetitors(
    groups,
    dispatch
  );

  const {
    getAssignmentCodeForPersonGroup,
    handleUpdateAssignmentForPerson,
    handleResetAssignments,
  } = useAssignmentHandlers(persons, groups, paintingAssignmentCode, dispatch);

  const getCompetitorAssignmentForPersonActivity = useCallback(
    (registrantId: number, activityId: number) =>
      persons
        .find((p) => p.registrantId === registrantId)
        ?.assignments?.find((a) => a.activityId === activityId && a.assignmentCode === 'competitor'),
    [persons]
  );

  const toggleCompetitorAssignmentForPersonAttemptActivity = useCallback(
    (registrantId: number, activityId: number) => () => {
      const existing = getCompetitorAssignmentForPersonActivity(registrantId, activityId);

      if (existing) {
        dispatch(
          bulkRemovePersonAssignments([
            {
              registrantId,
              activityId,
              assignmentCode: 'competitor',
            },
          ])
        );
        return;
      }

      dispatch(
        upsertPersonAssignments(registrantId, [
          {
            activityId,
            assignmentCode: 'competitor',
            stationNumber: null,
          },
        ])
      );
    },
    [dispatch, getCompetitorAssignmentForPersonActivity]
  );

  const assignAllToAttempt = useCallback(
    (attemptNumber: number) => {
      dispatch(generateRoundAttemptAssignments(`${round.id}-a${attemptNumber}`));
    },
    [dispatch, round.id]
  );

  const clearAttemptAssignments = useCallback(
    (attemptNumber: number) => {
      const activityIds = distributedAttemptGroups
        .find((group) => group.attemptNumber === attemptNumber)
        ?.activities.map((activity) => activity.id);

      if (!activityIds?.length) {
        return;
      }

      dispatch(
        bulkRemovePersonAssignments(
          activityIds.map((activityId) => ({
            activityId,
            assignmentCode: 'competitor',
          }))
        )
      );
    },
    [dispatch, distributedAttemptGroups]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey) {
      return;
    }

    const assignment = Assignments.find((a) => a.key === e.key);
    if (assignment) {
      setPaintingAssignmentCode(assignment.id);
    }

    if (e.key === 'a') {
      setShowAllCompetitors((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ paddingTop: '0.25em', paddingBottom: '0.25em' }}>
        Configuring Assignments For {activityCodeToName(activityCode)}
      </DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        {isDistributedAttemptRoundLevel ? (
          <>
            <Stack direction="row" gap={1} sx={{ p: 2, flexWrap: 'wrap' }}>
              {distributedAttemptGroups.map((attemptGroup) => (
                <Box key={attemptGroup.attemptNumber} sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`Attempt ${attemptGroup.attemptNumber}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Button
                    size="small"
                    onClick={() => assignAllToAttempt(attemptGroup.attemptNumber)}>
                    Assign All
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => clearAttemptAssignments(attemptGroup.attemptNumber)}>
                    Clear
                  </Button>
                </Box>
              ))}
            </Stack>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '1em' }}>#</TableCell>
                  <TableCell style={{ width: '20%' }}>Name</TableCell>
                  <TableCell style={{ width: '1em' }}>Age</TableCell>
                  <TableCell style={{ width: '1em', textAlign: 'center' }}>Seed Result</TableCell>
                  <TableCell style={{ width: '1em', textAlign: 'center' }}>Registered</TableCell>
                  {distributedAttemptGroups.map((attemptGroup) => (
                    <TableCell
                      key={`attempt-${attemptGroup.attemptNumber}`}
                      style={{ textAlign: 'center' }}
                      colSpan={attemptGroup.activities.length}>
                      Attempt {attemptGroup.attemptNumber}
                    </TableCell>
                  ))}
                  <TableCell style={{ width: '1em' }}>Stream</TableCell>
                  <TableCell style={{ width: '1em' }}>Total Staff Assignments</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  {distributedAttemptGroups.flatMap((attemptGroup) =>
                    attemptGroup.activities.map((activity) => {
                      const parentRoomName =
                        typeof activity.parent === 'object' && 'room' in activity.parent
                          ? activity.parent.room.name
                          : '';
                      return (
                        <TableCell key={activity.id} style={{ textAlign: 'center', width: '1em' }}>
                          {parentRoomName}
                        </TableCell>
                      );
                    })
                  )}
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {persons?.map((person) => (
                  <PersonAssignmentRow
                    key={person.registrantId}
                    person={person}
                    eventId={eventId}
                    groups={[]}
                    groupsRooms={[]}
                    round={round}
                    featuredCompetitors={featuredCompetitors}
                    getAssignmentCodeForPersonGroup={() => undefined}
                    handleUpdateAssignmentForPerson={() => () => undefined}
                    toggleFeaturedCompetitor={toggleFeaturedCompetitor}
                    additionalAssignmentCells={distributedAttemptGroups.flatMap((attemptGroup) =>
                      attemptGroup.activities.map((activity) => (
                        <TableAssignmentCell
                          key={`${person.registrantId}-${activity.id}`}
                          value={
                            getCompetitorAssignmentForPersonActivity(person.registrantId, activity.id)
                              ? 'competitor'
                              : undefined
                          }
                          onClick={toggleCompetitorAssignmentForPersonAttemptActivity(
                            person.registrantId,
                            activity.id
                          )}
                        />
                      ))
                    )}
                  />
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <>
            <AssignmentsToolbar
              paintingAssignmentCode={paintingAssignmentCode}
              setPaintingAssignmentCode={setPaintingAssignmentCode}
              competitorSort={competitorSort}
              setCompetitorSort={setCompetitorSort}
              showAllCompetitors={showAllCompetitors}
              setShowAllCompetitors={setShowAllCompetitors}
              showCompetitorsNotInRound={showCompetitorsNotInRound}
              setShowCompetitorsNotInRound={setShowCompetitorsNotInRound}
              onResetAssignments={handleResetAssignments}
            />

            <Table stickyHeader size="small">
              <AssignmentsTableHeader
                groupsRooms={groupsRooms}
                groups={groups}
                activityCode={activityCode}
              />
              <TableBody>
                {persons?.map((person) => (
                  <PersonAssignmentRow
                    key={person.registrantId}
                    person={person}
                    eventId={eventId}
                    groups={groups}
                    groupsRooms={groupsRooms}
                    round={round}
                    featuredCompetitors={featuredCompetitors}
                    getAssignmentCodeForPersonGroup={getAssignmentCodeForPersonGroup}
                    handleUpdateAssignmentForPerson={handleUpdateAssignmentForPerson}
                    toggleFeaturedCompetitor={toggleFeaturedCompetitor}
                  />
                ))}
              </TableBody>
            </Table>
          </>
        )}
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
