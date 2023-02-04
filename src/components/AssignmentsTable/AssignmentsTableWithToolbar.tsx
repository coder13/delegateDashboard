import { useConfirm } from 'material-ui-confirm';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Switch,
  Toolbar,
} from '@mui/material';
import { findGroupActivitiesByRound, parseActivityCode } from '../../lib/activities';
import {
  acceptedRegistration,
  byPROrResult,
  getSeedResult,
  isOrganizerOrDelegate,
  registeredForEvent,
  shouldBeInRound,
} from '../../lib/persons';
import { useAppSelector } from '../../store';
import {
  upsertPersonAssignments,
  removePersonAssignments,
  bulkRemovePersonAssignments,
} from '../../store/actions';
import { AssignmentsTable } from './AssignmentsTable';

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

interface AssignmentsTableWithToolbarProps {
  activityCode: string;
}

export function AssignmentsTableWithToolbar({ activityCode }: AssignmentsTableWithToolbarProps) {
  const confirm = useConfirm();
  const wcif = useAppSelector((state) => state.wcif);
  const { eventId, roundNumber } = parseActivityCode(activityCode);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds?.find((r) => r.id === activityCode);

  const groups = findGroupActivitiesByRound(wcif, activityCode);

  const dispatch = useDispatch();

  const [showAllCompetitors, setShowAllCompetitors] = useState(false);
  const [paintingAssignmentCode, setPaintingAssignmentCode] = useState('staff-scrambler');
  const [lastPaintingAssignmentCode, setLastPaintingAssignmentCode] = useState('staff-scrambler');
  const [competitorSort, setCompetitorSort] = useState<'speed' | 'name'>('speed');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isRegistered = registeredForEvent(eventId);

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

  const handleResetAssignments = () => {
    confirm({ description: 'Are you sure you want to reset all assignments and start over' }).then(
      () => {
        dispatch(
          bulkRemovePersonAssignments(
            groups.map((groupActivity) => ({
              activityId: groupActivity.id,
            }))
          )
        );
      }
    );
  };

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
          p?.roles?.some((r) => r.indexOf('staff') > -1)
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

  const handleUpdateAssignmentForPerson = (registrantId, activityId) => {
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

  return (
    <>
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
              onChange={(e) => setCompetitorSort(e.target.value as 'speed' | 'name')}>
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
      <AssignmentsTable
        activityCode={activityCode}
        competitorSort={competitorSort}
        showAllCompetitors={showAllCompetitors}
        onAssignmentClick={handleUpdateAssignmentForPerson}
      />
    </>
  );
}
