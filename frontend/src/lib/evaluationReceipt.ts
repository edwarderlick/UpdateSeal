import {
  asReceiptRecord,
  classifyRegistrationReceipt,
  collectLeaderReceipts,
} from './registrationReceipt';
import { computeDecisionHash, statusMatchesDecisionCode } from './decisionHash';
import {
  isCompletedVerdictStatus,
  isValidDecisionHash,
  parseFindingCodesJson,
  type CompletedVerdictStatus,
} from './decisionReport';
import { parseCandidateId } from './candidateId';
import type {
  OnChainCandidateRecord,
  OnChainPackageRecord,
  PendingEvaluationSnapshot,
} from '../types/updateSeal';

export const DECISION_SUMMARY_MAX = 4000;
export const EVALUATION_SNAPSHOT_STORAGE_PREFIX = 'updateseal_eval_tx';

export const classifyEvaluationReceipt = classifyRegistrationReceipt;

const SECRET_KEYS = ['privateKey', 'private_key', 'mnemonic', 'signature', 'provider', 'secret'];

export function evaluationStorageKey(chainId: number, contractAddress: string, candidateId: string): string {
  return `${EVALUATION_SNAPSHOT_STORAGE_PREFIX}:${chainId}:${contractAddress.toLowerCase()}:${candidateId}`;
}

export function createPendingEvaluationSnapshot(args: {
  transactionHash: `0x${string}`;
  candidateId: string;
  packageUid: string;
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
  originalEvaluationAttempts: number;
  callerAddress: string;
  chainId: number;
  contractAddress: string;
  feeEstimateWei: bigint | string;
  submitter: string;
  submittedAtLocal?: string;
}): PendingEvaluationSnapshot {
  return Object.freeze({
    transactionHash: args.transactionHash,
    candidateId: args.candidateId,
    packageUid: args.packageUid,
    version: args.version,
    candidateCommitSha: args.candidateCommitSha,
    evidenceUri: args.evidenceUri,
    evidenceHash: args.evidenceHash.toLowerCase(),
    originalStatus: 'PENDING',
    originalEvaluationAttempts: args.originalEvaluationAttempts,
    callerAddress: args.callerAddress.trim().toLowerCase() as `0x${string}`,
    chainId: args.chainId,
    contractAddress: args.contractAddress.toLowerCase() as `0x${string}`,
    feeEstimateWei: typeof args.feeEstimateWei === 'bigint' ? args.feeEstimateWei.toString() : args.feeEstimateWei,
    submittedAtLocal: args.submittedAtLocal ?? new Date().toISOString(),
    submitter: args.submitter.trim().toLowerCase(),
  });
}

export function snapshotContainsSecrets(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return Object.keys(record).some((key) => SECRET_KEYS.includes(key));
}

export function saveEvaluationSnapshot(snapshot: PendingEvaluationSnapshot): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const key = evaluationStorageKey(snapshot.chainId, snapshot.contractAddress, snapshot.candidateId);
  localStorage.setItem(key, JSON.stringify(snapshot));
}

export function loadEvaluationSnapshot(
  chainId: number,
  contractAddress: string,
  candidateId: string,
): PendingEvaluationSnapshot | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(evaluationStorageKey(chainId, contractAddress, candidateId));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PendingEvaluationSnapshot;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (snapshotContainsSecrets(parsed)) {
      return null;
    }
    if (typeof parsed.transactionHash !== 'string' || typeof parsed.candidateId !== 'string') {
      return null;
    }
    return Object.freeze({ ...parsed });
  } catch {
    return null;
  }
}

export function clearEvaluationSnapshot(chainId: number, contractAddress: string, candidateId: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(evaluationStorageKey(chainId, contractAddress, candidateId));
}

export function extractReturnedDecisionName(receipt: unknown): CompletedVerdictStatus | null {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return null;
  }
  for (const leader of collectLeaderReceipts(rec)) {
    const result = leader.result;
    if (typeof result === 'string' && isCompletedVerdictStatus(result)) {
      return result;
    }
  }
  return null;
}

export function candidateIdentityMatchesSnapshot(
  record: OnChainCandidateRecord,
  snapshot: PendingEvaluationSnapshot,
): { ok: true } | { ok: false; reason: string } {
  if (record.candidate_id !== snapshot.candidateId) {
    return { ok: false, reason: 'candidate_id' };
  }
  if (record.package_uid !== snapshot.packageUid) {
    return { ok: false, reason: 'package_uid' };
  }
  if (record.version !== snapshot.version) {
    return { ok: false, reason: 'version' };
  }
  if (record.candidate_commit_sha !== snapshot.candidateCommitSha) {
    return { ok: false, reason: 'candidate_commit_sha' };
  }
  if (record.evidence_uri !== snapshot.evidenceUri) {
    return { ok: false, reason: 'evidence_uri' };
  }
  if (record.evidence_hash.toLowerCase() !== snapshot.evidenceHash.toLowerCase()) {
    return { ok: false, reason: 'evidence_hash' };
  }
  if (snapshot.submitter && record.submitter.toLowerCase() !== snapshot.submitter.toLowerCase()) {
    return { ok: false, reason: 'submitter' };
  }
  return { ok: true };
}

