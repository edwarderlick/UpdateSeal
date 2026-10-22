import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseUpdateSealConfig } from '../lib/updateSealConfig';
import type { GenLayerWriteClient } from '../lib/genlayerClient';
import type { OnChainCandidateRecord, SubmitCandidateParams } from '../types/updateSeal';
import { VALID_LIVE_ENV } from '../test/updateSealFixtures';
import { MessageType } from 'genlayer-js';
import type { MessageFeeAllocationInput, TransactionFeeEstimate } from 'genlayer-js/types';
import { CONTRACT_METHODS } from './updateSealContract';
import { submitCandidate } from './updateSealWrites';
import { createPendingCandidateSnapshot } from '../lib/candidateReceipt';

const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
const TX_HASH = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' as const;
const liveConfig = parseUpdateSealConfig(VALID_LIVE_ENV);
const demoConfig = parseUpdateSealConfig({ ...VALID_LIVE_ENV, VITE_UPDATESEAL_DATA_MODE: 'demo' });

const params: SubmitCandidateParams = {
  packageUid: `${SENDER}/updateseal-smoke`,
  version: '1.0.1',
  candidateCommitSha: 'ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123',
  evidenceUri: 'https://raw.githubusercontent.com/edwarderlick/Provider-Court/ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123/e.json',
  evidenceHash: 'EE'.repeat(32),
  senderAddress: SENDER,
  expectedCandidateId: `${SENDER}/updateseal-smoke@1.0.1`,
};

function matchingRecord(overrides: Partial<OnChainCandidateRecord> = {}): OnChainCandidateRecord {
  return {
    candidate_id: params.expectedCandidateId,
    package_uid: params.packageUid,
    version: params.version,
    candidate_commit_sha: params.candidateCommitSha,
    evidence_uri: params.evidenceUri,
    evidence_hash: params.evidenceHash.toLowerCase(),
    submitter: SENDER,
    status: 'PENDING',
    decision_code: 0,
    decision_summary: '',
    evaluation_attempts: 0,
    finding_codes_json: '',
    decision_hash: '',
    ...overrides,
  };
}

const feeDistribution = {
  leaderTimeunitsAllocation: 1n,
  validatorTimeunitsAllocation: 2n,
  appealRounds: 1n,
  executionBudgetPerRound: 10n,
  executionConsumed: 0n,
  totalMessageFees: 3n,
  rotations: [1n],
  maxPriceGenPerTimeUnit: 4n,
  storageFeeMaxGasPrice: 5n,
  receiptFeeMaxGasPrice: 6n,
};

const messageAllocations: MessageFeeAllocationInput[] = [
  {
    messageType: MessageType.External,
    recipient: '0x0000000000000000000000000000000000000001',
  },
];

function validEstimate(overrides: Partial<TransactionFeeEstimate> = {}): TransactionFeeEstimate {
  return {
    distribution: feeDistribution,
    messageAllocations,
    feeValue: 123_000_000_000_000_000n,
    policy: {
      enabled: true,
      genPerTimeUnit: 1n,
      storageUnitPrice: 1n,
      receiptGasPrice: 1n,
      executionBudgetFloor: 1n,
    },
    ...overrides,
  };
}

function makeReceipt(overrides: Record<string, unknown> = {}) {
  return {
    statusName: 'FINALIZED',
    txExecutionResultName: 'FINISHED_WITH_RETURN',
    hash: TX_HASH,
    consensus_data: {
      leader_receipt: [
        {
          result: params.expectedCandidateId,
          execution_result: 'FINISHED_WITH_RETURN',
        },
      ],
    },
    ...overrides,
  };
}

