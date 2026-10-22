import { describe, expect, it } from 'vitest';
import {
  candidateIdentityMatchesSnapshot,
  classifyEvaluationReceipt,
  createPendingEvaluationSnapshot,
  extractReturnedDecisionName,
  loadEvaluationSnapshot,
  saveEvaluationSnapshot,
  snapshotContainsSecrets,
  verifyEvaluationReadBack,
} from './evaluationReceipt';
import { computeDecisionHash } from './decisionHash';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';

const TX = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;
const CALLER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
const PACKAGE: OnChainPackageRecord = {
  package_uid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal',
  package_slug: 'updateseal',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/UpdateSeal',
  baseline_commit_sha: 'b5d498fa08949e1e0f5113fb2f9d154368dfa97c',
  charter_json: '{}',
  charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
  sequence: 1,
};

const SNAPSHOT = createPendingEvaluationSnapshot({
  transactionHash: TX,
  candidateId: `${PACKAGE.package_uid}@0.1.0-pending`,
  packageUid: PACKAGE.package_uid,
  version: '0.1.0-pending',
  candidateCommitSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  evidenceUri: 'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/e.json',
  evidenceHash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  originalStatus: 'PENDING',
  originalEvaluationAttempts: 0,
  callerAddress: CALLER,
  chainId: 61997,
  contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
  feeEstimateWei: 123n,
  submitter: PACKAGE.publisher,
});

function pendingRecord(overrides: Partial<OnChainCandidateRecord> = {}): OnChainCandidateRecord {
  return {
    candidate_id: SNAPSHOT.candidateId,
    package_uid: SNAPSHOT.packageUid,
    version: SNAPSHOT.version,
    candidate_commit_sha: SNAPSHOT.candidateCommitSha,
    evidence_uri: SNAPSHOT.evidenceUri,
    evidence_hash: SNAPSHOT.evidenceHash,
    submitter: SNAPSHOT.submitter,
    status: 'PENDING',
    decision_code: 0,
    decision_summary: '',
    evaluation_attempts: 0,
    finding_codes_json: '',
    decision_hash: '',
    ...overrides,
  };
}

function makeReceipt(overrides: Record<string, unknown> = {}) {
  return {
    statusName: 'FINALIZED',
    txExecutionResultName: 'FINISHED_WITH_RETURN',
    hash: TX,
    consensus_data: {
      leader_receipt: [{ result: 'APPROVED', execution_result: 'FINISHED_WITH_RETURN' }],
    },
    ...overrides,
  };
}

async function completedRecord(
  status: 'APPROVED' | 'REVIEW_REQUIRED' | 'VIOLATION' | 'EVIDENCE_UNAVAILABLE',
  code: number,
  findings: string[],
  summary: string,
) {
  const hash = await computeDecisionHash({
    candidate_id: SNAPSHOT.candidateId,
    charter_hash: PACKAGE.charter_hash,
    decision_code: code,
    decision_name: status,
    evidence_hash: SNAPSHOT.evidenceHash,
    finding_codes: findings,
    summary,
  });
  return pendingRecord({
    status,
    decision_code: code,
    decision_summary: summary,
    evaluation_attempts: 1,
    finding_codes_json: JSON.stringify(findings),
    decision_hash: hash,
  });
}

