import {
  createWriteGenLayerClient,
  getReadOnlyGenLayerClient,
  type EthereumProviderLike,
  type GenLayerReadClient,
} from '../../lib/genlayerClient';
import { parseCandidateId } from '../../lib/candidateId';
import { isCandidateEvaluationEligible } from '../../lib/evaluationEligibility';
import {
  clearEvaluationSnapshot,
  loadEvaluationSnapshot,
  saveEvaluationSnapshot,
} from '../../lib/evaluationReceipt';
import { getUpdateSealConfigResult, type UpdateSealConfigResult } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import { candidateExists, getCandidate, getPackage } from '../../services/updateSealContract';
import {
  confirmEvaluationFromReceipt,
  estimateEvaluateCandidateFees,
  evaluateCandidate as writeEvaluateCandidate,
  waitForExistingEvaluation,
} from '../../services/updateSealWrites';
import type {
  EvaluationConfirmation,
  EvaluationFeeEstimate,
  OnChainCandidateRecord,
  OnChainPackageRecord,
  PendingEvaluationSnapshot,
} from '../../types/updateSeal';

export type EvaluatePhase =
  | 'idle'
  | 'config_invalid'
  | 'wallet_disconnected'
  | 'wrong_network'
  | 'candidate_not_pending'
  | 'candidate_not_evaluatable'
  | 'candidate_not_found'
  | 'invalid_candidate_id'
  | 'estimating_fees'
  | 'fee_estimation_failed'
  | 'fee_estimate_invalid'
  | 'ready'
  | 'stale_confirmation'
  | 'awaiting_wallet'
  | 'submitted'
  | 'waiting_consensus'
  | 'finalized'
  | 'user_rejected'
  | 'transaction_rejected'
  | 'status_unknown'
  | 'readback_mismatch'
  | 'decision_integrity_error'
  | 'evaluation_already_pending'
  | 'write_disabled';

export type EvaluateCandidateResult =
  | {
      ok: true;
      phase: 'finalized';
      success: Awaited<ReturnType<typeof writeEvaluateCandidate>>;
    }
  | {
      ok: true;
      phase: 'ready';
      confirmation: EvaluationConfirmation;
      estimate: EvaluationFeeEstimate;
    }
  | {
      ok: false;
      phase: Exclude<EvaluatePhase, 'idle' | 'estimating_fees' | 'awaiting_wallet' | 'submitted' | 'waiting_consensus' | 'ready' | 'finalized'>;
      message: string;
      snapshot?: PendingEvaluationSnapshot;
      transactionHash?: string;
    };

export interface EvaluateCandidateOrchestrationDeps {
  getConfigResult?: () => UpdateSealConfigResult;
  getCandidateFn?: typeof getCandidate;
  getPackageFn?: typeof getPackage;
  candidateExistsFn?: typeof candidateExists;
  estimateFn?: typeof estimateEvaluateCandidateFees;
  evaluateFn?: typeof writeEvaluateCandidate;
  createWriteClientFn?: typeof createWriteGenLayerClient;
  waitForExistingFn?: typeof waitForExistingEvaluation;
  getReadClientFn?: () => Pick<GenLayerReadClient, 'waitForTransactionReceipt'>;
  loadSnapshotFn?: typeof loadEvaluationSnapshot;
  saveSnapshotFn?: typeof saveEvaluationSnapshot;
  clearSnapshotFn?: typeof clearEvaluationSnapshot;
}

export interface LiveEvaluateInput {
  candidateId: string;
  connectedAddress: string | null;
  isConnected: boolean;
  chainId: number;
  provider: EthereumProviderLike | null;
  unresolvedSnapshot?: PendingEvaluationSnapshot | null;
  configResult?: UpdateSealConfigResult;
}

function phaseFromError(error: UpdateSealError, snapshot?: PendingEvaluationSnapshot): EvaluateCandidateResult {
  const map: Record<string, Extract<EvaluateCandidateResult, { ok: false }>['phase']> = {
    CONFIG_INVALID: 'config_invalid',
    WRITE_DISABLED: 'write_disabled',
    WALLET_DISCONNECTED: 'wallet_disconnected',
    WALLET_REQUIRED: 'wallet_disconnected',
    WRONG_NETWORK: 'wrong_network',
    INVALID_CANDIDATE_ID: 'invalid_candidate_id',
    CANDIDATE_NOT_FOUND: 'candidate_not_found',
    CONTRACT_NOT_FOUND: 'candidate_not_found',
    CANDIDATE_NOT_PENDING: 'candidate_not_evaluatable',
    CANDIDATE_NOT_EVALUATABLE: 'candidate_not_evaluatable',
    EVALUATION_ALREADY_PENDING: 'evaluation_already_pending',
    FEE_ESTIMATION_FAILED: 'fee_estimation_failed',
    FEE_ESTIMATE_INVALID: 'fee_estimate_invalid',
    STALE_CONFIRMATION: 'stale_confirmation',
    USER_REJECTED: 'user_rejected',
    WALLET_REJECTED: 'user_rejected',
    TRANSACTION_REJECTED: 'transaction_rejected',
    CONTRACT_REJECTED: 'transaction_rejected',
    STATUS_UNKNOWN: 'status_unknown',
    READBACK_MISMATCH: 'readback_mismatch',
    DECISION_INTEGRITY_ERROR: 'decision_integrity_error',
    RPC_UNAVAILABLE: 'status_unknown',
  };
  return {
    ok: false,
    phase: map[error.code] ?? 'transaction_rejected',
    message: error.userMessage,
    snapshot,
    transactionHash: error.transactionHash ?? snapshot?.transactionHash,
  };
}

