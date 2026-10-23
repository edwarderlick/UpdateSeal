import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ATLAS_CHARTER, MOCK_OWNER_WALLET } from '../../mocks';
import { parseUpdateSealConfig } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import { VALID_LIVE_ENV, SMOKE_PACKAGE } from '../../test/updateSealFixtures';
import type { RegistrationFormData } from './RegistrationContext';
import { createPendingRegistrationSnapshot } from '../../lib/registrationReceipt';
import type { OnChainPackageRecord } from '../../types/updateSeal';
import {
  checkRegistrationStatus,
  resetActiveSubmissionForTests,
  submitRegistration,
  type SubmitRegistrationInput,
} from './submitRegistration';

const SENDER = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
const TX_HASH = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;

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

const form: RegistrationFormData = {
  packageId: 'sentinel-code-auditor',
  displayName: 'Sentinel Code Auditor',
  description: 'Autonomous static analysis daemon evaluating smart contracts against security invariants.',
  repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
  ownerWallet: MOCK_OWNER_WALLET,
  baselineVersion: 'v1.0.0',
  baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
  manifestPath: 'package.json',
  license: 'Apache-2.0',
  capabilityCharter: DEFAULT_ATLAS_CHARTER,
};

const provider = { request: vi.fn() };

function liveInput(overrides: Partial<SubmitRegistrationInput> = {}): SubmitRegistrationInput {
  return {
    form,
    connectedAddress: SENDER,
    isConnected: true,
    chainId: 61997,
    provider,
    configResult: liveConfig,
    ...overrides,
  };
}