describe('evaluation receipt classification', () => {
  it('classifies isSuccessful accepted/finalized receipts as success', () => {
    expect(classifyEvaluationReceipt(makeReceipt()).kind).toBe('success');
    expect(classifyEvaluationReceipt(makeReceipt({ statusName: 'ACCEPTED' })).kind).toBe('success');
  });

  it('classifies terminal consensus rejection', () => {
    expect(classifyEvaluationReceipt(makeReceipt({ statusName: 'UNDETERMINED' })).kind).toBe('contract_rejected');
    expect(classifyEvaluationReceipt(makeReceipt({ statusName: 'CANCELED' })).kind).toBe('contract_rejected');
    expect(classifyEvaluationReceipt(makeReceipt({ statusName: 'VALIDATORS_TIMEOUT' })).kind).toBe('contract_rejected');
    expect(classifyEvaluationReceipt(makeReceipt({ statusName: 'LEADER_TIMEOUT' })).kind).toBe('contract_rejected');
  });

  it('classifies terminal execution failure', () => {
    expect(
      classifyEvaluationReceipt(
        makeReceipt({
          txExecutionResultName: 'FINISHED_WITH_ERROR',
          consensus_data: { leader_receipt: [{ error: 'terminal', execution_result: 'FINISHED_WITH_ERROR' }] },
        }),
      ).kind,
    ).toBe('contract_rejected');
    expect(
      classifyEvaluationReceipt(
        makeReceipt({
          txExecutionResultName: 'TIMEOUT',
          consensus_data: { leader_receipt: [{ error: 'timeout', execution_result: 'TIMEOUT' }] },
        }),
      ).kind,
    ).toBe('contract_rejected');
    expect(
      classifyEvaluationReceipt(
        makeReceipt({
          txExecutionResultName: 'NONDET_DISAGREE',
          consensus_data: { leader_receipt: [{ error: 'disagree', execution_result: 'NONDET_DISAGREE' }] },
        }),
      ).kind,
    ).toBe('contract_rejected');
    expect(
      classifyEvaluationReceipt(
        makeReceipt({
          txExecutionResultName: 'DETERMINISTIC_VIOLATION',
          consensus_data: { leader_receipt: [{ error: 'det', execution_result: 'DETERMINISTIC_VIOLATION' }] },
        }),
      ).kind,
    ).toBe('contract_rejected');
  });

  it('classifies pending/malformed/unknown receipts as status_unknown', () => {
    expect(classifyEvaluationReceipt({ statusName: 'PENDING', txExecutionResultName: 'NOT_VOTED', hash: TX }).kind).toBe(
      'status_unknown',
    );
    expect(classifyEvaluationReceipt(null).kind).toBe('status_unknown');
    expect(classifyEvaluationReceipt({ hash: TX }).kind).toBe('status_unknown');
  });

  it('extracts a completed decision name from the receipt return', () => {
    expect(extractReturnedDecisionName(makeReceipt())).toBe('APPROVED');
  });
});

describe('evaluation snapshot', () => {
  it('is created from confirmed values and contains no secrets', () => {
    expect(SNAPSHOT.candidateId).toBe(`${PACKAGE.package_uid}@0.1.0-pending`);
    expect(SNAPSHOT.callerAddress).toBe(CALLER);
    expect(SNAPSHOT.originalStatus).toBe('PENDING');
    expect(SNAPSHOT.feeEstimateWei).toBe('123');
    expect(snapshotContainsSecrets(SNAPSHOT)).toBe(false);
    expect(snapshotContainsSecrets({ ...SNAPSHOT, privateKey: '0xabc' })).toBe(true);
  });

  it('preserves EVIDENCE_UNAVAILABLE originalStatus and previous attempts', () => {
    const retrySnapshot = createPendingEvaluationSnapshot({
      transactionHash: TX,
      candidateId: SNAPSHOT.candidateId,
      packageUid: SNAPSHOT.packageUid,
      version: SNAPSHOT.version,
      candidateCommitSha: SNAPSHOT.candidateCommitSha,
      evidenceUri: SNAPSHOT.evidenceUri,
      evidenceHash: SNAPSHOT.evidenceHash,
      originalStatus: 'EVIDENCE_UNAVAILABLE',
      originalEvaluationAttempts: 2,
      callerAddress: CALLER,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      feeEstimateWei: 123n,
      submitter: PACKAGE.publisher,
    });
    expect(retrySnapshot.originalStatus).toBe('EVIDENCE_UNAVAILABLE');
    expect(retrySnapshot.originalEvaluationAttempts).toBe(2);
  });

  it('persists public snapshot across reload and wallet-independent keys', () => {
    saveEvaluationSnapshot(SNAPSHOT);
    const loaded = loadEvaluationSnapshot(SNAPSHOT.chainId, SNAPSHOT.contractAddress, SNAPSHOT.candidateId);
    expect(loaded?.transactionHash).toBe(SNAPSHOT.transactionHash);
    expect(loaded?.candidateId).toBe(SNAPSHOT.candidateId);
    expect(loaded?.submittedAtLocal).toBe(SNAPSHOT.submittedAtLocal);
    expect(snapshotContainsSecrets(loaded)).toBe(false);
  });
});