export async function assertEvaluateEligibility(
  input: LiveEvaluateInput,
  deps: EvaluateCandidateOrchestrationDeps = {},
): Promise<{
  config: NonNullable<Extract<UpdateSealConfigResult, { ok: true }>['config']>;
  sender: `0x${string}`;
  candidateId: string;
  record: OnChainCandidateRecord;
  packageRecord: OnChainPackageRecord;
}> {
  const configResult = input.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();
  if (!configResult.ok) {
    throw new UpdateSealError('CONFIG_INVALID', configResult.error.userMessage);
  }
  if (configResult.config.dataMode === 'demo') {
    throw new UpdateSealError('WRITE_DISABLED', 'Candidate evaluation writes are disabled outside live mode.');
  }
  if (configResult.config.dataMode !== 'live') {
    throw new UpdateSealError('CONFIG_INVALID', 'VITE_UPDATESEAL_DATA_MODE must be exactly "live" or "demo".');
  }
  if (!input.isConnected || !input.connectedAddress) {
    throw new UpdateSealError('WALLET_DISCONNECTED', 'Connect a wallet to request evaluation on Studio-dev.');
  }
  if (input.chainId !== 61997) {
    throw new UpdateSealError('WRONG_NETWORK', 'Switch to GenLayer Studio-dev (chain ID 61997) before requesting evaluation.');
  }

  const parsed = parseCandidateId(input.candidateId);
  if (!parsed.ok) {
    throw new UpdateSealError('INVALID_CANDIDATE_ID', parsed.message);
  }

  const loadSnapshot = deps.loadSnapshotFn ?? loadEvaluationSnapshot;
  const stored =
    input.unresolvedSnapshot ??
    loadSnapshot(configResult.config.chainId, configResult.config.contractAddress, parsed.candidateId);
  if (stored) {
    throw new UpdateSealError(
      'EVALUATION_ALREADY_PENDING',
      'An unresolved evaluation transaction already exists for this candidate. Check the existing transaction.',
      stored.transactionHash,
    );
  }

  const existsFn = deps.candidateExistsFn ?? candidateExists;
  const getCandidateFn = deps.getCandidateFn ?? getCandidate;
  const getPackageFn = deps.getPackageFn ?? getPackage;
  const exists = await existsFn(parsed.candidateId);
  if (!exists) {
    throw new UpdateSealError('CANDIDATE_NOT_FOUND', `Candidate '${parsed.candidateId}' was not found.`);
  }
  const record = await getCandidateFn(parsed.candidateId);
  if (!isCandidateEvaluationEligible(record.status)) {
    throw new UpdateSealError(
      'CANDIDATE_NOT_EVALUATABLE',
      'This candidate cannot be evaluated from its current status.',
    );
  }
  const packageRecord = await getPackageFn(record.package_uid);
  return {
    config: configResult.config,
    sender: input.connectedAddress.toLowerCase() as `0x${string}`,
    candidateId: parsed.candidateId,
    record,
    packageRecord,
  };
}

export function confirmationFromRecord(args: {
  record: OnChainCandidateRecord;
  sender: `0x${string}`;
  chainId: number;
  contractAddress: `0x${string}`;
  estimate: EvaluationFeeEstimate;
}): EvaluationConfirmation {
  return {
    candidateId: args.record.candidate_id,
    packageUid: args.record.package_uid,
    version: args.record.version,
    candidateCommitSha: args.record.candidate_commit_sha,
    evidenceUri: args.record.evidence_uri,
    evidenceHash: args.record.evidence_hash,
    submitter: args.record.submitter,
    originalStatus: isCandidateEvaluationEligible(args.record.status) ? args.record.status : 'PENDING',
    originalEvaluationAttempts: args.record.evaluation_attempts,
    callerAddress: args.sender,
    chainId: args.chainId,
    contractAddress: args.contractAddress,
    estimate: args.estimate,
  };
}

