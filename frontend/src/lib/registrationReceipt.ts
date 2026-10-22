import { isSuccessful } from 'genlayer-js';
import { derivePackageUid } from './registrationValidation';
import type { OnChainPackageRecord, PendingRegistrationSnapshot } from '../types/updateSeal';

const PACKAGE_UID_RE = /^0x[0-9a-f]{40}\/.+$/;
const CHARTER_HASH_RE = /^[0-9a-f]{64}$/;

const SUCCESS_CONSENSUS = new Set(['ACCEPTED', 'FINALIZED']);
const TERMINAL_FAILED_CONSENSUS = new Set([
  'UNDETERMINED',
  'CANCELED',
  'VALIDATORS_TIMEOUT',
  'LEADER_TIMEOUT',
]);
const TERMINAL_FAILED_EXECUTION = new Set([
  'FINISHED_WITH_ERROR',
  'TIMEOUT',
  'NONDET_DISAGREE',
  'DETERMINISTIC_VIOLATION',
]);

export type ReceiptClassificationKind = 'success' | 'contract_rejected' | 'status_unknown';

export interface ReceiptClassification {
  kind: ReceiptClassificationKind;
  consensusStatus: 'ACCEPTED' | 'FINALIZED' | null;
  executionResult: string | null;
  detail: string | null;
}

export function asReceiptRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function collectLeaderReceipts(receipt: Record<string, unknown>): Record<string, unknown>[] {
  const consensus = asReceiptRecord(receipt.consensus_data);
  const leaders = consensus?.leader_receipt;
  if (Array.isArray(leaders)) {
    return leaders.map(asReceiptRecord).filter((row): row is Record<string, unknown> => Boolean(row));
  }
  const single = asReceiptRecord(leaders);
  return single ? [single] : [];
}

export function extractReturnedPackageUid(receipt: unknown): string | null {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return null;
  }
  for (const leader of collectLeaderReceipts(rec)) {
    const result = leader.result;
    if (typeof result === 'string' && PACKAGE_UID_RE.test(result)) {
      return result;
    }
  }
  return null;
}

export function readConsensusStatus(receipt: unknown): 'ACCEPTED' | 'FINALIZED' | null {
  const name = readConsensusStatusName(receipt);
  if (name === 'FINALIZED' || name === 'ACCEPTED') {
    return name;
  }
  return null;
}

export function readConsensusStatusName(receipt: unknown): string | null {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return null;
  }
  if (typeof rec.statusName === 'string' && rec.statusName.length > 0) {
    return rec.statusName;
  }
  if (typeof rec.status === 'string' && rec.status.length > 0) {
    return rec.status;
  }
  return null;
}

export function readExecutionResultName(receipt: unknown): string | null {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return null;
  }
  if (typeof rec.txExecutionResultName === 'string' && rec.txExecutionResultName.length > 0) {
    return rec.txExecutionResultName;
  }
  if (typeof rec.txExecutionResult === 'string' && rec.txExecutionResult.length > 0) {
    return rec.txExecutionResult;
  }
  for (const leader of collectLeaderReceipts(rec)) {
    if (typeof leader.execution_result === 'string' && leader.execution_result.length > 0) {
      return leader.execution_result;
    }
  }
  return null;
}

export function leaderReceiptError(receipt: unknown): string | null {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return null;
  }
  for (const leader of collectLeaderReceipts(rec)) {
    if (typeof leader.error === 'string' && leader.error.length > 0) {
      return leader.error;
    }
  }
  return null;
}

export function classifyRegistrationReceipt(receipt: unknown): ReceiptClassification {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return { kind: 'status_unknown', consensusStatus: null, executionResult: null, detail: null };
  }

  let successful = false;
  try {
    successful = isSuccessful(rec as Parameters<typeof isSuccessful>[0]);
  } catch {
    return { kind: 'status_unknown', consensusStatus: null, executionResult: null, detail: null };
  }

  const consensusStatus = readConsensusStatus(rec);
  const executionResult = readExecutionResultName(rec);
  const statusName = readConsensusStatusName(rec);

  if (successful) {
    return {
      kind: 'success',
      consensusStatus: consensusStatus ?? 'FINALIZED',
      executionResult: executionResult ?? 'FINISHED_WITH_RETURN',
      detail: null,
    };
  }

  if (statusName && TERMINAL_FAILED_CONSENSUS.has(statusName)) {
    return {
      kind: 'contract_rejected',
      consensusStatus,
      executionResult,
      detail: leaderReceiptError(rec),
    };
  }

  if (statusName && SUCCESS_CONSENSUS.has(statusName) && executionResult && TERMINAL_FAILED_EXECUTION.has(executionResult)) {
    return {
      kind: 'contract_rejected',
      consensusStatus,
      executionResult,
      detail: leaderReceiptError(rec),
    };
  }

  return {
    kind: 'status_unknown',
    consensusStatus,
    executionResult,
    detail: null,
  };
}

export function resolvePackageUidAfterSuccessfulReceipt(
  receipt: unknown,
  expectedPackageUid: string,
): { ok: true; packageUid: string } | { ok: false; reason: string } {
  const extracted = extractReturnedPackageUid(receipt);
  if (extracted && extracted !== expectedPackageUid) {
    return { ok: false, reason: 'Returned package UID does not match the expected package UID.' };
  }
  return { ok: true, packageUid: expectedPackageUid };
}

export function isValidCharterHash(value: string): boolean {
  return CHARTER_HASH_RE.test(value);
}

export function verifyReadBackRecord(
  record: OnChainPackageRecord,
  snapshot: PendingRegistrationSnapshot,
): { ok: true } | { ok: false; reason: string } {
  if (record.package_uid !== snapshot.expectedPackageUid) {
    return { ok: false, reason: 'package_uid' };
  }
  if (record.publisher.toLowerCase() !== snapshot.senderAddress.toLowerCase()) {
    return { ok: false, reason: 'publisher' };
  }
  if (record.package_slug !== snapshot.packageSlug) {
    return { ok: false, reason: 'package_slug' };
  }
  if (record.repository_url !== snapshot.repositoryUrl) {
    return { ok: false, reason: 'repository_url' };
  }
  if (record.baseline_commit_sha !== snapshot.baselineCommitSha) {
    return { ok: false, reason: 'baseline_commit_sha' };
  }
  if (record.charter_json !== snapshot.canonicalCharterJson) {
    return { ok: false, reason: 'charter_json' };
  }
  if (!isValidCharterHash(record.charter_hash)) {
    return { ok: false, reason: 'charter_hash' };
  }
  return { ok: true };
}

export function createPendingRegistrationSnapshot(args: {
  transactionHash: `0x${string}`;
  senderAddress: string;
  packageSlug: string;
  repositoryUrl: string;
  baselineCommitSha: string;
  canonicalCharterJson: string;
}): PendingRegistrationSnapshot {
  const senderAddress = args.senderAddress.trim().toLowerCase() as `0x${string}`;
  return Object.freeze({
    transactionHash: args.transactionHash,
    senderAddress,
    packageSlug: args.packageSlug,
    expectedPackageUid: derivePackageUid(senderAddress, args.packageSlug),
    repositoryUrl: args.repositoryUrl,
    baselineCommitSha: args.baselineCommitSha,
    canonicalCharterJson: args.canonicalCharterJson,
  });
}
