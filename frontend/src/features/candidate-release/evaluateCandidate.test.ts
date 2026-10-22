import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseUpdateSealConfig } from '../../lib/updateSealConfig';
import { VALID_LIVE_ENV } from '../../test/updateSealFixtures';
import { UpdateSealError } from '../../lib/updateSealErrors';
import type { EvaluationConfirmation, OnChainCandidateRecord, OnChainPackageRecord } from '../../types/updateSeal';
import { createPendingEvaluationSnapshot } from '../../lib/evaluationReceipt';
import { computeDecisionHash } from '../../lib/decisionHash';
import {
  assertEvaluateEligibility,
  checkEvaluationStatus,
  confirmationFromRecord,
  confirmationIsStale,
  estimateLiveEvaluation,
  resetActiveEvaluationForTests,
  submitLiveEvaluation,
  type LiveEvaluateInput,
} from './evaluateCandidate';

const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
const TX = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as const;
const liveConfig = parseUpdateSealConfig(VALID_LIVE_ENV);
const demoConfig = parseUpdateSealConfig({ ...VALID_LIVE_ENV, VITE_UPDATESEAL_DATA_MODE: 'demo' });
const invalidConfig = { ok: false as const, error: new UpdateSealError('CONFIG_INVALID', 'bad config') };

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

const PENDING: OnChainCandidateRecord = {
  candidate_id: `${PACKAGE.package_uid}@0.1.0-pending`,
  package_uid: PACKAGE.package_uid,
  version: '0.1.0-pending',
  candidate_commit_sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  evidence_uri: 'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/e.json',
  evidence_hash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  submitter: PACKAGE.publisher,
  status: 'PENDING',
  decision_code: 0,
  decision_summary: '',
  evaluation_attempts: 0,
  finding_codes_json: '',
  decision_hash: '',
};

const estimate = {
  senderAddress: SENDER,
  chainId: 61997,
  contractAddress: liveConfig.contractAddress,
  method: 'evaluate_candidate' as const,
  candidateId: PENDING.candidate_id,
  feeValue: 123_000_000_000_000_000n,
  feeLabel: '0.123 GEN',
  distribution: { leaderTimeunitsAllocation: 1n },
  messageAllocations: [],
};

function confirmation(overrides: Partial<EvaluationConfirmation> = {}): EvaluationConfirmation {
  return {
    ...confirmationFromRecord({
      record: PENDING,
      sender: SENDER,
      chainId: 61997,
      contractAddress: liveConfig.contractAddress,
      estimate,
    }),
    ...overrides,
  };
}

function liveInput(overrides: Partial<LiveEvaluateInput> = {}): LiveEvaluateInput {
  return {
    candidateId: PENDING.candidate_id,
    connectedAddress: SENDER,
    isConnected: true,
    chainId: 61997,
    provider: { request: vi.fn() },
    unresolvedSnapshot: null,
    configResult: { ok: true, config: liveConfig },
    ...overrides,
  };
}

