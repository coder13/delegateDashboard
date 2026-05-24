import { Recipes } from '../lib/recipes';
import { hasDistributedAttempts, parseActivityCode } from '../lib/domain/activities';
import { type ActivityWithParent } from '../lib/domain/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { type Person } from '@wca/helpers';

interface RoundActionButtonsProps {
  groups: ActivityWithParent[];
  personsAssignedToCompete: Person[];
  personsShouldBeInRound: Person[];
  activityCode: string;
  onConfigureAssignments: () => void;
  recipeId: string;
  onChangeRecipeId: (recipeId: string) => void;
  onRunRecipe: () => void;
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
  recipeId,
  onChangeRecipeId,
  onRunRecipe,
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
        <Button onClick={onConfigureAssignments}>Configure Round Attempt Assignments</Button>
        <Button onClick={onAssignToRoundAttempt}>Assign All</Button>
        <Box sx={{ display: 'flex', flex: 1 }} />
        <Button color="error" onClick={onResetAttemptAssignments}>
          Clear Round Attempt Assignments
        </Button>
      </>
    );
  }

  if (groups.length === 0 && isAttemptActivity) {
    if (personsAssignedToCompete.length > 0) {
      return (
        <>
          <Button onClick={onAssignToRoundAttempt}>Assign to Round Attempt</Button>
          <Box sx={{ display: 'flex', flex: 1 }} />
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
        <FormControl size="small" sx={{ minWidth: 220, marginLeft: 2 }}>
          <InputLabel id="recipe-select-label">Recipe</InputLabel>
          <Select
            labelId="recipe-select-label"
            label="Recipe"
            value={recipeId}
            onChange={(e) => onChangeRecipeId(String(e.target.value))}>
            {Recipes.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={onRunRecipe}>Generate</Button>
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
