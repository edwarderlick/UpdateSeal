import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from './updateSealConfig';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';
import { computeDecisionHash } from './decisionHash';
import {
  inspectRetrievedRelease,
  stringifyMachineReadableResult,
  verifyEvidenceBytes,
  verifyLiveRelease,
} from './verifyRelease';

const { candidateExists, getCandidate, getCandidateId, getPackage } = vi.hoisted(() => ({
  candidateExists: vi.fn(),
  getCandidate: vi.fn(),
  getCandidateId: vi.fn(),
  getPackage: vi.fn(),
}));

vi.mock('../services/updateSealContract', async () => {
  const actual = await vi.importActual<typeof import('../services/updateSealContract')>(
    '../services/updateSealContract',
  );
  return {
    ...actual,
    candidateExists,
    getCandidate,
    getCandidateId,
    getPackage,
  };
});

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

const APPROVED: OnChainCandidateRecord = {
  candidate_id: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke',
  package_uid: PACKAGE.package_uid,
  version: '0.1.0-v2-smoke',
  candidate_commit_sha: 'd097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f',
  evidence_uri:
    'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/d097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f/evidence/evidence-v2.json',
  evidence_hash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  submitter: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  status: 'APPROVED',
  decision_code: 1,
  decision_summary: 'No charter violations were found',
  evaluation_attempts: 1,
  finding_codes_json: '["NO_VIOLATION"]',
  decision_hash: 'c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97',
};

const EXPECTED = {
  candidateId: APPROVED.candidate_id,
  packageUid: PACKAGE.package_uid,
  version: APPROVED.version,
};

async function withHash(overrides: Partial<OnChainCandidateRecord>): Promise<OnChainCandidateRecord> {
  const candidate = { ...APPROVED, ...overrides };
  const findings = JSON.parse(candidate.finding_codes_json) as string[];
  const decision_hash = await computeDecisionHash({
    candidate_id: candidate.candidate_id,
    charter_hash: PACKAGE.charter_hash,
    decision_code: candidate.decision_code,
    decision_name: candidate.status,
    evidence_hash: candidate.evidence_hash,
    finding_codes: findings,
    summary: candidate.decision_summary,
  });
  return { ...candidate, decision_hash };
}

