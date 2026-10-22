import { asReceiptRecord, classifyRegistrationReceipt, collectLeaderReceipts } from './registrationReceipt';
import type { OnChainCandidateRecord, PendingCandidateSnapshot } from '../types/updateSeal';
import { deriveCandidateId } from './candidateValidation';

export function createPendingCandidateSnapshot(args: {
  transactionHash: `0x${string}`;
  senderAddress: string;
  packageUid: string;
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
  expectedCandidateId?: string;
}): PendingCandidateSnapshot {
  const senderAddress = args.senderAddress.trim().toLowerCase() as `0x${string}`;
  const expectedCandidateId = args.expectedCandidateId ?? deriveCandidateId(args.packageUid, args.version);
  return Object.freeze({
    transactionHash: args.transactionHash,
    senderAddress,
    packageUid: args.packageUid,
    expectedCandidateId,
    version: args.version,
    candidateCommitSha: args.candidateCommitSha,
    evidenceUri: args.evidenceUri,
    evidenceHash: args.evidenceHash.toLowerCase(),
  });
}

export function isStructurallyValidCandidateId(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) {
    return false;
  }
  const packageUid = value.slice(0, at);
  const version = value.slice(at + 1);
  if (!packageUid.includes('/')) {
    return false;
  }
  if (version.includes('@')) {
    return false;
  }
  return true;
}

export function extractReturnedCandidateId(receipt: unknown): string | null {
  const rec = asReceiptRecord(receipt);
  if (!rec) {
    return null;
  }
  for (const leader of collectLeaderReceipts(rec)) {
    const result = leader.result;
    if (typeof result === 'string' && isStructurallyValidCandidateId(result)) {
      return result;
    }
  }
  return null;
}

export function verifyReadBackCandidate(
  record: OnChainCandidateRecord,
  snapshot: PendingCandidateSnapshot,
  publisherAddress: string,
): { ok: true } | { ok: false; reason: string } {
  if (record.candidate_id !== snapshot.expectedCandidateId) {
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
  if (record.evidence_hash !== snapshot.evidenceHash.toLowerCase()) {
    return { ok: false, reason: 'evidence_hash' };
  }
  if (record.submitter.toLowerCase() !== snapshot.senderAddress.toLowerCase()) {
    return { ok: false, reason: 'submitter' };
  }
  if (record.submitter.toLowerCase() !== publisherAddress.toLowerCase()) {
    return { ok: false, reason: 'publisher' };
  }
  if (record.status !== 'PENDING') {
    return { ok: false, reason: 'status' };
  }
  if (record.decision_code !== 0) {
    return { ok: false, reason: 'decision_code' };
  }
  if (record.decision_summary !== '') {
    return { ok: false, reason: 'decision_summary' };
  }
  if (record.evaluation_attempts !== 0) {
    return { ok: false, reason: 'evaluation_attempts' };
  }
  if (record.finding_codes_json !== '') {
    return { ok: false, reason: 'finding_codes_json' };
  }
  if (record.decision_hash !== '') {
    return { ok: false, reason: 'decision_hash' };
  }
  return { ok: true };
}

export { classifyRegistrationReceipt as classifyCandidateReceipt };
