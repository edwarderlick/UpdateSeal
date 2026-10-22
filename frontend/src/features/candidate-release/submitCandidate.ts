import { createWriteGenLayerClient, getReadOnlyGenLayerClient, type EthereumProviderLike, type GenLayerReadClient } from '../../lib/genlayerClient';
import {
  deriveCandidateId,
  normalizeEvidenceHash,
  validateCandidateCommitSha,
  validateEvidenceMatchesPackage,
  validateVersion,
  parseRawGithubEvidence,
} from '../../lib/candidateValidation';
import { createPendingCandidateSnapshot } from '../../lib/candidateReceipt';
import { liveCandidateRecordPath } from '../../lib/registrationValidation';
import { getUpdateSealConfigResult, type UpdateSealConfigResult } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import { candidateExists, getCandidate, getCandidateId, getPackage } from '../../services/updateSealContract';
import {
  confirmCandidateFromReceipt,
  submitCandidate as writeSubmitCandidate,
  waitForExistingCandidate,
} from '../../services/updateSealWrites';
import type {
  OnChainPackageRecord,
  PendingCandidateSnapshot,
  SubmitCandidateProgress,
  SubmitCandidateSuccess,
} from '../../types/updateSeal';
import {
  buildEvidencePreflightInputs,
  isEvidencePreflightCurrent,
  type EvidencePreflightSuccess,
} from '../../lib/evidencePreflight';

export type CandidateSubmitPhase =
  | 'review'
  | 'evidence_preflight'
  | 'config_invalid'
  | 'wallet_required'
  | 'wrong_network'
  | 'wrong_publisher'
  | 'duplicate'
  | 'validation_error'
  | 'estimating_fees'
  | 'fee_estimation_failed'
  | 'fee_estimate_invalid'
  | 'awaiting_wallet'
  | 'submitted'
  | 'waiting_consensus'
  | 'finalized'
  | 'wallet_rejected'
  | 'contract_rejected'
  | 'rpc_interrupted'
  | 'status_unknown'
  | 'demo';

export interface DuplicateCandidateInfo {
  candidateId: string;
  path: string;
}

export type SubmitCandidateResult =
  | { ok: true; phase: 'demo' }
  | { ok: true; phase: 'finalized'; success: SubmitCandidateSuccess }
  | {
      ok: false;
      phase: Exclude<
        CandidateSubmitPhase,
        | 'demo'
        | 'finalized'
        | 'review'
        | 'evidence_preflight'
        | 'estimating_fees'
        | 'awaiting_wallet'
        | 'submitted'
        | 'waiting_consensus'
      >;
      message: string;
      fieldErrors?: Record<string, string>;
      duplicate?: DuplicateCandidateInfo;
      transactionHash?: string;
      snapshot?: PendingCandidateSnapshot;
    };

export interface LiveCandidateSubmitInput {
  packageRecord: OnChainPackageRecord;
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
  evidencePreflight: EvidencePreflightSuccess | null;
  connectedAddress: string | null;
  isConnected: boolean;
  chainId: number;
  provider: EthereumProviderLike | null;
  configResult?: UpdateSealConfigResult;
  onProgress?: (event: SubmitCandidateProgress) => void;
}

export interface SubmitCandidateOrchestrationDeps {
  getConfigResult?: () => UpdateSealConfigResult;
  getPackageFn?: typeof getPackage;
  getCandidateIdFn?: typeof getCandidateId;
  candidateExistsFn?: typeof candidateExists;
  getCandidateFn?: typeof getCandidate;
  submitCandidateFn?: typeof writeSubmitCandidate;
  createWriteClientFn?: typeof createWriteGenLayerClient;
  waitForExistingCandidateFn?: typeof waitForExistingCandidate;
  getReadClientFn?: () => Pick<GenLayerReadClient, 'waitForTransactionReceipt'>;
}

