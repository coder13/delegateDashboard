import { type ActivityWithParent } from '../../../lib/domain/types';
import Button from '@mui/material/Button';
import { type Person } from '@wca/helpers';

interface RoundActionButtonsProps {
  groups: ActivityWithParent[];
  personsAssignedToCompete: Person[];
  personsShouldBeInRound: Person[];
  activityCode: string;
  onConfigureAssignments: () => void;
  onGenerateAssignments: () => void;
  onConfigureStationNumbers: (activityCode: string) => void;
  onConfigureGroups: () => void;
  onResetAll: () => void;
  onResetNonScrambling: () => void;
  onConfigureGroupCounts: () => void;
}

export const RoundActionButtons = ({
  groups,
  personsAssignedToCompete,
  personsShouldBeInRound,
  activityCode,
  onConfigureAssignments,
  onGenerateAssignments,
  onConfigureStationNumbers,
  onConfigureGroups,
  onResetAll,
  onResetNonScrambling,
  onConfigureGroupCounts,
}: RoundActionButtonsProps) => {
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
