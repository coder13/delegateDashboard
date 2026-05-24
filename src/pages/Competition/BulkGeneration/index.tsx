import { BulkRoundTable } from './BulkRoundTable';
import { BulkRoundGroupCountsDialog } from './BulkRoundGroupCountsDialog';
import { BulkRoundPreviewDialog } from './BulkRoundPreviewDialog';
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
import { partialUpdateWCIF } from '../../../store/actions';
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
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BulkGenerationWorkerRequest,
  BulkGenerationWorkerResponse,
} from './bulkGenerationWorkerTypes';

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

const progressText = (
  progress: Extract<BulkGenerationWorkerResponse, { type: 'progress' }>,
  labelForRound: (roundId: string) => string
) => {
  if (progress.phase === 'fixing') {
    return 'Fixing group assignments';
  }

  if (progress.roundId && progress.phase === 'staff') {
    return `Generating staff assignments for ${labelForRound(progress.roundId)}`;
  }

  if (progress.roundId) {
    return `Generating for ${labelForRound(progress.roundId)}`;
  }

  return 'Generating';
};

const BulkGenerationPage = () => {
  const dispatch = useAppDispatch();
  const wcif = useAppSelector((state) => state.wcif);
  const workerRef = useRef<Worker | null>(null);
  const { setBreadcrumbs } = useBreadcrumbs();
  const rows = useMemo(() => (wcif ? buildBulkRoundRows(wcif) : []), [wcif]);
  const [recipeId, setRecipeId] = useState('pnw');
  const [orderedRoundIds, setOrderedRoundIds] = useState<string[]>([]);
  const [selectedRoundIds, setSelectedRoundIds] = useState<Set<string>>(new Set());
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [previewRoundId, setPreviewRoundId] = useState<string | null>(null);
  const [configureGroupsRoundId, setConfigureGroupsRoundId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ text: 'Bulk Generate' }]);
  }, [setBreadcrumbs]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    []
  );

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
  const generating = Boolean(generationStatus);
  const labelForRound = (roundId: string) =>
    rows.find((row) => row.roundId === roundId)?.label ?? roundId;

  const handleToggleRound = (roundId: string) => {
    if (generating) {
      return;
    }

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
    if (generating) {
      return;
    }

    setOrderedRoundIds((currentRoundIds) => {
      const nextRoundIds = moveRoundId(currentRoundIds, roundId, direction);
      if (wcif?.id) {
        setLocalStorage(roundOrderStorageKey(wcif.id), JSON.stringify(nextRoundIds));
      }
      return nextRoundIds;
    });
  };

  const handleResetOrder = () => {
    if (generating) {
      return;
    }

    const scheduleOrder = scheduleOrderedRoundIds(rows);
    if (wcif?.id) {
      setLocalStorage(roundOrderStorageKey(wcif.id), JSON.stringify(scheduleOrder));
    }
    setOrderedRoundIds(scheduleOrder);
  };

  const handleGenerate = () => {
    if (!wcif || selectedOrderedRoundIds.length === 0 || generating) {
      return;
    }

    workerRef.current?.terminate();
    const worker = new Worker(new URL('./bulkGeneration.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    setGenerationError(null);
    setGenerationStatus('Starting bulk generation');

    worker.onmessage = (event: MessageEvent<BulkGenerationWorkerResponse>) => {
      const message = event.data;

      if (message.type === 'progress') {
        setGenerationStatus(progressText(message, labelForRound));
        return;
      }

      if (message.type === 'complete') {
        dispatch(
          partialUpdateWCIF({
            events: message.wcif.events,
            persons: message.wcif.persons,
            schedule: message.wcif.schedule,
          })
        );
        setGenerationStatus(null);
        worker.terminate();
        workerRef.current = null;
        return;
      }

      setGenerationError(message.message);
      setGenerationStatus(null);
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = () => {
      setGenerationError('Bulk generation failed');
      setGenerationStatus(null);
      worker.terminate();
      workerRef.current = null;
    };

    const message: BulkGenerationWorkerRequest = {
      type: 'runBulkGeneration',
      wcif,
      recipeId,
      roundIds: selectedOrderedRoundIds,
    };
    worker.postMessage(message);
  };

  return (
    <Stack spacing={2}>
      <BulkRoundPreviewDialog
        wcif={wcif}
        roundId={previewRoundId}
        onClose={() => setPreviewRoundId(null)}
      />
      <BulkRoundGroupCountsDialog
        wcif={wcif}
        roundId={configureGroupsRoundId}
        onClose={() => setConfigureGroupsRoundId(null)}
      />

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
            disabled={generating}
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
          disabled={generating || selectedOrderedRoundIds.length === 0}
          onClick={handleGenerate}>
          Generate
        </Button>
      </Stack>

      {generationStatus && <Alert severity="info">{generationStatus}</Alert>}
      {generationError && <Alert severity="error">{generationError}</Alert>}

      {orderedRows.length === 0 ? (
        <Alert severity="warning">No normal non-distributed rounds found.</Alert>
      ) : (
        <BulkRoundTable
          rows={orderedRows}
          selectedRoundIds={selectedRoundIds}
          disabled={generating}
          onToggleRound={handleToggleRound}
          onMoveRound={handleMoveRound}
          onPreviewRound={setPreviewRoundId}
          onConfigureGroups={setConfigureGroupsRoundId}
        />
      )}

      <Stack direction="row" justifyContent="flex-end">
        <Button
          startIcon={<RestartAltIcon />}
          disabled={generating || orderedRows.length === 0}
          onClick={handleResetOrder}>
          Reset to Schedule Order
        </Button>
      </Stack>
    </Stack>
  );
};

export default BulkGenerationPage;