describe('evaluation read-back', () => {
  it('accepts successful completed verdicts', async () => {
    const approved = await completedRecord('APPROVED', 1, ['NO_VIOLATION'], 'No charter violations were found');
    expect(
      (await verifyEvaluationReadBack({ snapshot: SNAPSHOT, candidate: approved, packageRecord: PACKAGE, decodedStatus: 'APPROVED' }))
        .ok,
    ).toBe(true);
    const review = await completedRecord('REVIEW_REQUIRED', 2, ['HUMAN_REVIEW'], 'Review required');
    expect(
      (await verifyEvaluationReadBack({ snapshot: SNAPSHOT, candidate: review, packageRecord: PACKAGE, decodedStatus: null })).ok,
    ).toBe(true);
    const violation = await completedRecord('VIOLATION', 3, ['FORBIDDEN_CAPABILITY'], 'Violation');
    expect(
      (await verifyEvaluationReadBack({ snapshot: SNAPSHOT, candidate: violation, packageRecord: PACKAGE, decodedStatus: null })).ok,
    ).toBe(true);
    const unavailable = await completedRecord('EVIDENCE_UNAVAILABLE', 4, ['EVIDENCE_FETCH_FAILED'], 'Evidence unavailable');
    expect(
      (await verifyEvaluationReadBack({ snapshot: SNAPSHOT, candidate: unavailable, packageRecord: PACKAGE, decodedStatus: null }))
        .ok,
    ).toBe(true);
    const retrySnapshot = createPendingEvaluationSnapshot({
      ...SNAPSHOT,
      originalStatus: 'EVIDENCE_UNAVAILABLE',
      originalEvaluationAttempts: 1,
    });
    const stillUnavailable = await completedRecord(
      'EVIDENCE_UNAVAILABLE',
      4,
      ['EVIDENCE_FETCH_FAILED'],
      'Evidence unavailable',
    );
    stillUnavailable.evaluation_attempts = 2;
    expect(
      (
        await verifyEvaluationReadBack({
          snapshot: retrySnapshot,
          candidate: stillUnavailable,
          packageRecord: PACKAGE,
          decodedStatus: 'EVIDENCE_UNAVAILABLE',
        })
      ).ok,
    ).toBe(true);
  });

  it('treats remaining PENDING as status_unknown', async () => {
    const result = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: pendingRecord(),
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('STATUS_UNKNOWN');
    }
  });

  it('rejects attempts that did not increase', async () => {
    const approved = await completedRecord('APPROVED', 1, ['NO_VIOLATION'], 'ok');
    approved.evaluation_attempts = 0;
    const result = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: approved,
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('READBACK_MISMATCH');
    }
  });

  it('rejects identity and evidence-hash mismatches', async () => {
    const approved = await completedRecord('APPROVED', 1, ['NO_VIOLATION'], 'ok');
    const id = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: { ...approved, version: '9.9.9' },
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(id.ok).toBe(false);
    const evidence = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: { ...approved, evidence_hash: 'ff'.repeat(32) },
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(evidence.ok).toBe(false);
    expect(candidateIdentityMatchesSnapshot({ ...approved, evidence_hash: 'aa'.repeat(32) }, SNAPSHOT).ok).toBe(false);
  });

  it('rejects malformed findings, invalid hashes, recompute mismatch, and decoded mismatch', async () => {
    const approved = await completedRecord('APPROVED', 1, ['NO_VIOLATION'], 'ok');
    const findings = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: { ...approved, finding_codes_json: '{bad' },
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(findings.ok).toBe(false);
    if (!findings.ok) {
      expect(findings.code).toBe('DECISION_INTEGRITY_ERROR');
    }
    const hash = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: { ...approved, decision_hash: 'ABCD' },
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(hash.ok).toBe(false);
    const recompute = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: { ...approved, decision_hash: 'ab'.repeat(32) },
      packageRecord: PACKAGE,
      decodedStatus: null,
    });
    expect(recompute.ok).toBe(false);
    const decoded = await verifyEvaluationReadBack({
      snapshot: SNAPSHOT,
      candidate: approved,
      packageRecord: PACKAGE,
      decodedStatus: 'VIOLATION',
    });
    expect(decoded.ok).toBe(false);
    if (!decoded.ok) {
      expect(decoded.code).toBe('DECISION_INTEGRITY_ERROR');
    }
  });
});
