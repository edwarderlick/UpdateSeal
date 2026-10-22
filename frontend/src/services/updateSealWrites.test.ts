import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseUpdateSealConfig } from '../lib/updateSealConfig';
import { UpdateSealError } from '../lib/updateSealErrors';
import type { GenLayerWriteClient } from '../lib/genlayerClient';
import type { OnChainPackageRecord, RegisterPackageParams } from '../types/updateSeal';
import { VALID_LIVE_ENV } from '../test/updateSealFixtures';

vi.mock('../lib/genlayerClient', () => ({
  getReadOnlyGenLayerClient: vi.fn(),
  createWriteGenLayerClient: vi.fn(),
}));

import { extractReturnedPackageUid, normalizeTransactionHash, registerPackage } from './updateSealWrites';
import { MessageType } from 'genlayer-js';
import type { MessageFeeAllocationInput, TransactionFeeEstimate } from 'genlayer-js/types';

const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
const liveConfig = parseUpdateSealConfig(VALID_LIVE_ENV);
const demoConfig = parseUpdateSealConfig({ ...VALID_LIVE_ENV, VITE_UPDATESEAL_DATA_MODE: 'demo' });
const invalidConfigResult = {
  ok: false as const,
  error: new UpdateSealError('CONFIG_INVALID', 'VITE_UPDATESEAL_DATA_MODE must be exactly "live" or "demo".'),
};

const params: RegisterPackageParams = {
  packageSlug: 'sentinel-code-auditor',
  repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
  baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
  charterJson: '{"schema_version":1}',
  senderAddress: SENDER,
};

function matchingRecord(overrides: Partial<OnChainPackageRecord> = {}): OnChainPackageRecord {
  return {
    package_uid: `${SENDER}/sentinel-code-auditor`,
    package_slug: 'sentinel-code-auditor',
    publisher: SENDER,
    repository_url: params.repositoryUrl,
    baseline_commit_sha: params.baselineCommitSha,
    charter_json: params.charterJson,
    charter_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    sequence: 0,
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
          result: `${SENDER}/sentinel-code-auditor`,
          execution_result: 'FINISHED_WITH_RETURN',
        },
      ],
    },
    ...overrides,
  };
}

