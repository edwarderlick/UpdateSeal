import type { GenLayerWriteClient } from '../lib/genlayerClient';
import {
  classifyRegistrationReceipt,
  createPendingRegistrationSnapshot,
  extractReturnedPackageUid,
  leaderReceiptError,
  resolvePackageUidAfterSuccessfulReceipt,
  verifyReadBackRecord,
} from '../lib/registrationReceipt';
import { isReceiptTimeout, isWalletRejection, sanitizeUserError } from '../lib/sanitizeUserError';
import { FEE_ESTIMATION_FAILED_MESSAGE, formatGenFromWei, requireValidWriteFees, toWriteContractFees } from '../lib/transactionFees';
import {
  getUpdateSealConfigResult,
  type UpdateSealConfig,
  type UpdateSealConfigResult,
} from '../lib/updateSealConfig';
import { UpdateSealError } from '../lib/updateSealErrors';
import {
  classifyCandidateReceipt,
  createPendingCandidateSnapshot,
  extractReturnedCandidateId,
  verifyReadBackCandidate,
} from '../lib/candidateReceipt';
import type {
  OnChainCandidateRecord,
  OnChainPackageRecord,
  PendingCandidateSnapshot,
  PendingRegistrationSnapshot,
  RegisterPackageParams,
  RegisterPackageSuccess,
  RegisterProgress,
  SubmitCandidateParams,
  SubmitCandidateProgress,
  SubmitCandidateSuccess,
} from '../types/updateSeal';
import { CONTRACT_METHODS, candidateExists, getCandidate, getPackage } from './updateSealContract';

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export const REGISTER_WAIT_INTERVAL_MS = 3000;
export const REGISTER_WAIT_RETRIES = 40;

export {
  classifyRegistrationReceipt,
  createPendingRegistrationSnapshot,
  extractReturnedPackageUid,
  verifyReadBackRecord,
};

export interface RegisterPackageWriteDeps {
  client: GenLayerWriteClient;
  packageExistsFn?: (packageUid: string) => Promise<boolean>;
  getPackageFn?: typeof getPackage;
  onProgress?: (event: RegisterProgress) => void;
  config?: UpdateSealConfig;
  configResult?: UpdateSealConfigResult;
  getConfigResult?: () => UpdateSealConfigResult;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function normalizeTransactionHash(value: unknown): `0x${string}` {
  if (typeof value === 'string' && TX_HASH_RE.test(value)) {
    return value as `0x${string}`;
  }
  const record = asRecord(value);
  if (record) {
    for (const key of ['hash', 'txId', 'transactionHash', 'transaction_hash']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && TX_HASH_RE.test(candidate)) {
        return candidate as `0x${string}`;
      }
    }
  }
  throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', 'The wallet did not return a transaction hash.');
}

export function assertLiveWritesEnabled(
  deps: Pick<RegisterPackageWriteDeps, 'config' | 'configResult' | 'getConfigResult'> = {},
): UpdateSealConfig {
  if (deps.config) {
    if (deps.config.dataMode !== 'live') {
      throw new UpdateSealError('WRITE_DISABLED', 'Package registration writes are disabled outside live mode.');
    }
    return deps.config;
  }
  const result = deps.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();
  if (!result.ok) {
    throw new UpdateSealError('CONFIG_INVALID', result.error.userMessage);
  }
  if (result.config.dataMode !== 'live') {
    throw new UpdateSealError('WRITE_DISABLED', 'Package registration writes are disabled outside live mode.');
  }
  return result.config;
}

function toWriteError(error: unknown, transactionHash: string | null = null): UpdateSealError {
  if (error instanceof UpdateSealError) {
    if (transactionHash && !error.transactionHash) {
      return new UpdateSealError(error.code, error.userMessage, transactionHash);
    }
    return error;
  }
  if (isWalletRejection(error)) {
    return new UpdateSealError('WALLET_REJECTED', 'Wallet rejected the registration signature.', transactionHash);
  }
  if (isReceiptTimeout(error)) {
    return new UpdateSealError(
      'STATUS_UNKNOWN',
      'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
      transactionHash,
    );
  }
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout')
  ) {
    if (transactionHash) {
      return new UpdateSealError(
        'STATUS_UNKNOWN',
        'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
        transactionHash,
      );
    }
    return new UpdateSealError(
      'RPC_UNAVAILABLE',
      'Studio-dev RPC was interrupted. The transaction may still be processing.',
      transactionHash,
    );
  }
  return new UpdateSealError('CONTRACT_REJECTED', sanitizeUserError(error, 'The contract rejected this registration.'), transactionHash);
}

