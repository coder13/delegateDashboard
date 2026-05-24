import type { Competition } from '@wca/helpers';

export type BulkGenerationProgressPhase = 'generating' | 'fixing' | 'staff';

export interface BulkGenerationWorkerRequest {
  type: 'runBulkGeneration';
  wcif: Competition;
  recipeId: string;
  roundIds: string[];
}

export interface BulkGenerationWorkerProgress {
  type: 'progress';
  phase: BulkGenerationProgressPhase;
  roundId?: string;
}

export interface BulkGenerationWorkerComplete {
  type: 'complete';
  wcif: Competition;
}

export interface BulkGenerationWorkerError {
  type: 'error';
  message: string;
}

export type BulkGenerationWorkerResponse =
  | BulkGenerationWorkerProgress
  | BulkGenerationWorkerComplete
  | BulkGenerationWorkerError;