describe('submitCandidate writes', () => {
  const writeContract = vi.fn();
  const waitForTransactionReceipt = vi.fn();
  const estimateTransactionFeesForWrite = vi.fn();
  const client = { writeContract, waitForTransactionReceipt, estimateTransactionFeesForWrite } as unknown as GenLayerWriteClient;
  const candidateExistsFn = vi.fn();
  const getCandidateFn = vi.fn();
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    writeContract.mockReset();
    waitForTransactionReceipt.mockReset();
    estimateTransactionFeesForWrite.mockReset();
    candidateExistsFn.mockReset();
    getCandidateFn.mockReset();
    fetchSpy.mockClear();
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate());
  });

  it('estimates fees then writes submit_candidate in exact argument order', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    candidateExistsFn.mockResolvedValue(true);
    getCandidateFn.mockResolvedValue(matchingRecord());

    const result = await submitCandidate(params, {
      client,
      candidateExistsFn,
      getCandidateFn,
      config: liveConfig,
    });

    const writeArgs = [
      params.packageUid,
      params.version,
      params.candidateCommitSha,
      params.evidenceUri,
      params.evidenceHash.toLowerCase(),
    ];
    expect(estimateTransactionFeesForWrite).toHaveBeenCalledTimes(1);
    expect(estimateTransactionFeesForWrite).toHaveBeenCalledWith({
      account: SENDER,
      address: '0x6A882db328782051dFf05C40F4C34b3F223cd80A',
      functionName: 'submit_candidate',
      args: writeArgs,
    });
    expect(writeContract).toHaveBeenCalledWith({
      account: SENDER,
      address: '0x6A882db328782051dFf05C40F4C34b3F223cd80A',
      functionName: 'submit_candidate',
      args: writeArgs,
      fees: {
        distribution: feeDistribution,
        messageAllocations,
        feeValue: 123_000_000_000_000_000n,
      },
    });
    expect(writeContract.mock.invocationCallOrder[0]).toBeGreaterThan(estimateTransactionFeesForWrite.mock.invocationCallOrder[0]);
    expect(writeContract.mock.calls[0][0].functionName).not.toBe('evaluate_candidate');
    expect(result.record.status).toBe('PENDING');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never calls evaluate_candidate and CONTRACT_METHODS has no evaluate method', () => {
    expect(CONTRACT_METHODS.submitCandidate).toBe('submit_candidate');
    expect('evaluateCandidate' in CONTRACT_METHODS).toBe(false);
    expect(Object.values(CONTRACT_METHODS)).not.toContain('evaluate_candidate');
  });

  it('rejects zero fees with zero writes', async () => {
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate({ feeValue: 0n }));
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'FEE_ESTIMATE_INVALID',
    });
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('maps fee estimation failure to FEE_ESTIMATION_FAILED', async () => {
    estimateTransactionFeesForWrite.mockRejectedValue(new Error('sim_estimateTransactionFees unavailable'));
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'FEE_ESTIMATION_FAILED',
    });
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('maps wallet rejection before a hash exists', async () => {
    const err = Object.assign(new Error('User rejected the request.'), { code: 4001 });
    writeContract.mockRejectedValue(err);
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'WALLET_REJECTED',
      transactionHash: null,
    });
  });

  it('maps receipt rejection', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue({
      statusName: 'CANCELED',
      txExecutionResultName: 'FINISHED_WITH_ERROR',
      hash: TX_HASH,
    });
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'CONTRACT_REJECTED',
      transactionHash: TX_HASH,
    });
  });

  it('maps timeout to STATUS_UNKNOWN and preserves the hash', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockRejectedValue(new Error('timed out waiting for transaction receipt'));
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
  });

  it('treats read-back mismatch as status unknown, never success', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    candidateExistsFn.mockResolvedValue(true);
    getCandidateFn.mockResolvedValue(matchingRecord({ status: 'APPROVED', decision_code: 1 }));
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
  });

  it('succeeds only after PENDING read-back', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    candidateExistsFn.mockResolvedValue(true);
    getCandidateFn.mockResolvedValue(matchingRecord());
    const result = await submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig });
    expect(result.candidateId).toBe(params.expectedCandidateId);
    expect(result.record.evaluation_attempts).toBe(0);
  });

  it('disables writes outside live mode', async () => {
    await expect(submitCandidate(params, { client, config: demoConfig })).rejects.toMatchObject({
      code: 'WRITE_DISABLED',
    });
    expect(estimateTransactionFeesForWrite).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('uses the frozen snapshot identity, not later form values', () => {
    const snap = createPendingCandidateSnapshot({
      transactionHash: TX_HASH,
      senderAddress: SENDER,
      packageUid: params.packageUid,
      version: params.version,
      candidateCommitSha: params.candidateCommitSha,
      evidenceUri: params.evidenceUri,
      evidenceHash: params.evidenceHash,
      expectedCandidateId: params.expectedCandidateId,
    });
    expect(snap.version).toBe('1.0.1');
    expect(snap.transactionHash).toBe(TX_HASH);
  });

  it('succeeds when the decoded returned candidate ID matches', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    candidateExistsFn.mockResolvedValue(true);
    getCandidateFn.mockResolvedValue(matchingRecord());
    const result = await submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig });
    expect(result.candidateId).toBe(params.expectedCandidateId);
  });

  it('treats a different returned candidate ID as status_unknown and preserves the hash', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(
      makeReceipt({
        consensus_data: {
          leader_receipt: [{ result: `${params.packageUid}@9.9.9`, execution_result: 'FINISHED_WITH_RETURN' }],
        },
      }),
    );
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
    expect(candidateExistsFn).not.toHaveBeenCalled();
    expect(getCandidateFn).not.toHaveBeenCalled();
  });

  it('allows a missing returned ID only after a successful receipt and exact read-back', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(
      makeReceipt({
        consensus_data: { leader_receipt: [{ execution_result: 'FINISHED_WITH_RETURN' }] },
      }),
    );
    candidateExistsFn.mockResolvedValue(true);
    getCandidateFn.mockResolvedValue(matchingRecord());
    const result = await submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig });
    expect(result.candidateId).toBe(params.expectedCandidateId);
  });

  it('treats a missing returned ID plus missing candidate as status_unknown', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(
      makeReceipt({
        consensus_data: { leader_receipt: [{ execution_result: 'FINISHED_WITH_RETURN' }] },
      }),
    );
    candidateExistsFn.mockResolvedValue(false);
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
    expect(getCandidateFn).not.toHaveBeenCalled();
  });

  it('treats a missing returned ID plus mismatching read-back as status_unknown', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(
      makeReceipt({
        consensus_data: { leader_receipt: [{ execution_result: 'FINISHED_WITH_RETURN' }] },
      }),
    );
    candidateExistsFn.mockResolvedValue(true);
    getCandidateFn.mockResolvedValue(matchingRecord({ version: '9.9.9' }));
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
  });

  it('never reaches candidate read-back for a rejected receipt', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue({
      statusName: 'CANCELED',
      txExecutionResultName: 'FINISHED_WITH_ERROR',
      hash: TX_HASH,
    });
    await expect(submitCandidate(params, { client, getCandidateFn, candidateExistsFn, config: liveConfig })).rejects.toMatchObject({
      code: 'CONTRACT_REJECTED',
      transactionHash: TX_HASH,
    });
    expect(candidateExistsFn).not.toHaveBeenCalled();
    expect(getCandidateFn).not.toHaveBeenCalled();
  });
});