export function validateLiveCandidateFields(input: {
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
  repositoryUrl: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const version = input.version.trim();
  const versionError = validateVersion(version);
  if (!version) {
    errors.version = 'Version is required.';
  } else if (versionError) {
    errors.version = versionError;
  }
  const sha = input.candidateCommitSha.trim();
  const shaError = validateCandidateCommitSha(sha);
  if (!sha) {
    errors.candidateCommitSha = 'Candidate commit SHA is required.';
  } else if (shaError) {
    errors.candidateCommitSha = shaError;
  }
  const uri = input.evidenceUri.trim();
  const parsed = parseRawGithubEvidence(uri);
  if (!uri) {
    errors.evidenceUri = 'Evidence URI is required.';
  } else if (!parsed.ok) {
    errors.evidenceUri = parsed.message;
  } else {
    const matchError = validateEvidenceMatchesPackage(uri, input.repositoryUrl, sha);
    if (matchError) {
      errors.evidenceUri = matchError;
    }
  }
  const hash = input.evidenceHash.trim();
  const normalized = normalizeEvidenceHash(hash);
  if (!hash) {
    errors.evidenceHash = 'Evidence hash is required.';
  } else if (!normalized.ok) {
    errors.evidenceHash = normalized.message;
  }
  return errors;
}

function phaseFromError(error: UpdateSealError, snapshot?: PendingCandidateSnapshot): SubmitCandidateResult {
  const map: Record<string, Extract<SubmitCandidateResult, { ok: false }>['phase']> = {
    CONFIG_INVALID: 'config_invalid',
    WALLET_REQUIRED: 'wallet_required',
    WRONG_NETWORK: 'wrong_network',
    WRONG_PUBLISHER: 'wrong_publisher',
    WALLET_REJECTED: 'wallet_rejected',
    CONTRACT_REJECTED: 'contract_rejected',
    RPC_UNAVAILABLE: 'rpc_interrupted',
    STATUS_UNKNOWN: 'status_unknown',
    DUPLICATE_CANDIDATE: 'duplicate',
    WRITE_DISABLED: 'config_invalid',
    SENDER_MISMATCH: 'wallet_required',
    FEE_ESTIMATION_FAILED: 'fee_estimation_failed',
    FEE_ESTIMATE_INVALID: 'fee_estimate_invalid',
  };
  return {
    ok: false,
    phase: map[error.code] ?? 'contract_rejected',
    message: error.userMessage,
    transactionHash: error.transactionHash ?? snapshot?.transactionHash,
    snapshot,
  };
}

export async function checkCandidateStatus(
  input: {
    snapshot: PendingCandidateSnapshot;
    publisherAddress: string;
    configResult?: UpdateSealConfigResult;
  },
  deps: SubmitCandidateOrchestrationDeps = {},
): Promise<SubmitCandidateResult> {
  const snapshot = input.snapshot;
  const transactionHash = snapshot.transactionHash;
  const configResult = input.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();
  if (!configResult.ok || configResult.config.dataMode !== 'live') {
    return {
      ok: false,
      phase: 'config_invalid',
      message: configResult.ok ? 'Status checks run only in live mode.' : configResult.error.userMessage,
      transactionHash,
      snapshot,
    };
  }

  const getCandidateFn = deps.getCandidateFn ?? getCandidate;
  const candidateExistsFn = deps.candidateExistsFn ?? candidateExists;

  try {
    const waitFn = deps.waitForExistingCandidateFn ?? waitForExistingCandidate;
    const readClient = deps.getReadClientFn
      ? deps.getReadClientFn()
      : deps.waitForExistingCandidateFn
        ? { waitForTransactionReceipt: async () => undefined }
        : getReadOnlyGenLayerClient();
    const receipt = await waitFn(transactionHash, {
      client: readClient,
    });
    const success = await confirmCandidateFromReceipt(
      snapshot,
      receipt,
      getCandidateFn,
      candidateExistsFn,
      input.publisherAddress,
    );
    return { ok: true, phase: 'finalized', success };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      return phaseFromError(error, snapshot);
    }
    return {
      ok: false,
      phase: 'status_unknown',
      message: 'Transaction status is unknown. The candidate submission may still be processing. Keep this hash and check status.',
      transactionHash,
      snapshot,
    };
  }
}