describe('updateSealWrites', () => {
  const writeContract = vi.fn();
  const waitForTransactionReceipt = vi.fn();
  const estimateTransactionFeesForWrite = vi.fn();
  const client = { writeContract, waitForTransactionReceipt, estimateTransactionFeesForWrite } as unknown as GenLayerWriteClient;
  const packageExistsFn = vi.fn();
  const getPackageFn = vi.fn();
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    writeContract.mockReset();
    waitForTransactionReceipt.mockReset();
    estimateTransactionFeesForWrite.mockReset();
    packageExistsFn.mockReset();
    getPackageFn.mockReset();
    fetchSpy.mockClear();
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate());
  });

  it('normalizes a transaction hash from writeContract', () => {
    expect(normalizeTransactionHash(TX_HASH)).toBe(TX_HASH);
    expect(normalizeTransactionHash({ hash: TX_HASH })).toBe(TX_HASH);
  });

  it('extracts package_uid from a leader receipt result', () => {
    expect(extractReturnedPackageUid(makeReceipt())).toBe(`${SENDER}/sentinel-code-auditor`);
  });

  it('treats finalized + FINISHED_WITH_RETURN as success and reads the package back', async () => {
    const progress: string[] = [];
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    getPackageFn.mockResolvedValue(matchingRecord());

    const result = await registerPackage(params, {
      client,
      packageExistsFn,
      getPackageFn,
      config: liveConfig,
      onProgress: (event) => progress.push(event.phase),
    });

    const writeArgs = [params.packageSlug, params.repositoryUrl, params.baselineCommitSha, params.charterJson];
    expect(estimateTransactionFeesForWrite).toHaveBeenCalledTimes(1);
    expect(estimateTransactionFeesForWrite).toHaveBeenCalledWith({
      account: SENDER,
      address: '0x6A882db328782051dFf05C40F4C34b3F223cd80A',
      functionName: 'register_package',
      args: writeArgs,
    });
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract).toHaveBeenCalledWith({
      account: SENDER,
      address: '0x6A882db328782051dFf05C40F4C34b3F223cd80A',
      functionName: 'register_package',
      args: writeArgs,
      fees: {
        distribution: feeDistribution,
        messageAllocations,
        feeValue: 123_000_000_000_000_000n,
      },
    });
    expect(writeContract.mock.invocationCallOrder[0]).toBeGreaterThan(estimateTransactionFeesForWrite.mock.invocationCallOrder[0]);
    expect(waitForTransactionReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ hash: TX_HASH, waitUntil: 'finalized', fullTransaction: true }),
    );
    expect(result.transactionHash).toBe(TX_HASH);
    expect(result.packageUid).toBe(`${SENDER}/sentinel-code-auditor`);
    expect(progress).toEqual(['estimating_fees', 'awaiting_wallet', 'submitted', 'waiting_consensus']);
    expect(result.consensusStatus).toBe('FINALIZED');
    expect(packageExistsFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('passes estimated distribution, messageAllocations, and feeValue unchanged into writeContract', async () => {
    const estimate = validEstimate();
    estimateTransactionFeesForWrite.mockResolvedValue(estimate);
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    getPackageFn.mockResolvedValue(matchingRecord());

    await registerPackage(params, { client, getPackageFn, config: liveConfig });

    const writeFees = writeContract.mock.calls[0][0].fees;
    expect(writeFees.distribution).toBe(estimate.distribution);
    expect(writeFees.messageAllocations).toBe(estimate.messageAllocations);
    expect(writeFees.feeValue).toBe(estimate.feeValue);
  });

  it('does not emit a transaction hash during fee estimation', async () => {
    const events: Array<{ phase: string; transactionHash?: string }> = [];
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    getPackageFn.mockResolvedValue(matchingRecord());

    await registerPackage(params, {
      client,
      getPackageFn,
      config: liveConfig,
      onProgress: (event) => events.push({ phase: event.phase, transactionHash: event.transactionHash }),
    });

    expect(events[0]).toEqual({ phase: 'estimating_fees', transactionHash: undefined });
    expect(events.find((event) => event.phase === 'awaiting_wallet')?.transactionHash).toBeUndefined();
    expect(events.find((event) => event.phase === 'submitted')?.transactionHash).toBe(TX_HASH);
  });

  it('rejects a zero feeValue and never calls writeContract', async () => {
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate({ feeValue: 0n }));
    await expect(registerPackage(params, { client, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'FEE_ESTIMATE_INVALID',
      transactionHash: null,
    });
    expect(writeContract).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it('rejects a missing distribution and never calls writeContract', async () => {
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate({ distribution: undefined as never }));
    await expect(registerPackage(params, { client, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'FEE_ESTIMATE_INVALID',
    });
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('rejects a malformed distribution and never calls writeContract', async () => {
    estimateTransactionFeesForWrite.mockResolvedValue(validEstimate({ distribution: 'not-a-distribution' as never }));
    await expect(registerPackage(params, { client, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'FEE_ESTIMATE_INVALID',
    });
    expect(writeContract).not.toHaveBeenCalled();
  });

  it('maps estimator rejection to FEE_ESTIMATION_FAILED with zero writes and no hash', async () => {
    estimateTransactionFeesForWrite.mockRejectedValue(new Error('sim_estimateTransactionFees unavailable'));
    await expect(registerPackage(params, { client, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'FEE_ESTIMATION_FAILED',
      userMessage: 'Fee estimation failed',
      transactionHash: null,
    });
    expect(writeContract).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it('does not treat a hash-only receipt as success', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue({
      statusName: 'PENDING',
      txExecutionResultName: 'NOT_VOTED',
      hash: TX_HASH,
    });
    await expect(registerPackage(params, { client, packageExistsFn, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
    expect(packageExistsFn).not.toHaveBeenCalled();
    expect(getPackageFn).not.toHaveBeenCalled();
  });

  it('maps wallet rejection before a hash exists', async () => {
    const err = Object.assign(new Error('User rejected the request.'), { code: 4001 });
    writeContract.mockRejectedValue(err);
    await expect(registerPackage(params, { client, packageExistsFn, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'WALLET_REJECTED',
      transactionHash: null,
    });
    expect(estimateTransactionFeesForWrite).toHaveBeenCalledTimes(1);
    expect(writeContract).toHaveBeenCalledTimes(1);
  });

  it('maps a finished execution error as a contract rejection even when the package already exists', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue({
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_ERROR',
      hash: TX_HASH,
      consensus_data: { leader_receipt: [{ error: "Package 'x' already registered", execution_result: 'FINISHED_WITH_ERROR' }] },
    });
    packageExistsFn.mockResolvedValue(true);
    getPackageFn.mockResolvedValue(matchingRecord());
    await expect(registerPackage(params, { client, packageExistsFn, getPackageFn, config: liveConfig })).rejects.toBeInstanceOf(UpdateSealError);
    await expect(registerPackage(params, { client, packageExistsFn, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'CONTRACT_REJECTED',
      transactionHash: TX_HASH,
    });
    expect(packageExistsFn).not.toHaveBeenCalled();
  });

  it('maps wait timeout to status unknown, not failed', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockRejectedValue(
      new Error(`Timed out waiting for transaction ${TX_HASH} to reach "finalized" (current status: 4).`),
    );
    await expect(registerPackage(params, { client, packageExistsFn, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
      userMessage: expect.stringMatching(/status is unknown/i),
    });
  });

  it('rejects mismatched read-back as status_unknown and preserves the hash', async () => {
    writeContract.mockResolvedValue(TX_HASH);
    waitForTransactionReceipt.mockResolvedValue(makeReceipt());
    getPackageFn.mockResolvedValue(matchingRecord({ publisher: '0x1111111111111111111111111111111111111111' }));
    await expect(registerPackage(params, { client, getPackageFn, config: liveConfig })).rejects.toMatchObject({
      code: 'STATUS_UNKNOWN',
      transactionHash: TX_HASH,
    });
  });

  it('demo mode calling registerPackage directly results in zero writes', async () => {
    await expect(registerPackage(params, { client, getPackageFn, config: demoConfig })).rejects.toMatchObject({
      code: 'WRITE_DISABLED',
    });
    expect(writeContract).not.toHaveBeenCalled();
    expect(estimateTransactionFeesForWrite).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('invalid configuration calling registerPackage directly results in zero writes', async () => {
    await expect(registerPackage(params, { client, getPackageFn, configResult: invalidConfigResult })).rejects.toMatchObject({
      code: 'CONFIG_INVALID',
    });
    expect(writeContract).not.toHaveBeenCalled();
    expect(estimateTransactionFeesForWrite).not.toHaveBeenCalled();
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