export async function confirmRegistrationFromReceipt(
  snapshot: PendingRegistrationSnapshot,
  receipt: unknown,
  getPackageFn: typeof getPackage,
): Promise<RegisterPackageSuccess> {
  const classification = classifyRegistrationReceipt(receipt);

  if (classification.kind === 'success') {
    const uidResult = resolvePackageUidAfterSuccessfulReceipt(receipt, snapshot.expectedPackageUid);
    if (!uidResult.ok) {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'On-chain package data does not yet match this registration. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    let record: OnChainPackageRecord;
    try {
      record = await getPackageFn(uidResult.packageUid);
    } catch {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'Consensus finished but the package could not be confirmed on-chain yet. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    const verified = verifyReadBackRecord(record, snapshot);
    if (!verified.ok) {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'On-chain package data does not yet match this registration. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    return {
      transactionHash: snapshot.transactionHash,
      packageUid: uidResult.packageUid,
      record,
      consensusStatus: classification.consensusStatus ?? 'FINALIZED',
    };
  }

  if (classification.kind === 'contract_rejected') {
    throw new UpdateSealError(
      'CONTRACT_REJECTED',
      sanitizeUserError(classification.detail ?? leaderReceiptError(receipt) ?? 'The contract rejected this registration.', 'The contract rejected this registration.'),
      snapshot.transactionHash,
    );
  }

  throw new UpdateSealError(
    'STATUS_UNKNOWN',
    'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
    snapshot.transactionHash,
  );
}

export async function registerPackage(
  params: RegisterPackageParams,
  deps: RegisterPackageWriteDeps,
): Promise<RegisterPackageSuccess> {
  const config = assertLiveWritesEnabled(deps);
  const sender = params.senderAddress.toLowerCase() as `0x${string}`;
  if (!/^0x[0-9a-f]{40}$/.test(sender)) {
    throw new UpdateSealError('SENDER_MISMATCH', 'Transaction sender must match the connected wallet.');
  }

  const getPackageFn = deps.getPackageFn ?? getPackage;
  const writeArgs = [params.packageSlug, params.repositoryUrl, params.baselineCommitSha, params.charterJson];
  const estimateArgs = {
    account: sender,
    address: config.contractAddress,
    functionName: CONTRACT_METHODS.registerPackage,
    args: writeArgs,
  };

  deps.onProgress?.({ phase: 'estimating_fees' });

  let estimate: unknown;
  try {
    estimate = await deps.client.estimateTransactionFeesForWrite(estimateArgs);
  } catch (error) {
    if (error instanceof UpdateSealError) {
      throw error;
    }
    throw new UpdateSealError('FEE_ESTIMATION_FAILED', FEE_ESTIMATION_FAILED_MESSAGE);
  }

  const validatedFees = requireValidWriteFees(estimate);
  const fees = toWriteContractFees(validatedFees);
  const estimatedFeeLabel = formatGenFromWei(validatedFees.feeValue);

  deps.onProgress?.({
    phase: 'awaiting_wallet',
    estimatedFeeWei: validatedFees.feeValue,
    estimatedFeeLabel,
  });

  let rawHash: unknown;
  try {
    rawHash = await deps.client.writeContract({
      account: sender,
      address: config.contractAddress,
      functionName: CONTRACT_METHODS.registerPackage,
      args: writeArgs,
      fees,
    });
  } catch (error) {
    throw toWriteError(error);
  }

  const transactionHash = normalizeTransactionHash(rawHash);
  const snapshot = createPendingRegistrationSnapshot({
    transactionHash,
    senderAddress: sender,
    packageSlug: params.packageSlug,
    repositoryUrl: params.repositoryUrl,
    baselineCommitSha: params.baselineCommitSha,
    canonicalCharterJson: params.charterJson,
  });

  deps.onProgress?.({ phase: 'submitted', transactionHash, snapshot });
  deps.onProgress?.({ phase: 'waiting_consensus', transactionHash, snapshot });

  let receipt: unknown;
  try {
    receipt = await deps.client.waitForTransactionReceipt({
      hash: transactionHash,
      waitUntil: 'finalized',
      interval: REGISTER_WAIT_INTERVAL_MS,
      retries: REGISTER_WAIT_RETRIES,
      fullTransaction: true,
    });
  } catch (error) {
    throw toWriteError(error, transactionHash);
  }

  return confirmRegistrationFromReceipt(snapshot, receipt, getPackageFn);
}

export async function waitForExistingRegistration(
  transactionHash: `0x${string}`,
  deps: { client: Pick<GenLayerWriteClient, 'waitForTransactionReceipt'> },
): Promise<unknown> {
  try {
    return await deps.client.waitForTransactionReceipt({
      hash: transactionHash,
      waitUntil: 'finalized',
      interval: REGISTER_WAIT_INTERVAL_MS,
      retries: REGISTER_WAIT_RETRIES,
      fullTransaction: true,
    });
  } catch (error) {
    throw toWriteError(error, transactionHash);
  }
}

export interface SubmitCandidateWriteDeps {
  client: GenLayerWriteClient;
  candidateExistsFn?: typeof candidateExists;
  getCandidateFn?: typeof getCandidate;
  onProgress?: (event: SubmitCandidateProgress) => void;
  config?: UpdateSealConfig;
  configResult?: UpdateSealConfigResult;
  getConfigResult?: () => UpdateSealConfigResult;
}

function toCandidateWriteError(error: unknown, transactionHash: string | null = null): UpdateSealError {
  if (error instanceof UpdateSealError) {
    if (transactionHash && !error.transactionHash) {
      return new UpdateSealError(error.code, error.userMessage, transactionHash);
    }
    return error;
  }
  if (isWalletRejection(error)) {
    return new UpdateSealError('WALLET_REJECTED', 'Wallet rejected the candidate submission signature.', transactionHash);
  }
  if (isReceiptTimeout(error)) {
    return new UpdateSealError(
      'STATUS_UNKNOWN',
      'Transaction status is unknown. The candidate submission may still be processing. Keep this hash and check status.',
      transactionHash,
    );
  }
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout')
  ) {
    if (transactionHash) {
      return new UpdateSealError(
        'STATUS_UNKNOWN',
        'Transaction status is unknown. The candidate submission may still be processing. Keep this hash and check status.',
        transactionHash,
      );
    }
    return new UpdateSealError(
      'RPC_UNAVAILABLE',
      'Studio-dev RPC was interrupted. The transaction may still be processing.',
      transactionHash,
    );
  }
  return new UpdateSealError(
    'CONTRACT_REJECTED',
    sanitizeUserError(error, 'The contract rejected this candidate submission.'),
    transactionHash,
  );
}

export async function confirmCandidateFromReceipt(
  snapshot: PendingCandidateSnapshot,
  receipt: unknown,
  getCandidateFn: typeof getCandidate,
  candidateExistsFn: typeof candidateExists,
  publisherAddress: string,
): Promise<SubmitCandidateSuccess> {
  const classification = classifyCandidateReceipt(receipt);

  if (classification.kind === 'success') {
    const returnedId = extractReturnedCandidateId(receipt);
    if (returnedId !== null && returnedId !== snapshot.expectedCandidateId) {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'On-chain candidate data does not yet match this submission. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    let exists = false;
    try {
      exists = await candidateExistsFn(snapshot.expectedCandidateId);
    } catch {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'Consensus finished but the candidate could not be confirmed on-chain yet. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }
    if (!exists) {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'On-chain candidate data does not yet match this submission. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    let record: OnChainCandidateRecord;
    try {
      record = await getCandidateFn(snapshot.expectedCandidateId);
    } catch {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'Consensus finished but the candidate could not be confirmed on-chain yet. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    const verified = verifyReadBackCandidate(record, snapshot, publisherAddress);
    if (!verified.ok) {
      throw new UpdateSealError(
        'STATUS_UNKNOWN',
        'On-chain candidate data does not yet match this submission. Keep this hash and check status.',
        snapshot.transactionHash,
      );
    }

    return {
      transactionHash: snapshot.transactionHash,
      candidateId: snapshot.expectedCandidateId,
      record,
      consensusStatus: classification.consensusStatus ?? 'FINALIZED',
    };
  }

  if (classification.kind === 'contract_rejected') {
    throw new UpdateSealError(
      'CONTRACT_REJECTED',
      sanitizeUserError(
        classification.detail ?? leaderReceiptError(receipt) ?? 'The contract rejected this candidate submission.',
        'The contract rejected this candidate submission.',
      ),
      snapshot.transactionHash,
    );
  }

  throw new UpdateSealError(
    'STATUS_UNKNOWN',
    'Transaction status is unknown. The candidate submission may still be processing. Keep this hash and check status.',
    snapshot.transactionHash,
  );
}

export async function submitCandidate(
  params: SubmitCandidateParams,
  deps: SubmitCandidateWriteDeps,
): Promise<SubmitCandidateSuccess> {
  const config = assertLiveWritesEnabled(deps);
  const sender = params.senderAddress.toLowerCase() as `0x${string}`;
  if (!/^0x[0-9a-f]{40}$/.test(sender)) {
    throw new UpdateSealError('SENDER_MISMATCH', 'Transaction sender must match the connected wallet.');
  }

  const getCandidateFn = deps.getCandidateFn ?? getCandidate;
  const candidateExistsFn = deps.candidateExistsFn ?? candidateExists;
  const evidenceHash = params.evidenceHash.toLowerCase();
  const writeArgs = [
    params.packageUid,
    params.version,
    params.candidateCommitSha,
    params.evidenceUri,
    evidenceHash,
  ];
  const estimateArgs = {
    account: sender,
    address: config.contractAddress,
    functionName: CONTRACT_METHODS.submitCandidate,
    args: writeArgs,
  };

  deps.onProgress?.({ phase: 'estimating_fees' });

  let estimate: unknown;
  try {
    estimate = await deps.client.estimateTransactionFeesForWrite(estimateArgs);
  } catch (error) {
    if (error instanceof UpdateSealError) {
      throw error;
    }
    throw new UpdateSealError('FEE_ESTIMATION_FAILED', FEE_ESTIMATION_FAILED_MESSAGE);
  }

  const validatedFees = requireValidWriteFees(estimate);
  const fees = toWriteContractFees(validatedFees);
  const estimatedFeeLabel = formatGenFromWei(validatedFees.feeValue);

  deps.onProgress?.({
    phase: 'awaiting_wallet',
    estimatedFeeWei: validatedFees.feeValue,
    estimatedFeeLabel,
  });

  let rawHash: unknown;
  try {
    rawHash = await deps.client.writeContract({
      account: sender,
      address: config.contractAddress,
      functionName: CONTRACT_METHODS.submitCandidate,
      args: writeArgs,
      fees,
    });
  } catch (error) {
    throw toCandidateWriteError(error);
  }

  const transactionHash = normalizeTransactionHash(rawHash);
  const snapshot = createPendingCandidateSnapshot({
    transactionHash,
    senderAddress: sender,
    packageUid: params.packageUid,
    version: params.version,
    candidateCommitSha: params.candidateCommitSha,
    evidenceUri: params.evidenceUri,
    evidenceHash,
    expectedCandidateId: params.expectedCandidateId,
  });

  deps.onProgress?.({ phase: 'submitted', transactionHash, snapshot });
  deps.onProgress?.({ phase: 'waiting_consensus', transactionHash, snapshot });

  let receipt: unknown;
  try {
    receipt = await deps.client.waitForTransactionReceipt({
      hash: transactionHash,
      waitUntil: 'finalized',
      interval: REGISTER_WAIT_INTERVAL_MS,
      retries: REGISTER_WAIT_RETRIES,
      fullTransaction: true,
    });
  } catch (error) {
    throw toCandidateWriteError(error, transactionHash);
  }

  return confirmCandidateFromReceipt(snapshot, receipt, getCandidateFn, candidateExistsFn, sender);
}

export async function waitForExistingCandidate(
  transactionHash: `0x${string}`,
  deps: { client: Pick<GenLayerWriteClient, 'waitForTransactionReceipt'> },
): Promise<unknown> {
  try {
    return await deps.client.waitForTransactionReceipt({
      hash: transactionHash,
      waitUntil: 'finalized',
      interval: REGISTER_WAIT_INTERVAL_MS,
      retries: REGISTER_WAIT_RETRIES,
      fullTransaction: true,
    });
  } catch (error) {
    throw toCandidateWriteError(error, transactionHash);
  }
}