let activeSubmission: Promise<SubmitCandidateResult> | null = null;

export function resetActiveCandidateSubmissionForTests(): void {
  activeSubmission = null;
}

export async function submitLiveCandidate(
  input: LiveCandidateSubmitInput,
  deps: SubmitCandidateOrchestrationDeps = {},
): Promise<SubmitCandidateResult> {
  if (activeSubmission) {
    return activeSubmission;
  }
  const run = runSubmitLiveCandidate(input, deps);
  activeSubmission = run;
  try {
    return await run;
  } finally {
    activeSubmission = null;
  }
}

async function runSubmitLiveCandidate(
  input: LiveCandidateSubmitInput,
  deps: SubmitCandidateOrchestrationDeps,
): Promise<SubmitCandidateResult> {
  const configResult = input.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();

  if (!configResult.ok) {
    return {
      ok: false,
      phase: 'config_invalid',
      message: configResult.error.userMessage,
    };
  }

  if (configResult.config.dataMode === 'demo') {
    return { ok: true, phase: 'demo' };
  }

  if (configResult.config.dataMode !== 'live') {
    return {
      ok: false,
      phase: 'config_invalid',
      message: 'VITE_UPDATESEAL_DATA_MODE must be exactly "live" or "demo".',
    };
  }

  if (!input.isConnected || !input.connectedAddress) {
    return {
      ok: false,
      phase: 'wallet_required',
      message: 'Connect a wallet to submit a candidate on Studio-dev.',
    };
  }

  if (input.chainId !== 61997) {
    return {
      ok: false,
      phase: 'wrong_network',
      message: 'Switch to GenLayer Studio-dev (chain ID 61997) before submitting a candidate.',
    };
  }

  const version = input.version.trim();
  const candidateCommitSha = input.candidateCommitSha.trim();
  const evidenceUri = input.evidenceUri.trim();
  const hashResult = normalizeEvidenceHash(input.evidenceHash.trim());
  const fieldErrors = validateLiveCandidateFields({
    version: input.version,
    candidateCommitSha: input.candidateCommitSha,
    evidenceUri: input.evidenceUri,
    evidenceHash: input.evidenceHash,
    repositoryUrl: input.packageRecord.repository_url,
  });
  if (Object.keys(fieldErrors).length > 0 || !hashResult.ok) {
    return {
      ok: false,
      phase: 'validation_error',
      message: 'Fix the highlighted candidate fields before submitting.',
      fieldErrors,
    };
  }

  const sender = input.connectedAddress.toLowerCase() as `0x${string}`;
  const publisher = input.packageRecord.publisher.toLowerCase();
  if (sender !== publisher) {
    return {
      ok: false,
      phase: 'wrong_publisher',
      message: 'Only the registered package publisher may submit candidates. GitHub ownership is not implied.',
    };
  }

  if (!input.evidencePreflight || !input.evidencePreflight.ok) {
    return {
      ok: false,
      phase: 'validation_error',
      message: 'Evidence preflight must pass before submission. This is a document check, not an evaluation verdict.',
    };
  }

  const expectedPreflightInputs = buildEvidencePreflightInputs({
    evidenceUri,
    evidenceHash: hashResult.hash,
    packageUid: input.packageRecord.package_uid,
    version,
    baselineCommitSha: input.packageRecord.baseline_commit_sha,
    candidateCommitSha,
  });
  if (!isEvidencePreflightCurrent(input.evidencePreflight, expectedPreflightInputs)) {
    return {
      ok: false,
      phase: 'validation_error',
      message: 'Evidence inputs changed and preflight must be rerun before submitting.',
    };
  }

  const getPackageFn = deps.getPackageFn ?? getPackage;
  const getCandidateIdFn = deps.getCandidateIdFn ?? getCandidateId;
  const candidateExistsFn = deps.candidateExistsFn ?? candidateExists;

  let expectedCandidateId: string;
  try {
    const onChainPackage = await getPackageFn(input.packageRecord.package_uid);
    if (onChainPackage.publisher.toLowerCase() !== sender) {
      return {
        ok: false,
        phase: 'wrong_publisher',
        message: 'Only the registered package publisher may submit candidates. GitHub ownership is not implied.',
      };
    }
    expectedCandidateId = await getCandidateIdFn(input.packageRecord.package_uid, version);
    const exists = await candidateExistsFn(expectedCandidateId);
    if (exists) {
      const slug = onChainPackage.package_slug;
      return {
        ok: false,
        phase: 'duplicate',
        message: `Candidate '${expectedCandidateId}' already exists.`,
        duplicate: {
          candidateId: expectedCandidateId,
          path: liveCandidateRecordPath(onChainPackage.publisher, slug, version),
        },
      };
    }
  } catch (error) {
    if (error instanceof UpdateSealError) {
      return phaseFromError(error);
    }
    return {
      ok: false,
      phase: 'rpc_interrupted',
      message: 'Studio-dev RPC was interrupted while checking the package and candidate.',
    };
  }

  if (!input.provider) {
    return {
      ok: false,
      phase: 'wallet_required',
      message: 'Connect a wallet to submit a candidate on Studio-dev.',
    };
  }

  const identity = {
    senderAddress: sender,
    packageUid: input.packageRecord.package_uid,
    version,
    candidateCommitSha,
    evidenceUri,
    evidenceHash: hashResult.hash,
    expectedCandidateId,
  };

  const createWriteClientFn = deps.createWriteClientFn ?? createWriteGenLayerClient;
  const submitCandidateFn = deps.submitCandidateFn ?? writeSubmitCandidate;
  const client = createWriteClientFn(sender, input.provider);

  const emitProgress = (event: SubmitCandidateProgress) => {
    if (!event.transactionHash) {
      input.onProgress?.(event);
      return;
    }
    const snapshot =
      event.snapshot ??
      createPendingCandidateSnapshot({
        transactionHash: event.transactionHash,
        ...identity,
      });
    input.onProgress?.({ ...event, snapshot });
  };

  try {
    const success = await submitCandidateFn(
      {
        packageUid: identity.packageUid,
        version,
        candidateCommitSha,
        evidenceUri,
        evidenceHash: identity.evidenceHash,
        senderAddress: sender,
        expectedCandidateId,
      },
      {
        client,
        candidateExistsFn,
        getCandidateFn: deps.getCandidateFn ?? getCandidate,
        onProgress: emitProgress,
        config: configResult.config,
      },
    );
    return { ok: true, phase: 'finalized', success };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      const snapshot = error.transactionHash
        ? createPendingCandidateSnapshot({
            transactionHash: error.transactionHash as `0x${string}`,
            ...identity,
          })
        : undefined;
      if (error.code === 'DUPLICATE_CANDIDATE' || error.userMessage.toLowerCase().includes('already exists')) {
        return {
          ok: false,
          phase: 'duplicate',
          message: error.userMessage,
          duplicate: {
            candidateId: expectedCandidateId,
            path: liveCandidateRecordPath(input.packageRecord.publisher, input.packageRecord.package_slug, version),
          },
          transactionHash: error.transactionHash ?? undefined,
          snapshot,
        };
      }
      return phaseFromError(error, snapshot);
    }
    return {
      ok: false,
      phase: 'rpc_interrupted',
      message: 'Studio-dev RPC was interrupted. The transaction may still be processing.',
    };
  }
}

export { deriveCandidateId };
