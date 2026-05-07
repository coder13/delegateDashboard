import { hasDistributedAttempts, parseActivityCode } from '../lib/domain/activities';
import { type ActivityWithParent } from '../lib/domain/types';
import Button from '@mui/material/Button';
import { type Person } from '@wca/helpers';

interface RoundActionButtonsProps {
  groups: ActivityWithParent[];
  personsAssignedToCompete: Person[];
  personsShouldBeInRound: Person[];
  activityCode: string;
  onConfigureAssignments: () => void;
  onGenerateAssignments: () => void;
  onAssignToRoundAttempt: () => void;
  onResetAttemptAssignments: () => void;
  onConfigureStationNumbers: (activityCode: string) => void;
  onConfigureGroups: () => void;
  onResetAll: () => void;
  onResetNonScrambling: () => void;
  onConfigureGroupCounts: () => void;
  isDistributedAttemptRoundLevel: boolean;
}

export const RoundActionButtons = ({
  groups,
  personsAssignedToCompete,
  personsShouldBeInRound,
  activityCode,
  onConfigureAssignments,
  onGenerateAssignments,
  onAssignToRoundAttempt,
  onResetAttemptAssignments,
  onConfigureStationNumbers,
  onConfigureGroups,
  onResetAll,
  onResetNonScrambling,
  onConfigureGroupCounts,
  isDistributedAttemptRoundLevel,
}: RoundActionButtonsProps) => {
  const { attemptNumber } = parseActivityCode(activityCode);
  const isAttemptActivity = hasDistributedAttempts(activityCode) && attemptNumber !== undefined;

  if (isDistributedAttemptRoundLevel) {
    return (
      <>
        <Button onClick={onConfigureAssignments}>Configure Attempt Assignments</Button>
        <Button onClick={onAssignToRoundAttempt}>Generate Attempt Assignments (All Attempts)</Button>
        <div style={{ display: 'flex', flex: 1 }} />
        <Button color="error" onClick={onResetAttemptAssignments}>
          Reset Attempt Assignments
        </Button>
      </>
    );
  }

  if (groups.length === 0 && isAttemptActivity) {
    if (personsAssignedToCompete.length > 0) {
      return (
        <>
          <Button onClick={onAssignToRoundAttempt}>Assign to Round Attempt</Button>
          <div style={{ display: 'flex', flex: 1 }} />
          <Button color="error" onClick={onResetAttemptAssignments}>
            Reset Attempt Assignments
          </Button>
        </>
      );
    }

    return (
      <>
        <Button onClick={onAssignToRoundAttempt}>Assign to Round Attempt</Button>
        <Button onClick={onConfigureGroupCounts}>Configure Group Counts</Button>
      </>
    );
  }

  if (groups.length === 0) {
    return (
      <>
        <Button onClick={onConfigureGroupCounts}>Configure Group Counts</Button>
      </>
    );
  }

  if (groups.length > 0 && personsAssignedToCompete.length < personsShouldBeInRound.length) {
    return (
      <>
        <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
        <Button onClick={onGenerateAssignments}>Assign Competitor and Judging Assignments</Button>
        <div style={{ display: 'flex', flex: 1 }} />
        <Button onClick={onConfigureGroups}>Configure Groups</Button>
        <Button color="error" onClick={onResetAll}>
          Reset Group Activities
        </Button>
      </>
    );
  }

  if (groups.length > 0 && personsShouldBeInRound.length === 0) {
    return (
      <>
        <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
        <div style={{ display: 'flex', flex: 1 }} />
        <Button onClick={onConfigureGroups}>Configure Groups</Button>
        <Button color="error" onClick={onResetAll}>
          Reset Group Activities
        </Button>
      </>
    );
  }

  if (personsAssignedToCompete.length > 0) {
    return (
      <>
        <Button onClick={onConfigureAssignments}>Configure Assignments</Button>
        <Button onClick={() => onConfigureStationNumbers(activityCode)}>
          Configure Station Numbers
        </Button>
        <div style={{ display: 'flex', flex: 1 }} />
        <Button color="error" onClick={onResetNonScrambling}>
          Reset Competitor and Judging Assignments
        </Button>
      </>
    );
  }

  return (
    <>
      <Button onClick={onConfigureGroupCounts}>Configure Group Counts</Button>
    </>
  );
};