describe('submitRegistration', () => {
  const getPackageUidFn = vi.fn();
  const packageExistsFn = vi.fn();
  const getPackageFn = vi.fn();
  const registerPackageFn = vi.fn();
  const createWriteClientFn = vi.fn(() => ({
    writeContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    estimateTransactionFeesForWrite: vi.fn(),
  }));
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  const deps = {
    getPackageUidFn,
    packageExistsFn,
    getPackageFn,
    registerPackageFn,
    createWriteClientFn,
  };

  beforeEach(() => {
    resetActiveSubmissionForTests();
    getPackageUidFn.mockReset();
    packageExistsFn.mockReset();
    getPackageFn.mockReset();
    registerPackageFn.mockReset();
    createWriteClientFn.mockClear();
    fetchSpy.mockClear();
    getPackageUidFn.mockResolvedValue(`${SENDER.toLowerCase()}/sentinel-code-auditor`);
    packageExistsFn.mockResolvedValue(false);
  });

  it('requires a connected wallet in live mode and sends zero writes', async () => {
    const result = await submitRegistration(liveInput({ isConnected: false, connectedAddress: null }), deps);
    expect(result).toMatchObject({ ok: false, phase: 'wallet_required' });
    expect(registerPackageFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requires chain 61997 in live mode and sends zero writes', async () => {
    const result = await submitRegistration(liveInput({ chainId: 1 }), deps);
    expect(result).toMatchObject({ ok: false, phase: 'wrong_network' });
    expect(registerPackageFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('demo mode returns demo and sends zero contract writes', async () => {
    const result = await submitRegistration(liveInput({ configResult: demoConfig }), deps);
    expect(result).toEqual({ ok: true, phase: 'demo' });
    expect(registerPackageFn).not.toHaveBeenCalled();
    expect(getPackageUidFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('invalid configuration sends zero contract writes', async () => {
    const result = await submitRegistration(liveInput({ configResult: invalidConfig }), deps);
    expect(result).toMatchObject({ ok: false, phase: 'config_invalid' });
    expect(registerPackageFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('duplicate package preflight blocks submission and links to the live page', async () => {
    packageExistsFn.mockResolvedValue(true);
    const result = await submitRegistration(liveInput(), deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.phase).toBe('duplicate');
    expect(result.duplicate?.path).toBe(`/packages/${SENDER.toLowerCase()}/sentinel-code-auditor`);
    expect(registerPackageFn).not.toHaveBeenCalled();
  });

  it('maps wallet rejection', async () => {
    registerPackageFn.mockRejectedValue(new UpdateSealError('WALLET_REJECTED', 'Wallet rejected the registration signature.'));
    const result = await submitRegistration(liveInput(), deps);
    expect(result).toMatchObject({ ok: false, phase: 'wallet_rejected' });
  });

  it('maps fee estimation failure without a transaction hash', async () => {
    registerPackageFn.mockRejectedValue(new UpdateSealError('FEE_ESTIMATION_FAILED', 'Fee estimation failed'));
    const result = await submitRegistration(liveInput(), deps);
    expect(result).toMatchObject({ ok: false, phase: 'fee_estimation_failed', message: 'Fee estimation failed' });
    if (result.ok) return;
    expect(result.transactionHash).toBeUndefined();
  });

  it('maps an invalid fee estimate without a transaction hash', async () => {
    registerPackageFn.mockRejectedValue(new UpdateSealError('FEE_ESTIMATE_INVALID', 'Fee estimation failed'));
    const result = await submitRegistration(liveInput(), deps);
    expect(result).toMatchObject({ ok: false, phase: 'fee_estimate_invalid', message: 'Fee estimation failed' });
    if (result.ok) return;
    expect(result.transactionHash).toBeUndefined();
  });

  it('maps contract rejection after a hash exists', async () => {
    registerPackageFn.mockRejectedValue(
      new UpdateSealError('CONTRACT_REJECTED', 'The contract rejected this registration.', TX_HASH),
    );
    const result = await submitRegistration(liveInput(), deps);
    expect(result).toMatchObject({ ok: false, phase: 'contract_rejected', transactionHash: TX_HASH });
  });

  it('maps preparation failure before a hash without calling it a contract rejection', async () => {
    registerPackageFn.mockRejectedValue(
      new UpdateSealError(
        'TRANSACTION_PREPARATION_FAILED',
        'The wallet transaction could not be prepared. No transaction was submitted.',
      ),
    );
    const result = await submitRegistration(liveInput(), deps);
    expect(result).toMatchObject({
      ok: false,
      phase: 'transaction_preparation_failed',
      message: 'The wallet transaction could not be prepared. No transaction was submitted.',
    });
    if (result.ok) return;
    expect(result.transactionHash).toBeUndefined();
    expect(result.phase).not.toBe('contract_rejected');
  });

  it('timeout produces status unknown, not failed', async () => {
    registerPackageFn.mockRejectedValue(
      new UpdateSealError(
        'STATUS_UNKNOWN',
        'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
        TX_HASH,
      ),
    );
    const result = await submitRegistration(liveInput(), deps);
    expect(result).toMatchObject({ ok: false, phase: 'status_unknown', transactionHash: TX_HASH });
    if (result.ok) return;
    expect(result.message.toLowerCase()).toMatch(/unknown/);
    expect(result.message.toLowerCase()).not.toMatch(/failed/);
  });

  it('finalized success returns the on-chain package and live path identity', async () => {
    const record = {
      ...SMOKE_PACKAGE,
      package_uid: `${SENDER.toLowerCase()}/sentinel-code-auditor`,
      package_slug: 'sentinel-code-auditor',
      publisher: SENDER.toLowerCase(),
    };
    registerPackageFn.mockResolvedValue({
      transactionHash: TX_HASH,
      packageUid: record.package_uid,
      record,
      consensusStatus: 'FINALIZED',
    });
    const result = await submitRegistration(liveInput(), deps);
    expect(result.ok).toBe(true);
    if (!result.ok || result.phase !== 'finalized') return;
    expect(result.success.packageUid).toBe(record.package_uid);
    expect(result.success.record.charter_hash).toBe(SMOKE_PACKAGE.charter_hash);
    expect(registerPackageFn).toHaveBeenCalledTimes(1);
  });

  it('coalesces double-clicks into a single write', async () => {
    let resolveWrite: ((value: unknown) => void) | undefined;
    registerPackageFn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWrite = resolve;
        }),
    );
    const first = submitRegistration(liveInput(), deps);
    const second = submitRegistration(liveInput(), deps);
    await vi.waitFor(() => {
      expect(registerPackageFn).toHaveBeenCalledTimes(1);
    });
    resolveWrite?.({
      transactionHash: TX_HASH,
      packageUid: `${SENDER.toLowerCase()}/sentinel-code-auditor`,
      record: {
        ...SMOKE_PACKAGE,
        package_uid: `${SENDER.toLowerCase()}/sentinel-code-auditor`,
        package_slug: 'sentinel-code-auditor',
        publisher: SENDER.toLowerCase(),
      },
      consensusStatus: 'FINALIZED',
    });
    const [a, b] = await Promise.all([first, second]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(registerPackageFn).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('makes no real RPC calls in these tests', async () => {
    await submitRegistration(liveInput({ configResult: demoConfig }), deps);
    await submitRegistration(liveInput({ configResult: invalidConfig }), deps);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
  });
});

describe('checkRegistrationStatus', () => {
  const TX = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;
  const snapshot = createPendingRegistrationSnapshot({
    transactionHash: TX,
    senderAddress: SENDER,
    packageSlug: 'sentinel-code-auditor',
    repositoryUrl: form.repositoryUrl,
    baselineCommitSha: form.baselineCommitSha,
    canonicalCharterJson: '{"schema_version":1}',
  });

  function matchingRecord(overrides: Partial<OnChainPackageRecord> = {}): OnChainPackageRecord {
    return {
      package_uid: snapshot.expectedPackageUid,
      package_slug: snapshot.packageSlug,
      publisher: snapshot.senderAddress,
      repository_url: snapshot.repositoryUrl,
      baseline_commit_sha: snapshot.baselineCommitSha,
      charter_json: snapshot.canonicalCharterJson,
      charter_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      sequence: 0,
      ...overrides,
    };
  }

  const waitForExistingRegistrationFn = vi.fn();
  const getPackageFn = vi.fn();
  const packageExistsFn = vi.fn();
  const registerPackageFn = vi.fn();
  const createWriteClientFn = vi.fn();
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  const deps = {
    waitForExistingRegistrationFn,
    getPackageFn,
    packageExistsFn,
    registerPackageFn,
    createWriteClientFn,
    getReadClientFn: () => ({ waitForTransactionReceipt: vi.fn() }),
  };

  beforeEach(() => {
    waitForExistingRegistrationFn.mockReset();
    getPackageFn.mockReset();
    packageExistsFn.mockReset();
    registerPackageFn.mockReset();
    createWriteClientFn.mockClear();
    fetchSpy.mockClear();
    packageExistsFn.mockResolvedValue(true);
  });

  function rejectedReceipt() {
    return {
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_ERROR',
      hash: TX,
      consensus_data: { leader_receipt: [{ error: 'rejected', execution_result: 'FINISHED_WITH_ERROR' }] },
    };
  }

  function successfulReceipt() {
    return {
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_RETURN',
      hash: TX,
      consensus_data: {
        leader_receipt: [{ result: snapshot.expectedPackageUid, execution_result: 'FINISHED_WITH_RETURN' }],
      },
    };
  }

  it('never treats a rejected receipt as success even when package_exists is true', async () => {
    waitForExistingRegistrationFn.mockResolvedValue(rejectedReceipt());
    const result = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(result).toMatchObject({ ok: false, phase: 'contract_rejected', transactionHash: TX });
    expect(registerPackageFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(packageExistsFn).not.toHaveBeenCalled();
    expect(getPackageFn).not.toHaveBeenCalled();
  });

  it('proceeds to read-back after a successful receipt', async () => {
    waitForExistingRegistrationFn.mockResolvedValue(successfulReceipt());
    getPackageFn.mockResolvedValue(matchingRecord());
    const result = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(result.ok).toBe(true);
    if (!result.ok || result.phase !== 'finalized') return;
    expect(result.success.packageUid).toBe(snapshot.expectedPackageUid);
    expect(getPackageFn).toHaveBeenCalledWith(snapshot.expectedPackageUid);
    expect(registerPackageFn).not.toHaveBeenCalled();
  });

  it('maps pending or malformed retry receipts to status_unknown and keeps the hash', async () => {
    waitForExistingRegistrationFn.mockResolvedValue({ statusName: 'PENDING', txExecutionResultName: 'NOT_VOTED', hash: TX });
    const pending = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(pending).toMatchObject({ ok: false, phase: 'status_unknown', transactionHash: TX });

    waitForExistingRegistrationFn.mockResolvedValue({ hash: TX });
    const malformed = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(malformed).toMatchObject({ ok: false, phase: 'status_unknown', transactionHash: TX });
    expect(registerPackageFn).not.toHaveBeenCalled();
  });

  it('preserves the original snapshot identity when the live wallet or form slug would differ', async () => {
    waitForExistingRegistrationFn.mockResolvedValue(successfulReceipt());
    getPackageFn.mockResolvedValue(matchingRecord());
    const result = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(result.ok).toBe(true);
    if (!result.ok || result.phase !== 'finalized') return;
    expect(result.success.packageUid).toBe(`${SENDER.toLowerCase()}/sentinel-code-auditor`);
    expect(result.success.packageUid).not.toContain('other-slug');
    expect(getPackageFn).toHaveBeenCalledWith(snapshot.expectedPackageUid);
  });

  it('keeps the snapshot after timeout and RPC interruption', async () => {
    waitForExistingRegistrationFn.mockRejectedValue(
      new UpdateSealError(
        'STATUS_UNKNOWN',
        'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
        TX,
      ),
    );
    const timeout = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(timeout).toMatchObject({ ok: false, phase: 'status_unknown', transactionHash: TX, snapshot });

    waitForExistingRegistrationFn.mockRejectedValue(new Error('fetch failed'));
    const interrupted = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(interrupted.ok).toBe(false);
    if (interrupted.ok) return;
    expect(interrupted.transactionHash).toBe(TX);
    expect(interrupted.snapshot?.expectedPackageUid).toBe(snapshot.expectedPackageUid);
    expect(interrupted.snapshot?.packageSlug).toBe('sentinel-code-auditor');
  });

  it('rejects publisher mismatch as status_unknown', async () => {
    waitForExistingRegistrationFn.mockResolvedValue(successfulReceipt());
    getPackageFn.mockResolvedValue(matchingRecord({ publisher: '0x1111111111111111111111111111111111111111' }));
    const result = await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(result).toMatchObject({ ok: false, phase: 'status_unknown', transactionHash: TX });
  });

  it('rejects slug, repository, SHA, charter JSON, and UID mismatches', async () => {
    waitForExistingRegistrationFn.mockResolvedValue(successfulReceipt());

    getPackageFn.mockResolvedValue(matchingRecord({ package_slug: 'other-slug' }));
    expect(await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps)).toMatchObject({
      phase: 'status_unknown',
      transactionHash: TX,
    });

    getPackageFn.mockResolvedValue(matchingRecord({ repository_url: 'https://github.com/other/repo' }));
    expect(await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps)).toMatchObject({
      phase: 'status_unknown',
      transactionHash: TX,
    });

    getPackageFn.mockResolvedValue(matchingRecord({ baseline_commit_sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }));
    expect(await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps)).toMatchObject({
      phase: 'status_unknown',
      transactionHash: TX,
    });

    getPackageFn.mockResolvedValue(matchingRecord({ charter_json: '{}' }));
    expect(await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps)).toMatchObject({
      phase: 'status_unknown',
      transactionHash: TX,
    });

    getPackageFn.mockResolvedValue(matchingRecord({ package_uid: `${SENDER.toLowerCase()}/other-slug` }));
    expect(await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps)).toMatchObject({
      phase: 'status_unknown',
      transactionHash: TX,
    });
  });

  it('never calls writeContract during status retry', async () => {
    waitForExistingRegistrationFn.mockResolvedValue(successfulReceipt());
    getPackageFn.mockResolvedValue(matchingRecord());
    await checkRegistrationStatus({ snapshot, configResult: liveConfig }, deps);
    expect(registerPackageFn).not.toHaveBeenCalled();
    expect(createWriteClientFn).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
