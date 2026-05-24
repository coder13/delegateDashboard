import { BulkRoundTable } from './BulkRoundTable';
import {
  buildBulkRoundRows,
  defaultSelectedRoundIds,
  mergeRoundOrder,
  scheduleOrderedRoundIds,
} from './bulkRoundRows';
import { getLocalStorage, setLocalStorage } from '../../../lib/api';
import { Recipes } from '../../../lib/recipes';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppDispatch, useAppSelector } from '../../../store';
import { runRecipes } from '../../../store/actions';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

const moveRoundId = (roundIds: string[], roundId: string, direction: -1 | 1) => {
  const fromIndex = roundIds.indexOf(roundId);
  const toIndex = fromIndex + direction;
  if (fromIndex === -1 || toIndex < 0 || toIndex >= roundIds.length) {
    return roundIds;
  }

  const nextRoundIds = [...roundIds];
  const [movedRoundId] = nextRoundIds.splice(fromIndex, 1);
  nextRoundIds.splice(toIndex, 0, movedRoundId);
  return nextRoundIds;
};

const roundOrderStorageKey = (competitionId: string) =>
  `bulk-generation.round-order.${competitionId}`;

const parsePersistedRoundOrder = (value: string | null) => {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((roundId): roundId is string => typeof roundId === 'string')
      : [];
  } catch {
    return [];
  }
};

const BulkGenerationPage = () => {
  const dispatch = useAppDispatch();
  const wcif = useAppSelector((state) => state.wcif);
  const { setBreadcrumbs } = useBreadcrumbs();
  const rows = useMemo(() => (wcif ? buildBulkRoundRows(wcif) : []), [wcif]);
  const [recipeId, setRecipeId] = useState('pnw');
  const [orderedRoundIds, setOrderedRoundIds] = useState<string[]>([]);
  const [selectedRoundIds, setSelectedRoundIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setBreadcrumbs([{ text: 'Bulk Generate' }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!wcif?.id) {
      return;
    }

    const scheduleOrder = scheduleOrderedRoundIds(rows);
    const persistedOrder = parsePersistedRoundOrder(getLocalStorage(roundOrderStorageKey(wcif.id)));
    const nextOrder = mergeRoundOrder(scheduleOrder, persistedOrder);

    setLocalStorage(roundOrderStorageKey(wcif.id), JSON.stringify(nextOrder));
    setOrderedRoundIds(nextOrder);
    setSelectedRoundIds(defaultSelectedRoundIds(rows));
  }, [rows, wcif?.id]);

  const orderedRows = useMemo(
    () =>
      orderedRoundIds
        .map((roundId) => rows.find((row) => row.roundId === roundId))
        .filter((row): row is NonNullable<typeof row> => Boolean(row)),
    [orderedRoundIds, rows]
  );

  const selectedOrderedRoundIds = orderedRows
    .filter((row) => row.selectable && selectedRoundIds.has(row.roundId))
    .map((row) => row.roundId);

  const handleToggleRound = (roundId: string) => {
    if (!rows.find((row) => row.roundId === roundId)?.selectable) {
      return;
    }

    setSelectedRoundIds((currentRoundIds) => {
      const nextRoundIds = new Set(currentRoundIds);
      if (nextRoundIds.has(roundId)) {
        nextRoundIds.delete(roundId);
      } else {
        nextRoundIds.add(roundId);
      }
      return nextRoundIds;
    });
  };

  const handleMoveRound = (roundId: string, direction: -1 | 1) => {
    setOrderedRoundIds((currentRoundIds) => {
      const nextRoundIds = moveRoundId(currentRoundIds, roundId, direction);
      if (wcif?.id) {
        setLocalStorage(roundOrderStorageKey(wcif.id), JSON.stringify(nextRoundIds));
      }
      return nextRoundIds;
    });
  };

  const handleResetOrder = () => {
    const scheduleOrder = scheduleOrderedRoundIds(rows);
    if (wcif?.id) {
      setLocalStorage(roundOrderStorageKey(wcif.id), JSON.stringify(scheduleOrder));
    }
    setOrderedRoundIds(scheduleOrder);
  };

  const handleGenerate = () => {
    dispatch(runRecipes(selectedOrderedRoundIds, recipeId));
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          Bulk Generate
        </Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="bulk-recipe-select-label">Recipe</InputLabel>
          <Select
            labelId="bulk-recipe-select-label"
            label="Recipe"
            value={recipeId}
            onChange={(event) => setRecipeId(String(event.target.value))}>
            {Recipes.map((recipe) => (
              <MenuItem key={recipe.id} value={recipe.id}>
                {recipe.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AutoFixHighIcon />}
          disabled={selectedOrderedRoundIds.length === 0}
          onClick={handleGenerate}>
          Generate
        </Button>
      </Stack>

      <Alert severity="info">
        Only rounds with competitors can be selected. Selected rounds run in the displayed order.
        Existing groups and assignments are preserved.
      </Alert>

      {orderedRows.length === 0 ? (
        <Alert severity="warning">No normal non-distributed rounds found.</Alert>
      ) : (
        <BulkRoundTable
          rows={orderedRows}
          selectedRoundIds={selectedRoundIds}
          onToggleRound={handleToggleRound}
          onMoveRound={handleMoveRound}
        />
      )}

      <Stack direction="row" justifyContent="flex-end">
        <Button
          startIcon={<RestartAltIcon />}
          disabled={orderedRows.length === 0}
          onClick={handleResetOrder}>
          Reset to Schedule Order
        </Button>
      </Stack>
    </Stack>
  );
};

export default BulkGenerationPage;