describe('verifyLiveRelease', () => {
  beforeEach(() => {
    candidateExists.mockReset();
    getCandidate.mockReset();
    getCandidateId.mockReset();
    getPackage.mockReset();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('resolves package UID + version through get_candidate_id', async () => {
    getCandidateId.mockResolvedValue(APPROVED.candidate_id);
    candidateExists.mockResolvedValue(true);
    getCandidate.mockResolvedValue(APPROVED);
    getPackage.mockResolvedValue(PACKAGE);
    const result = await verifyLiveRelease({
      mode: 'package',
      candidateId: APPROVED.candidate_id,
      packageUid: PACKAGE.package_uid,
      version: APPROVED.version,
    });
    expect(getCandidateId).toHaveBeenCalledWith(PACKAGE.package_uid, APPROVED.version);
    expect(result.outcome).toBe('verified');
  });

  it('returns RELEASE NOT FOUND when the candidate is missing', async () => {
    candidateExists.mockResolvedValue(false);
    const result = await verifyLiveRelease({ mode: 'candidate', ...EXPECTED });
    expect(result.headline).toBe('RELEASE NOT FOUND');
    expect(getCandidate).not.toHaveBeenCalled();
    expect(getPackage).not.toHaveBeenCalled();
  });

  it('returns VERIFIED — APPROVED for the official fixture', async () => {
    candidateExists.mockResolvedValue(true);
    getCandidate.mockResolvedValue(APPROVED);
    getPackage.mockResolvedValue(PACKAGE);
    const result = await verifyLiveRelease({ mode: 'candidate', ...EXPECTED });
    expect(result.headline).toBe('VERIFIED — APPROVED');
    if (result.outcome === 'verified') {
      expect(result.decisionHashVerified).toBe(true);
      expect(result.findingCodes).toEqual(['NO_VIOLATION']);
    }
  });

  it('does not describe REVIEW_REQUIRED as approved', async () => {
    const candidate = await withHash({
      status: 'REVIEW_REQUIRED',
      decision_code: 2,
      decision_summary: 'Needs review',
      finding_codes_json: '["CAPABILITY_EXPANSION"]',
    });
    const result = await inspectRetrievedRelease(candidate, PACKAGE, EXPECTED);
    expect(result.headline).toBe('VERIFIED — REVIEW REQUIRED');
    expect(result.headline.includes('APPROVED')).toBe(false);
  });

  it('does not describe VIOLATION as approved', async () => {
    const candidate = await withHash({
      status: 'VIOLATION',
      decision_code: 3,
      decision_summary: 'Forbidden capability',
      finding_codes_json: '["FORBIDDEN_CAPABILITY"]',
    });
    const result = await inspectRetrievedRelease(candidate, PACKAGE, EXPECTED);
    expect(result.headline).toBe('VERIFIED — VIOLATION');
    expect(result.headline.includes('APPROVED')).toBe(false);
  });

  it('returns VERIFIED — EVIDENCE UNAVAILABLE', async () => {
    const candidate = await withHash({
      status: 'EVIDENCE_UNAVAILABLE',
      decision_code: 4,
      decision_summary: 'Could not fetch evidence',
      finding_codes_json: '["EVIDENCE_FETCH_FAILED"]',
    });
    const result = await inspectRetrievedRelease(candidate, PACKAGE, EXPECTED);
    expect(result.headline).toBe('VERIFIED — EVIDENCE UNAVAILABLE');
  });

  it('PENDING has no final decision verdict or required decision hash', async () => {
    const result = await inspectRetrievedRelease(
      {
        ...APPROVED,
        status: 'PENDING',
        decision_code: 0,
        decision_summary: '',
        evaluation_attempts: 0,
        finding_codes_json: '',
        decision_hash: '',
      },
      PACKAGE,
      EXPECTED,
    );
    expect(result.headline).toBe('PENDING — NO FINAL DECISION');
    expect(result.outcome).toBe('pending');
  });

  it('rejects malformed finding_codes_json', async () => {
    const result = await inspectRetrievedRelease(
      { ...APPROVED, finding_codes_json: 'NO_VIOLATION,OTHER' },
      PACKAGE,
      EXPECTED,
    );
    expect(result.headline).toBe('ON-CHAIN DATA INTEGRITY ERROR');
  });

  it('rejects invalid evidence, charter, and decision hashes', async () => {
    expect(
      (await inspectRetrievedRelease({ ...APPROVED, evidence_hash: 'ABC' }, PACKAGE, EXPECTED)).headline,
    ).toBe('ON-CHAIN DATA INTEGRITY ERROR');
    expect(
      (await inspectRetrievedRelease(APPROVED, { ...PACKAGE, charter_hash: 'not-a-hash' }, EXPECTED)).headline,
    ).toBe('ON-CHAIN DATA INTEGRITY ERROR');
    expect(
      (await inspectRetrievedRelease({ ...APPROVED, decision_hash: 'AA'.repeat(32) }, PACKAGE, EXPECTED)).headline,
    ).toBe('ON-CHAIN DATA INTEGRITY ERROR');
  });

  it('rejects candidate/package identity mismatch', async () => {
    const result = await inspectRetrievedRelease(
      APPROVED,
      { ...PACKAGE, package_uid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/other' },
      EXPECTED,
    );
    expect(result.headline).toBe('ON-CHAIN DATA INTEGRITY ERROR');
  });

  it('rejects a decision hash that does not recompute', async () => {
    const result = await inspectRetrievedRelease(
      { ...APPROVED, decision_hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
      PACKAGE,
      EXPECTED,
    );
    expect(result.headline).toBe('ON-CHAIN DATA INTEGRITY ERROR');
  });

  it('machine-readable JSON contains only the expected public fields', async () => {
    candidateExists.mockResolvedValue(true);
    getCandidate.mockResolvedValue(APPROVED);
    getPackage.mockResolvedValue(PACKAGE);
    const result = await verifyLiveRelease({ mode: 'candidate', ...EXPECTED });
    expect(result.outcome).toBe('verified');
    if (result.outcome !== 'verified') {
      return;
    }
    const parsed = JSON.parse(stringifyMachineReadableResult(result.machine)) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual([
      'network',
      'chain_id',
      'contract_address',
      'package_uid',
      'candidate_id',
      'repository_url',
      'baseline_commit_sha',
      'candidate_commit_sha',
      'status',
      'decision_code',
      'decision_summary',
      'finding_codes',
      'charter_hash',
      'evidence_uri',
      'evidence_hash',
      'decision_hash',
      'decision_hash_verified',
      'evidence_bytes_verified',
      'evaluation_attempts',
    ]);
    expect(parsed.evidence_bytes_verified).toBeNull();
    expect(parsed.decision_hash_verified).toBe(true);
  });
});

describe('verifyEvidenceBytes', () => {
  const uri = APPROVED.evidence_uri;

  it('rejects an unsafe evidence URL before fetch', async () => {
    const fetchFn = vi.fn();
    const result = await verifyEvidenceBytes({
      evidenceUri: 'http://example.com/evidence.json',
      evidenceHash: APPROVED.evidence_hash,
      repositoryUrl: PACKAGE.repository_url,
      candidateCommitSha: APPROVED.candidate_commit_sha,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    expect(result.message).toBe('Evidence URL integrity error');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('verifies exact-byte SHA-256', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const hash = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const result = await verifyEvidenceBytes({
      evidenceUri: uri,
      evidenceHash: hash,
      repositoryUrl: PACKAGE.repository_url,
      candidateCommitSha: APPROVED.candidate_commit_sha,
      fetchFn: (async () =>
        new Response(bytes, { status: 200 })) as unknown as typeof fetch,
      sha256HexFn: async () => hash,
    });
    expect(result.message).toBe('Evidence bytes verified');
  });

  it('reports an evidence hash mismatch', async () => {
    const result = await verifyEvidenceBytes({
      evidenceUri: uri,
      evidenceHash: APPROVED.evidence_hash,
      repositoryUrl: PACKAGE.repository_url,
      candidateCommitSha: APPROVED.candidate_commit_sha,
      fetchFn: (async () =>
        new Response(new Uint8Array([9, 9, 9]), { status: 200 })) as unknown as typeof fetch,
      sha256HexFn: async () => 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });
    expect(result.message).toBe('Evidence hash mismatch');
  });

  it('reports evidence HTTP failure', async () => {
    const result = await verifyEvidenceBytes({
      evidenceUri: uri,
      evidenceHash: APPROVED.evidence_hash,
      repositoryUrl: PACKAGE.repository_url,
      candidateCommitSha: APPROVED.candidate_commit_sha,
      fetchFn: (async () => new Response('missing', { status: 404 })) as unknown as typeof fetch,
    });
    expect(result.message).toBe('Evidence unavailable');
  });

  it('rejects an oversized evidence response', async () => {
    const big = new Uint8Array(100001);
    const result = await verifyEvidenceBytes({
      evidenceUri: uri,
      evidenceHash: APPROVED.evidence_hash,
      repositoryUrl: PACKAGE.repository_url,
      candidateCommitSha: APPROVED.candidate_commit_sha,
      fetchFn: (async () => new Response(big, { status: 200 })) as unknown as typeof fetch,
    });
    expect(result.message).toBe('Evidence unavailable');
    if (result.status === 'unavailable') {
      expect(result.detail).toMatch(/100,000-byte/);
    }
  });
});
