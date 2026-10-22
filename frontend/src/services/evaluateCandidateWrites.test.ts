import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from 'genlayer-js';
import type { MessageFeeAllocationInput, TransactionFeeEstimate } from 'genlayer-js/types';
import { parseUpdateSealConfig } from '../lib/updateSealConfig';
import { VALID_LIVE_ENV } from '../test/updateSealFixtures';
import type { EvaluationConfirmation } from '../types/updateSeal';
import type { GenLayerWriteClient } from '../lib/genlayerClient';
import { CONTRACT_METHODS } from './updateSealContract';
import { estimateEvaluateCandidateFees, evaluateCandidate } from './updateSealWrites';
import { computeDecisionHash } from '../lib/decisionHash';

const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
const TX = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' as const;
const liveConfig = parseUpdateSealConfig(VALID_LIVE_ENV);
const demoConfig = parseUpdateSealConfig({ ...VALID_LIVE_ENV, VITE_UPDATESEAL_DATA_MODE: 'demo' });
const CANDIDATE_ID = '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-pending';

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
  { messageType: MessageType.External, recipient: '0x0000000000000000000000000000000000000001' },
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

const confirmation: EvaluationConfirmation = {
  candidateId: CANDIDATE_ID,
  packageUid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal',
  version: '0.1.0-pending',
  candidateCommitSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  evidenceUri: 'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/e.json',
  evidenceHash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  submitter: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  originalStatus: 'PENDING',
  originalEvaluationAttempts: 0,
  callerAddress: SENDER,
  chainId: 61997,
  contractAddress: liveConfig.contractAddress,
  estimate: {
    senderAddress: SENDER,
    chainId: 61997,
    contractAddress: liveConfig.contractAddress,
    method: 'evaluate_candidate',
    candidateId: CANDIDATE_ID,
    feeValue: 123_000_000_000_000_000n,
    feeLabel: '0.123 GEN',
    distribution: feeDistribution,
    messageAllocations,
  },
};

describe('evaluateCandidate writes', () => {
  const writeContract = vi.fn();
  const waitForTransactionReceipt = vi.fn();
  const estimateTransactionFeesForWrite = vi.fn();
  const client = { writeContract, waitForTransactionReceipt, estimateTransactionFeesForWrite } as unknown as GenLayerWriteClient;
  const getCandidateFn = vi.fn();
  const getPackageFn = vi.fn();

  beforeEach(() => {
    writeContract.mockReset();
    waitForTransactionReceipt.mockReset();
    estimateTransactionFeesForWrite.mockReset().mockResolvedValue(validEstimate());
    getCandidateFn.mockReset();
    getPackageFn.mockReset();
  });

  it('estimates using exact sender, candidate, and evaluate_candidate', async () => {
    const result = await estimateEvaluateCandidateFees(
      { candidateId: CANDIDATE_ID, senderAddress: SENDER },
      { client, config: liveConfig },
    );
    expect(estimateTransactionFeesForWrite).toHaveBeenCalledWith({
      account: SENDER,
      address: liveConfig.contractAddress,
      functionName: CONTRACT_METHODS.evaluateCandidate,
      args: [CANDIDATE_ID],
    });
    expect(writeContract).not.toHaveBeenCalled();
    expect(result.feeValue).toBe(123_000_000_000_000_000n);
    expect(result.method).toBe('evaluate_candidate');
  });

  it('demo mode estimate throws WRITE_DISABLED with zero writes', async () => {
    await expect(
      estimateEvaluateCandidateFees({ candidateId: CANDIDATE_ID, senderAddress: SENDER }, { client, config: demoConfig }),
    ).rejects.toMatchObject({ code: 'WRITE_DISABLED' });
    expect(estimateTransactionFeesForWrite).not.toHaveBeenCalled();
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('zero fees block confirmation writes', async () => {
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate({ feeValue: 0n }));
    await expect(
      estimateEvaluateCandidateFees({ candidateId: CANDIDATE_ID, senderAddress: SENDER }, { client, config: liveConfig }),
    ).rejects.toMatchObject({ code: 'FEE_ESTIMATE_INVALID' });
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('user wallet rejection is classified separately', async () => {
    writeContract.mockRejectedValue({ code: 4001, message: 'User rejected the request.' });
    await expect(evaluateCandidate({ confirmation }, { client, config: liveConfig, getCandidateFn, getPackageFn })).rejects.toMatchObject({
      code: 'USER_REJECTED',
    });
  });

  it('writes evaluate_candidate once and confirms an APPROVED read-back', async () => {
    const hash = await computeDecisionHash({
      candidate_id: CANDIDATE_ID,
      charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
      decision_code: 1,
      decision_name: 'APPROVED',
      evidence_hash: confirmation.evidenceHash,
      finding_codes: ['NO_VIOLATION'],
      summary: 'No charter violations were found',
    });
    writeContract.mockResolvedValue(TX);
    waitForTransactionReceipt.mockResolvedValue({
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_RETURN',
      hash: TX,
      consensus_data: { leader_receipt: [{ result: 'APPROVED', execution_result: 'FINISHED_WITH_RETURN' }] },
    });
    getCandidateFn.mockResolvedValue({
      candidate_id: CANDIDATE_ID,
      package_uid: confirmation.packageUid,
      version: confirmation.version,
      candidate_commit_sha: confirmation.candidateCommitSha,
      evidence_uri: confirmation.evidenceUri,
      evidence_hash: confirmation.evidenceHash,
      submitter: confirmation.submitter,
      status: 'APPROVED',
      decision_code: 1,
      decision_summary: 'No charter violations were found',
      evaluation_attempts: 1,
      finding_codes_json: '["NO_VIOLATION"]',
      decision_hash: hash,
    });
    getPackageFn.mockResolvedValue({
      package_uid: confirmation.packageUid,
      package_slug: 'updateseal',
      publisher: confirmation.submitter,
      repository_url: 'https://github.com/edwarderlick/UpdateSeal',
      baseline_commit_sha: 'b5d498fa08949e1e0f5113fb2f9d154368dfa97c',
      charter_json: '{}',
      charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
      sequence: 1,
    });
    const result = await evaluateCandidate({ confirmation }, { client, config: liveConfig, getCandidateFn, getPackageFn });
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract.mock.calls[0][0].functionName).toBe('evaluate_candidate');
    expect(result.status).toBe('APPROVED');
  });
});
