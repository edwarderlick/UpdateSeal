import { describe, expect, it } from 'vitest';
import { createPendingCandidateSnapshot, extractReturnedCandidateId, verifyReadBackCandidate } from './candidateReceipt';
import type { OnChainCandidateRecord } from '../types/updateSeal';

const TX = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as const;
const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
const PACKAGE_UID = `${SENDER}/updateseal-smoke`;

function snapshot() {
  return createPendingCandidateSnapshot({
    transactionHash: TX,
    senderAddress: '0x82FDE1090C2941E5D8742A944813EBFC09C91C12',
    packageUid: PACKAGE_UID,
    version: '1.0.1',
    candidateCommitSha: 'ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123',
    evidenceUri: 'https://raw.githubusercontent.com/edwarderlick/Provider-Court/ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123/e.json',
    evidenceHash: 'DD'.repeat(32),
  });
}

function record(overrides: Partial<OnChainCandidateRecord> = {}): OnChainCandidateRecord {
  const snap = snapshot();
  return {
    candidate_id: snap.expectedCandidateId,
    package_uid: snap.packageUid,
    version: snap.version,
    candidate_commit_sha: snap.candidateCommitSha,
    evidence_uri: snap.evidenceUri,
    evidence_hash: snap.evidenceHash,
    submitter: snap.senderAddress,
    status: 'PENDING',
    decision_code: 0,
    decision_summary: '',
    evaluation_attempts: 0,
    finding_codes_json: '',
    decision_hash: '',
    ...overrides,
  };
}

describe('candidateReceipt', () => {
  it('freezes a candidate snapshot and lowercases sender and evidence hash', () => {
    const snap = snapshot();
    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap.senderAddress).toBe(SENDER);
    expect(snap.evidenceHash).toBe('dd'.repeat(32));
    expect(snap.expectedCandidateId).toBe(`${PACKAGE_UID}@1.0.1`);
    expect(snap.candidateCommitSha).toBe('ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123');
  });

  it('accepts a matching PENDING read-back', () => {
    expect(verifyReadBackCandidate(record(), snapshot(), SENDER).ok).toBe(true);
  });

  it('rejects mismatches including evaluated fields', () => {
    expect(verifyReadBackCandidate(record({ status: 'APPROVED' }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record({ decision_code: 1 }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record({ decision_summary: 'ok' }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record({ evaluation_attempts: 1 }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record({ finding_codes_json: '[]' }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record({ decision_hash: 'ab' }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record({ evidence_hash: 'ee'.repeat(32) }), snapshot(), SENDER).ok).toBe(false);
    expect(verifyReadBackCandidate(record(), snapshot(), '0x1111111111111111111111111111111111111111').ok).toBe(false);
  });

  it('extracts any structurally valid returned candidate ID without filtering by the expected ID', () => {
    const expected = snapshot().expectedCandidateId;
    const other = `${PACKAGE_UID}@9.9.9`;
    expect(
      extractReturnedCandidateId({
        consensus_data: { leader_receipt: [{ result: expected }] },
      }),
    ).toBe(expected);
    expect(
      extractReturnedCandidateId({
        consensus_data: { leader_receipt: [{ result: other }] },
      }),
    ).toBe(other);
    expect(extractReturnedCandidateId({ consensus_data: { leader_receipt: [{ result: 'not-an-id' }] } })).toBeNull();
    expect(extractReturnedCandidateId({ consensus_data: { leader_receipt: [{ result: '' }] } })).toBeNull();
    expect(extractReturnedCandidateId(null)).toBeNull();
  });
});
