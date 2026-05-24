import { runBulkRecipesOnWcif } from '../../../lib/recipes/runRecipeOnWcif';
import type {
  BulkGenerationWorkerRequest,
  BulkGenerationWorkerResponse,
} from './bulkGenerationWorkerTypes';

const workerScope = self as unknown as {
  postMessage: (message: BulkGenerationWorkerResponse) => void;
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<BulkGenerationWorkerRequest>) => void
  ) => void;
};

workerScope.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type !== 'runBulkGeneration') {
    return;
  }

  try {
    const wcif = runBulkRecipesOnWcif(message.wcif, {
      recipeId: message.recipeId,
      roundIds: message.roundIds,
      onProgress: (progress) => {
        workerScope.postMessage({ type: 'progress', ...progress });
      },
    });

    workerScope.postMessage({ type: 'complete', wcif });
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Bulk generation failed',
    });
  }
});