export function confirmationIsStale(
  confirmation: EvaluationConfirmation,
  live: {
    record: OnChainCandidateRecord;
    sender: string;
    chainId: number;
    contractAddress: string;
  },
): string | null {
  if (live.record.candidate_id !== confirmation.candidateId) {
    return 'Candidate ID changed.';
  }
  if (live.record.status !== confirmation.originalStatus) {
    return `Candidate status changed from ${confirmation.originalStatus} to ${live.record.status}.`;
  }
  if (!isCandidateEvaluationEligible(live.record.status)) {
    return 'This candidate cannot be evaluated from its current status.';
  }
  if (live.record.evaluation_attempts !== confirmation.originalEvaluationAttempts) {
    return 'evaluation_attempts changed.';
  }
  if (live.record.package_uid !== confirmation.packageUid) {
    return 'package_uid changed.';
  }
  if (live.record.version !== confirmation.version) {
    return 'version changed.';
  }
  if (live.record.candidate_commit_sha !== confirmation.candidateCommitSha) {
    return 'candidate_commit_sha changed.';
  }
  if (live.record.evidence_uri !== confirmation.evidenceUri) {
    return 'evidence_uri changed.';
  }
  if (live.record.evidence_hash !== confirmation.evidenceHash) {
    return 'evidence_hash changed.';
  }
  if (live.record.submitter && confirmation.submitter && live.record.submitter.toLowerCase() !== confirmation.submitter.toLowerCase()) {
    return 'submitter changed.';
  }
  if (live.sender.toLowerCase() !== confirmation.callerAddress.toLowerCase()) {
    return 'Connected wallet changed.';
  }
  if (live.chainId !== confirmation.chainId) {
    return 'Connected chain changed.';
  }
  if (live.contractAddress.toLowerCase() !== confirmation.contractAddress.toLowerCase()) {
    return 'Contract address changed.';
  }
  const estimate = confirmation.estimate;
  if (
    estimate.senderAddress.toLowerCase() !== live.sender.toLowerCase() ||
    estimate.chainId !== live.chainId ||
    estimate.contractAddress.toLowerCase() !== live.contractAddress.toLowerCase() ||
    estimate.method !== 'evaluate_candidate' ||
    estimate.candidateId !== confirmation.candidateId
  ) {
    return 'Fee estimate no longer matches this sender, chain, contract, method, and candidate.';
  }
  return null;
}

export async function estimateLiveEvaluation(
  input: LiveEvaluateInput,
  deps: EvaluateCandidateOrchestrationDeps = {},
): Promise<EvaluateCandidateResult> {
  try {
    const prepared = await assertEvaluateEligibility(input, deps);
    if (!input.provider) {
      throw new UpdateSealError('WALLET_DISCONNECTED', 'Connect a wallet to request evaluation on Studio-dev.');
    }
    const createClient = deps.createWriteClientFn ?? createWriteGenLayerClient;
    const client = createClient(prepared.sender, input.provider);
    const estimateFn = deps.estimateFn ?? estimateEvaluateCandidateFees;
    const estimate = await estimateFn(
      { candidateId: prepared.candidateId, senderAddress: prepared.sender },
      { client, config: prepared.config },
    );
    const confirmation = confirmationFromRecord({
      record: prepared.record,
      sender: prepared.sender,
      chainId: prepared.config.chainId,
      contractAddress: prepared.config.contractAddress,
      estimate,
    });
    return { ok: true, phase: 'ready', confirmation, estimate };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      return phaseFromError(error);
    }
    return {
      ok: false,
      phase: 'fee_estimation_failed',
      message: 'Fee estimation failed',
    };
  }
}

let activeEvaluation: Promise<EvaluateCandidateResult> | null = null;

export function resetActiveEvaluationForTests(): void {
  activeEvaluation = null;
}

export async function submitLiveEvaluation(
  input: LiveEvaluateInput & { confirmation: EvaluationConfirmation },
  deps: EvaluateCandidateOrchestrationDeps = {},
): Promise<EvaluateCandidateResult> {
  if (activeEvaluation) {
    return activeEvaluation;
  }
  const run = runSubmitLiveEvaluation(input, deps);
  activeEvaluation = run;
  try {
    return await run;
  } finally {
    activeEvaluation = null;
  }
}