describe('evaluateCandidate orchestration', () => {
  const getCandidateFn = vi.fn();
  const getPackageFn = vi.fn();
  const candidateExistsFn = vi.fn();
  const estimateFn = vi.fn();
  const evaluateFn = vi.fn();
  const createWriteClientFn = vi.fn();
  const waitForExistingFn = vi.fn();
  const writeContract = vi.fn();
  const estimateTransactionFeesForWrite = vi.fn();
  const waitForTransactionReceipt = vi.fn();
  const saveSnapshotFn = vi.fn();
  const loadSnapshotFn = vi.fn();
  const clearSnapshotFn = vi.fn();

  const deps = {
    getCandidateFn,
    getPackageFn,
    candidateExistsFn,
    estimateFn,
    evaluateFn,
    createWriteClientFn,
    waitForExistingFn,
    saveSnapshotFn,
    loadSnapshotFn,
    clearSnapshotFn,
    getReadClientFn: () => ({ waitForTransactionReceipt }),
  };

  beforeEach(() => {
    resetActiveEvaluationForTests();
    getCandidateFn.mockReset().mockResolvedValue(PENDING);
    getPackageFn.mockReset().mockResolvedValue(PACKAGE);
    candidateExistsFn.mockReset().mockResolvedValue(true);
    estimateFn.mockReset().mockResolvedValue(estimate);
    evaluateFn.mockReset();
    createWriteClientFn.mockReset().mockReturnValue({
      estimateTransactionFeesForWrite,
      writeContract,
      waitForTransactionReceipt,
    });
    waitForExistingFn.mockReset();
    writeContract.mockReset();
    estimateTransactionFeesForWrite.mockReset();
    waitForTransactionReceipt.mockReset();
    saveSnapshotFn.mockReset();
    loadSnapshotFn.mockReset().mockReturnValue(null);
    clearSnapshotFn.mockReset();
  });

  it('demo mode makes zero writes', async () => {
    const result = await estimateLiveEvaluation(liveInput({ configResult: { ok: true, config: demoConfig } }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('write_disabled');
    }
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('invalid configuration makes zero writes', async () => {
    const result = await estimateLiveEvaluation(liveInput({ configResult: invalidConfig }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('config_invalid');
    }
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('disconnected wallet makes zero writes', async () => {
    const result = await estimateLiveEvaluation(liveInput({ isConnected: false, connectedAddress: null }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('wallet_disconnected');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('wrong network makes zero writes', async () => {
    const result = await estimateLiveEvaluation(liveInput({ chainId: 1 }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('wrong_network');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('invalid candidate ID makes zero writes', async () => {
    const result = await estimateLiveEvaluation(liveInput({ candidateId: 'not-an-id' }), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('invalid_candidate_id');
    }
    expect(candidateExistsFn).not.toHaveBeenCalled();
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('missing candidate makes zero writes', async () => {
    candidateExistsFn.mockResolvedValue(false);
    const result = await estimateLiveEvaluation(liveInput(), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('candidate_not_found');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it.each(['APPROVED', 'REVIEW_REQUIRED', 'VIOLATION', 'EVIDENCE_UNAVAILABLE'] as const)(
    '%s candidate makes zero writes',
    async (status) => {
      getCandidateFn.mockResolvedValue({ ...PENDING, status });
      const result = await estimateLiveEvaluation(liveInput(), deps);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.phase).toBe('candidate_not_pending');
      }
      expect(evaluateFn).not.toHaveBeenCalled();
      expect(createWriteClientFn).not.toHaveBeenCalled();
    },
  );

  it('only PENDING enables evaluation estimate', async () => {
    const result = await estimateLiveEvaluation(liveInput(), deps);
    expect(result).toMatchObject({ ok: true, phase: 'ready' });
    expect(estimateFn).toHaveBeenCalledWith(
      { candidateId: PENDING.candidate_id, senderAddress: SENDER },
      expect.objectContaining({
        client: expect.anything(),
        config: liveConfig,
      }),
    );
    expect(evaluateFn).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('zero/malformed estimate is returned as fee failure without write', async () => {
    estimateFn.mockRejectedValue(new UpdateSealError('FEE_ESTIMATE_INVALID', 'Fee estimation failed'));
    const result = await estimateLiveEvaluation(liveInput(), deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('fee_estimate_invalid');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('wallet, chain, and candidate changes invalidate confirmation', () => {
    const ready = confirmation();
    expect(
      confirmationIsStale(ready, {
        record: PENDING,
        sender: '0x1111111111111111111111111111111111111111',
        chainId: 61997,
        contractAddress: liveConfig.contractAddress,
      }),
    ).toMatch(/wallet/i);
    expect(
      confirmationIsStale(ready, {
        record: PENDING,
        sender: SENDER,
        chainId: 1,
        contractAddress: liveConfig.contractAddress,
      }),
    ).toMatch(/chain/i);
    expect(
      confirmationIsStale(ready, {
        record: { ...PENDING, candidate_id: `${PACKAGE.package_uid}@9.9.9` },
        sender: SENDER,
        chainId: 61997,
        contractAddress: liveConfig.contractAddress,
      }),
    ).toMatch(/Candidate ID/i);
  });

  it('explicit confirmation submits exactly once', async () => {
    let finish: (value: unknown) => void = () => undefined;
    evaluateFn.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const input = { ...liveInput(), confirmation: confirmation() };
    const first = submitLiveEvaluation(input, deps);
    const second = submitLiveEvaluation(input, deps);
    await vi.waitFor(() => {
      expect(evaluateFn).toHaveBeenCalledTimes(1);
    });
    finish({
      transactionHash: TX,
      candidateId: PENDING.candidate_id,
      record: PENDING,
      packageRecord: PACKAGE,
      consensusStatus: 'FINALIZED',
      status: 'APPROVED',
    });
    const [a, b] = await Promise.all([first, second]);
    expect(evaluateFn).toHaveBeenCalledTimes(1);
    expect(a.ok || b.ok).toBe(true);
  });

  it('status change before write performs zero writes', async () => {
    getCandidateFn.mockResolvedValue({ ...PENDING, status: 'APPROVED' });
    const result = await submitLiveEvaluation({ ...liveInput(), confirmation: confirmation() }, deps);
    expect(result.ok).toBe(false);
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('attempts change before write performs zero writes', async () => {
    getCandidateFn.mockResolvedValue({ ...PENDING, evaluation_attempts: 1 });
    const result = await submitLiveEvaluation({ ...liveInput(), confirmation: confirmation() }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('stale_confirmation');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('immutable field change before write performs zero writes', async () => {
    getCandidateFn.mockResolvedValue({ ...PENDING, evidence_hash: 'aa'.repeat(32) });
    const result = await submitLiveEvaluation({ ...liveInput(), confirmation: confirmation() }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('stale_confirmation');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('sender/chain change before write performs zero writes', async () => {
    const result = await submitLiveEvaluation(
      { ...liveInput({ connectedAddress: '0x1111111111111111111111111111111111111111' }), confirmation: confirmation() },
      deps,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.phase).toBe('stale_confirmation');
    }
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('unresolved snapshot blocks a new write', async () => {
    const snapshot = createPendingEvaluationSnapshot({
      transactionHash: TX,
      candidateId: PENDING.candidate_id,
      packageUid: PENDING.package_uid,
      version: PENDING.version,
      candidateCommitSha: PENDING.candidate_commit_sha,
      evidenceUri: PENDING.evidence_uri,
      evidenceHash: PENDING.evidence_hash,
      originalEvaluationAttempts: 0,
      callerAddress: SENDER,
      chainId: 61997,
      contractAddress: liveConfig.contractAddress,
      feeEstimateWei: 1n,
      submitter: PENDING.submitter,
    });
    loadSnapshotFn.mockReturnValue(snapshot);
    await expect(assertEvaluateEligibility(liveInput(), deps)).rejects.toMatchObject({ code: 'EVALUATION_ALREADY_PENDING' });
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('Check Existing Transaction performs zero writes, no write client, and no fee estimate', async () => {
    const snapshot = createPendingEvaluationSnapshot({
      transactionHash: TX,
      candidateId: PENDING.candidate_id,
      packageUid: PENDING.package_uid,
      version: PENDING.version,
      candidateCommitSha: PENDING.candidate_commit_sha,
      evidenceUri: PENDING.evidence_uri,
      evidenceHash: PENDING.evidence_hash,
      originalEvaluationAttempts: 0,
      callerAddress: SENDER,
      chainId: 61997,
      contractAddress: liveConfig.contractAddress,
      feeEstimateWei: 1n,
      submitter: PENDING.submitter,
    });
    waitForExistingFn.mockResolvedValue({
      statusName: 'PENDING',
      txExecutionResultName: 'NOT_VOTED',
      hash: TX,
    });
    await checkEvaluationStatus({ snapshot, configResult: { ok: true, config: liveConfig } }, deps);
    await checkEvaluationStatus({ snapshot, configResult: { ok: true, config: liveConfig } }, deps);
    expect(evaluateFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(estimateFn).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
    expect(waitForExistingFn).toHaveBeenCalledTimes(2);
  });

  it('successful receipt plus valid read-back clears pending state', async () => {
    const hash = await computeDecisionHash({
      candidate_id: PENDING.candidate_id,
      charter_hash: PACKAGE.charter_hash,
      decision_code: 1,
      decision_name: 'APPROVED',
      evidence_hash: PENDING.evidence_hash,
      finding_codes: ['NO_VIOLATION'],
      summary: 'No charter violations were found',
    });
    const approved = {
      ...PENDING,
      status: 'APPROVED',
      decision_code: 1,
      decision_summary: 'No charter violations were found',
      evaluation_attempts: 1,
      finding_codes_json: '["NO_VIOLATION"]',
      decision_hash: hash,
    };
    evaluateFn.mockImplementation(async (_params, writeDeps: { onProgress?: (event: { snapshot?: unknown }) => void }) => {
      const snapshot = createPendingEvaluationSnapshot({
        transactionHash: TX,
        candidateId: PENDING.candidate_id,
        packageUid: PENDING.package_uid,
        version: PENDING.version,
        candidateCommitSha: PENDING.candidate_commit_sha,
        evidenceUri: PENDING.evidence_uri,
        evidenceHash: PENDING.evidence_hash,
        originalEvaluationAttempts: 0,
        callerAddress: SENDER,
        chainId: 61997,
        contractAddress: liveConfig.contractAddress,
        feeEstimateWei: estimate.feeValue,
        submitter: PENDING.submitter,
      });
      writeDeps.onProgress?.({ snapshot });
      return {
        transactionHash: TX,
        candidateId: PENDING.candidate_id,
        record: approved,
        packageRecord: PACKAGE,
        consensusStatus: 'FINALIZED',
        status: 'APPROVED',
      };
    });
    const result = await submitLiveEvaluation({ ...liveInput(), confirmation: confirmation() }, deps);
    expect(result.ok).toBe(true);
    expect(clearSnapshotFn).toHaveBeenCalled();
    expect(evaluateFn).toHaveBeenCalledTimes(1);
  });
});
