import Assignments from '../../../../config/assignments';
import { parseActivityCode, activityCodeToName } from '../../../../lib/domain/activities';
import type { ActivityWithParent } from '../../../../lib/domain/activities';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { selectWcifRooms } from '../../../../store/selectors';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
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
  const wcifRooms = useAppSelector((state) => selectWcifRooms(state));

  const dispatch = useAppDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [showAllCompetitors, setShowAllCompetitors] = useState(false);
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