async function runSubmitLiveEvaluation(
  input: LiveEvaluateInput & { confirmation: EvaluationConfirmation },
  deps: EvaluateCandidateOrchestrationDeps,
): Promise<EvaluateCandidateResult> {
  const saveSnapshot = deps.saveSnapshotFn ?? saveEvaluationSnapshot;
  try {
    const prepared = await assertEvaluateEligibility(input, deps);
    const stale = confirmationIsStale(input.confirmation, {
      record: prepared.record,
      sender: prepared.sender,
      chainId: prepared.config.chainId,
      contractAddress: prepared.config.contractAddress,
    });
    if (stale) {
      throw new UpdateSealError('STALE_CONFIRMATION', `Confirmation is stale: ${stale} Request a new fee estimate.`);
    }
    if (!input.provider) {
      throw new UpdateSealError('WALLET_DISCONNECTED', 'Connect a wallet to request evaluation on Studio-dev.');
    }
    const createClient = deps.createWriteClientFn ?? createWriteGenLayerClient;
    const client = createClient(prepared.sender, input.provider);
    const evaluateFn = deps.evaluateFn ?? writeEvaluateCandidate;
    const success = await evaluateFn(
      { confirmation: input.confirmation },
      {
        client,
        config: prepared.config,
        getCandidateFn: deps.getCandidateFn ?? getCandidate,
        getPackageFn: deps.getPackageFn ?? getPackage,
        onProgress: (event) => {
          if (event.snapshot) {
            saveSnapshot(event.snapshot);
          }
        },
      },
    );
    (deps.clearSnapshotFn ?? clearEvaluationSnapshot)(
      input.confirmation.chainId,
      input.confirmation.contractAddress,
      input.confirmation.candidateId,
    );
    return { ok: true, phase: 'finalized', success };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      const snapshot = error.transactionHash
        ? loadEvaluationSnapshot(
            input.confirmation.chainId,
            input.confirmation.contractAddress,
            input.confirmation.candidateId,
          ) ?? undefined
        : undefined;
      if (error.transactionHash && !snapshot) {
        const created = {
          ...createFrozenSnapshotFromConfirmation(input.confirmation, error.transactionHash as `0x${string}`),
        };
        saveSnapshot(created);
        return phaseFromError(error, created);
      }
      return phaseFromError(error, snapshot);
    }
    return {
      ok: false,
      phase: 'status_unknown',
      message: 'Transaction status is unknown. The evaluation may still be processing. Keep this hash and check status.',
    };
  }
}

function createFrozenSnapshotFromConfirmation(
  confirmation: EvaluationConfirmation,
  transactionHash: `0x${string}`,
): PendingEvaluationSnapshot {
  return Object.freeze({
    transactionHash,
    candidateId: confirmation.candidateId,
    packageUid: confirmation.packageUid,
    version: confirmation.version,
    candidateCommitSha: confirmation.candidateCommitSha,
    evidenceUri: confirmation.evidenceUri,
    evidenceHash: confirmation.evidenceHash,
    originalStatus: confirmation.originalStatus,
    originalEvaluationAttempts: confirmation.originalEvaluationAttempts,
    callerAddress: confirmation.callerAddress,
    chainId: confirmation.chainId,
    contractAddress: confirmation.contractAddress,
    feeEstimateWei: confirmation.estimate.feeValue.toString(),
    submittedAtLocal: new Date().toISOString(),
    submitter: confirmation.submitter,
  });
}

export async function checkEvaluationStatus(
  input: {
    snapshot: PendingEvaluationSnapshot;
    configResult?: UpdateSealConfigResult;
  },
  deps: EvaluateCandidateOrchestrationDeps = {},
): Promise<EvaluateCandidateResult> {
  const snapshot = input.snapshot;
  const configResult = input.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();
  if (!configResult.ok || configResult.config.dataMode !== 'live') {
    return {
      ok: false,
      phase: 'config_invalid',
      message: configResult.ok ? 'Status checks run only in live mode.' : configResult.error.userMessage,
      snapshot,
      transactionHash: snapshot.transactionHash,
    };
  }

  try {
    const waitFn = deps.waitForExistingFn ?? waitForExistingEvaluation;
    const readClient = deps.getReadClientFn
      ? deps.getReadClientFn()
      : deps.waitForExistingFn
        ? { waitForTransactionReceipt: async () => undefined }
        : getReadOnlyGenLayerClient();
    const receipt = await waitFn(snapshot.transactionHash, { client: readClient });
    const success = await confirmEvaluationFromReceipt(
      snapshot,
      receipt,
      deps.getCandidateFn ?? getCandidate,
      deps.getPackageFn ?? getPackage,
    );
    (deps.clearSnapshotFn ?? clearEvaluationSnapshot)(snapshot.chainId, snapshot.contractAddress, snapshot.candidateId);
    return { ok: true, phase: 'finalized', success };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      return phaseFromError(error, snapshot);
    }
    return {
      ok: false,
      phase: 'status_unknown',
      message: 'Transaction status is unknown. The evaluation may still be processing. Keep this hash and check status.',
      snapshot,
      transactionHash: snapshot.transactionHash,
    };
  }
}