export async function verifyEvaluationReadBack(args: {
  snapshot: PendingEvaluationSnapshot;
  candidate: OnChainCandidateRecord;
  packageRecord: OnChainPackageRecord;
  decodedStatus: CompletedVerdictStatus | null;
}): Promise<
  | { ok: true; status: CompletedVerdictStatus }
  | { ok: false; code: 'READBACK_MISMATCH' | 'DECISION_INTEGRITY_ERROR' | 'STATUS_UNKNOWN'; message: string }
> {
  const identity = candidateIdentityMatchesSnapshot(args.candidate, args.snapshot);
  if (!identity.ok) {
    return {
      ok: false,
      code: 'READBACK_MISMATCH',
      message: `Finalized candidate ${identity.reason} does not match the evaluation snapshot.`,
    };
  }

  if (args.candidate.package_uid !== args.packageRecord.package_uid) {
    return {
      ok: false,
      code: 'READBACK_MISMATCH',
      message: 'Candidate package UID does not match the loaded package.',
    };
  }

  if (args.candidate.status === 'PENDING') {
    return {
      ok: false,
      code: 'STATUS_UNKNOWN',
      message: 'The receipt finished but the candidate is still PENDING. Keep this hash and check status.',
    };
  }

  if (!isCompletedVerdictStatus(args.candidate.status)) {
    return {
      ok: false,
      code: 'READBACK_MISMATCH',
      message: 'On-chain evaluation status is not a supported completed verdict.',
    };
  }

  if (!statusMatchesDecisionCode(args.candidate.status, args.candidate.decision_code)) {
    return {
      ok: false,
      code: 'DECISION_INTEGRITY_ERROR',
      message: 'On-chain status does not match decision_code.',
    };
  }

  const summary = args.candidate.decision_summary ?? '';
  if (summary.trim().length === 0 || summary.length > DECISION_SUMMARY_MAX) {
    return {
      ok: false,
      code: 'DECISION_INTEGRITY_ERROR',
      message: 'decision_summary must be present and bounded.',
    };
  }

  const findings = parseFindingCodesJson(args.candidate.finding_codes_json);
  if (!findings.ok) {
    return { ok: false, code: 'DECISION_INTEGRITY_ERROR', message: findings.reason };
  }

  if (args.candidate.evaluation_attempts <= args.snapshot.originalEvaluationAttempts) {
    return {
      ok: false,
      code: 'READBACK_MISMATCH',
      message: 'evaluation_attempts did not increase after evaluation.',
    };
  }

  if (!isValidDecisionHash(args.candidate.decision_hash)) {
    return {
      ok: false,
      code: 'DECISION_INTEGRITY_ERROR',
      message: 'decision_hash must be exactly 64 lowercase hexadecimal characters.',
    };
  }

  if (args.candidate.evidence_hash.toLowerCase() !== args.snapshot.evidenceHash.toLowerCase()) {
    return {
      ok: false,
      code: 'READBACK_MISMATCH',
      message: 'evidence_hash changed after evaluation.',
    };
  }

  if (!isValidDecisionHash(args.packageRecord.charter_hash)) {
    return {
      ok: false,
      code: 'DECISION_INTEGRITY_ERROR',
      message: 'charter_hash must be exactly 64 lowercase hexadecimal characters.',
    };
  }

  const recomputed = await computeDecisionHash({
    candidate_id: args.candidate.candidate_id,
    charter_hash: args.packageRecord.charter_hash,
    decision_code: args.candidate.decision_code,
    decision_name: args.candidate.status,
    evidence_hash: args.candidate.evidence_hash,
    finding_codes: findings.codes,
    summary: args.candidate.decision_summary,
  });
  if (recomputed !== args.candidate.decision_hash) {
    return {
      ok: false,
      code: 'DECISION_INTEGRITY_ERROR',
      message: 'Recomputed decision hash does not match the stored decision_hash.',
    };
  }

  if (args.decodedStatus && args.decodedStatus !== args.candidate.status) {
    return {
      ok: false,
      code: 'DECISION_INTEGRITY_ERROR',
      message: 'Decoded receipt status does not match the stored candidate status.',
    };
  }

  const parsedId = parseCandidateId(args.candidate.candidate_id);
  if (parsedId.ok && parsedId.candidateId !== args.snapshot.candidateId) {
    return {
      ok: false,
      code: 'READBACK_MISMATCH',
      message: 'Normalized candidate ID does not match the evaluation snapshot.',
    };
  }

  return { ok: true, status: args.candidate.status };
}
