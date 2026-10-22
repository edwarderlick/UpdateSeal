import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseUpdateSealConfig } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import { VALID_LIVE_ENV, SMOKE_PACKAGE } from '../../test/updateSealFixtures';
import { createPendingCandidateSnapshot } from '../../lib/candidateReceipt';
import { buildEvidencePreflightInputs, type EvidencePreflightSuccess } from '../../lib/evidencePreflight';
import {
  checkCandidateStatus,
  resetActiveCandidateSubmissionForTests,
  submitLiveCandidate,
  type LiveCandidateSubmitInput,
} from './submitCandidate';

const SENDER = SMOKE_PACKAGE.publisher;
const TX_HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as const;
const VERSION = '1.0.1';
const SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const URI = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA}/updateseal/evidence.json`;
const HASH = 'aa'.repeat(32);

const liveConfig = {
  ok: true as const,
  config: parseUpdateSealConfig(VALID_LIVE_ENV),
};

const demoConfig = {
  ok: true as const,
  config: parseUpdateSealConfig({ ...VALID_LIVE_ENV, VITE_UPDATESEAL_DATA_MODE: 'demo' }),
};

const invalidConfig = {
  ok: false as const,
  error: new UpdateSealError('CONFIG_INVALID', 'VITE_UPDATESEAL_DATA_MODE must be exactly "live" or "demo".'),
};

const preflightInputs = buildEvidencePreflightInputs({
  evidenceUri: URI,
  evidenceHash: HASH,
  packageUid: SMOKE_PACKAGE.package_uid,
  version: VERSION,
  baselineCommitSha: SMOKE_PACKAGE.baseline_commit_sha,
  candidateCommitSha: SHA,
});

const preflight: EvidencePreflightSuccess = {
  ok: true,
  httpStatus: 200,
  bodySize: 12,
  computedSha256: HASH,
  expectedSha256: HASH,
  document: {
    schemaVersion: 2,
    packageUid: SMOKE_PACKAGE.package_uid,
    version: VERSION,
    baselineCommitSha: SMOKE_PACKAGE.baseline_commit_sha,
    diffSummary: 'diff',
    changedFiles: ['a.ts'],
    declaredCapabilities: ['network_egress'],
    requestedDomains: ['github.com'],
    evidenceItems: ['git_diff'],
    tests: [{ name: 'unit', status: 'passed' }],
  },
  inputs: preflightInputs,
};

const provider = { request: vi.fn() };

function liveInput(overrides: Partial<LiveCandidateSubmitInput> = {}): LiveCandidateSubmitInput {
  return {
    packageRecord: SMOKE_PACKAGE,
    version: VERSION,
    candidateCommitSha: SHA,
    evidenceUri: URI,
    evidenceHash: HASH,
    evidencePreflight: preflight,
    connectedAddress: SENDER,
    isConnected: true,
    chainId: 61997,
    provider,
    configResult: liveConfig,
    ...overrides,
  };
}

describe('submitLiveCandidate', () => {
  const getPackageFn = vi.fn();
  const getCandidateIdFn = vi.fn();
  const candidateExistsFn = vi.fn();
  const getCandidateFn = vi.fn();
  const submitCandidateFn = vi.fn();
  const createWriteClientFn = vi.fn(() => ({
    writeContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    estimateTransactionFeesForWrite: vi.fn(),
  }));
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  const deps = {
    getPackageFn,
    getCandidateIdFn,
    candidateExistsFn,
    getCandidateFn,
    submitCandidateFn,
    createWriteClientFn,
  };

  beforeEach(() => {
    resetActiveCandidateSubmissionForTests();
    getPackageFn.mockReset();
    getCandidateIdFn.mockReset();
    candidateExistsFn.mockReset();
    getCandidateFn.mockReset();
    submitCandidateFn.mockReset();
    createWriteClientFn.mockClear();
    fetchSpy.mockClear();
    getPackageFn.mockResolvedValue(SMOKE_PACKAGE);
    getCandidateIdFn.mockResolvedValue(`${SMOKE_PACKAGE.package_uid}@${VERSION}`);
    candidateExistsFn.mockResolvedValue(false);
  });

  it('returns demo without estimation or writes', async () => {
    const result = await submitLiveCandidate(liveInput({ configResult: demoConfig }), deps);
    expect(result).toEqual({ ok: true, phase: 'demo' });
    expect(submitCandidateFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks invalid configuration with zero writes', async () => {
    const result = await submitLiveCandidate(liveInput({ configResult: invalidConfig }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('config_invalid');
    }
    expect(submitCandidateFn).not.toHaveBeenCalled();
  });

  it('requires a connected wallet', async () => {
    const result = await submitLiveCandidate(liveInput({ isConnected: false, connectedAddress: null }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('wallet_required');
    }
    expect(submitCandidateFn).not.toHaveBeenCalled();
  });

  it('requires chain 61997', async () => {
    const result = await submitLiveCandidate(liveInput({ chainId: 1 }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('wrong_network');
    }
    expect(submitCandidateFn).not.toHaveBeenCalled();
  });

  it('requires the connected address to equal the publisher', async () => {
    const result = await submitLiveCandidate(
      liveInput({ connectedAddress: '0x1111111111111111111111111111111111111111' }),
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('wrong_publisher');
    }
    expect(submitCandidateFn).not.toHaveBeenCalled();
  });

  it('blocks a duplicate candidate and links to the record', async () => {
    candidateExistsFn.mockResolvedValue(true);
    const result = await submitLiveCandidate(liveInput(), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('duplicate');
      expect(result.duplicate?.candidateId).toBe(`${SMOKE_PACKAGE.package_uid}@${VERSION}`);
      expect(result.duplicate?.path).toContain('/candidates/');
    }
    expect(submitCandidateFn).not.toHaveBeenCalled();
  });

  it('coalesces double clicks into a single write', async () => {
    let release: () => void = () => undefined;
    submitCandidateFn.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              transactionHash: TX_HASH,
              candidateId: `${SMOKE_PACKAGE.package_uid}@${VERSION}`,
              record: {
                candidate_id: `${SMOKE_PACKAGE.package_uid}@${VERSION}`,
                package_uid: SMOKE_PACKAGE.package_uid,
                version: VERSION,
                candidate_commit_sha: SHA,
                evidence_uri: URI,
                evidence_hash: HASH,
                submitter: SENDER,
                status: 'PENDING',
                decision_code: 0,
                decision_summary: '',
                evaluation_attempts: 0,
                finding_codes_json: '',
                decision_hash: '',
              },
              consensusStatus: 'FINALIZED',
            });
        }),
    );
    const first = submitLiveCandidate(liveInput(), deps);
    const second = submitLiveCandidate(liveInput(), deps);
    await vi.waitFor(() => {
      expect(submitCandidateFn).toHaveBeenCalled();
    });
    release();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(submitCandidateFn).toHaveBeenCalledTimes(1);
  });

  it('status retry polls the frozen snapshot hash only', async () => {
    const snapshot = createPendingCandidateSnapshot({
      transactionHash: TX_HASH,
      senderAddress: SENDER,
      packageUid: SMOKE_PACKAGE.package_uid,
      version: VERSION,
      candidateCommitSha: SHA,
      evidenceUri: URI,
      evidenceHash: HASH,
    });
    const waitForExistingCandidateFn = vi.fn(async () => ({
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_RETURN',
      consensus_data: { leader_receipt: [{ result: snapshot.expectedCandidateId, execution_result: 'FINISHED_WITH_RETURN' }] },
    }));
    getCandidateFn.mockResolvedValue({
      candidate_id: snapshot.expectedCandidateId,
      package_uid: snapshot.packageUid,
      version: snapshot.version,
      candidate_commit_sha: snapshot.candidateCommitSha,
      evidence_uri: snapshot.evidenceUri,
      evidence_hash: snapshot.evidenceHash,
      submitter: SENDER,
      status: 'PENDING',
      decision_code: 0,
      decision_summary: '',
      evaluation_attempts: 0,
      finding_codes_json: '',
      decision_hash: '',
    });
    candidateExistsFn.mockResolvedValue(true);
    const result = await checkCandidateStatus(
      { snapshot, publisherAddress: SENDER, configResult: liveConfig },
      { waitForExistingCandidateFn, getCandidateFn, candidateExistsFn },
    );
    expect(waitForExistingCandidateFn).toHaveBeenCalledWith(TX_HASH, expect.anything());
    expect(result.ok).toBe(true);
    expect(submitCandidateFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a handcrafted stale successful preflight with zero estimation and zero writes', async () => {
    const stale = {
      ...preflight,
      inputs: { ...preflight.inputs, evidenceUri: `${URI}?stale=1` },
    };
    const result = await submitLiveCandidate(liveInput({ evidencePreflight: stale }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('validation_error');
      expect(result.message).toMatch(/inputs changed/i);
    }
    expect(getPackageFn).not.toHaveBeenCalled();
    expect(candidateExistsFn).not.toHaveBeenCalled();
    expect(submitCandidateFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('detects URI-only mismatch even when hashes and document bytes would match', async () => {
    const otherUri = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA}/other/evidence.json`;
    const result = await submitLiveCandidate(
      liveInput({
        evidenceUri: otherUri,
        evidencePreflight: {
          ...preflight,
          inputs: { ...preflight.inputs, evidenceUri: URI },
        },
      }),
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('validation_error');
    }
    expect(submitCandidateFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
  });

  it('detects hash, package UID, version, baseline SHA, and candidate SHA mismatches', async () => {
    const cases: Array<{ preflight: EvidencePreflightSuccess; override?: Partial<LiveCandidateSubmitInput> }> = [
      { preflight: { ...preflight, inputs: { ...preflight.inputs, normalizedEvidenceHash: 'cc'.repeat(32) }, computedSha256: 'cc'.repeat(32), expectedSha256: 'cc'.repeat(32) } },
      { preflight: { ...preflight, inputs: { ...preflight.inputs, packageUid: `${SMOKE_PACKAGE.package_uid}-x` }, document: { ...preflight.document, packageUid: `${SMOKE_PACKAGE.package_uid}-x` } } },
      { preflight: { ...preflight, inputs: { ...preflight.inputs, version: '9.9.9' }, document: { ...preflight.document, version: '9.9.9' } } },
      { preflight: { ...preflight, inputs: { ...preflight.inputs, baselineCommitSha: 'c'.repeat(40) }, document: { ...preflight.document, baselineCommitSha: 'c'.repeat(40) } } },
      { preflight: { ...preflight, inputs: { ...preflight.inputs, candidateCommitSha: 'd'.repeat(40) } } },
    ];
    for (const testCase of cases) {
      resetActiveCandidateSubmissionForTests();
      submitCandidateFn.mockClear();
      createWriteClientFn.mockClear();
      const result = await submitLiveCandidate(liveInput({ evidencePreflight: testCase.preflight, ...testCase.override }), deps);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.phase).toBe('validation_error');
      }
      expect(submitCandidateFn).not.toHaveBeenCalled();
      expect(createWriteClientFn).not.toHaveBeenCalled();
    }
  });

  it('accepts an exact matching fingerprint', async () => {
    submitCandidateFn.mockResolvedValue({
      transactionHash: TX_HASH,
      candidateId: `${SMOKE_PACKAGE.package_uid}@${VERSION}`,
      record: {
        candidate_id: `${SMOKE_PACKAGE.package_uid}@${VERSION}`,
        package_uid: SMOKE_PACKAGE.package_uid,
        version: VERSION,
        candidate_commit_sha: SHA,
        evidence_uri: URI,
        evidence_hash: HASH,
        submitter: SENDER,
        status: 'PENDING',
        decision_code: 0,
        decision_summary: '',
        evaluation_attempts: 0,
        finding_codes_json: '',
        decision_hash: '',
      },
      consensusStatus: 'FINALIZED',
    });
    const result = await submitLiveCandidate(liveInput(), deps);
    expect(result.ok).toBe(true);
    expect(submitCandidateFn).toHaveBeenCalledTimes(1);
  });
});
