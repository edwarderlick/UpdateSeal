import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALID_LIVE_ENV, SMOKE_PACKAGE } from '../../test/updateSealFixtures';
import { parseUpdateSealConfig, resetUpdateSealConfigCache } from '../../lib/updateSealConfig';
import { createPendingRegistrationSnapshot } from '../../lib/registrationReceipt';
import { registryQueryKeys } from '../registry/registryQueryKeys';
import type { PendingRegistrationSnapshot } from '../../types/updateSeal';

const submitRegistration = vi.fn();
const checkRegistrationStatus = vi.fn();
const getEthereumProvider = vi.fn(async () => ({ request: vi.fn() }));
const openWalletModal = vi.fn();
const openNetworkModal = vi.fn();
const setLiveReceipt = vi.fn();

const SENDER = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
const TX_HASH = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;

const walletState = {
  isConnected: true,
  address: SENDER,
  chainId: 61997,
};

const formState = {
  packageId: 'sentinel-code-auditor',
  displayName: 'Sentinel',
  description: 'Autonomous static analysis daemon evaluating smart contracts against security invariants.',
  repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
  ownerWallet: SENDER,
  baselineVersion: 'v1.0.0',
  baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
  manifestPath: 'package.json',
  license: 'Apache-2.0',
  capabilityCharter: {
    network_egress: { policy: 'ALLOWED_WITH_LIMITS', allowedDomains: ['github.com'] },
    file_system: { policy: 'ALLOWED_WITH_LIMITS' },
    process_execution: { policy: 'PROHIBITED' },
    cryptographic_signing: { policy: 'PROHIBITED' },
    spending_limits: { policy: 'ALLOWED_WITH_LIMITS' },
    external_data_export: { policy: 'ALLOWED_WITH_LIMITS' },
  },
};

vi.mock('./submitRegistration', () => ({
  submitRegistration: (...args: unknown[]) => submitRegistration(...args),
  checkRegistrationStatus: (...args: unknown[]) => checkRegistrationStatus(...args),
}));

vi.mock('../wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: walletState,
    isWrongNetwork: false,
    openWalletModal,
    openNetworkModal,
    getEthereumProvider,
  }),
}));

vi.mock('./RegistrationContext', async () => {
  const actual = await vi.importActual<typeof import('./RegistrationContext')>('./RegistrationContext');
  return {
    ...actual,
    useRegistration: () => ({
      formData: formState,
      setLiveReceipt,
    }),
  };
});

import { useRegisterPackage } from './useRegisterPackage';

function originalSnapshot(): PendingRegistrationSnapshot {
  return createPendingRegistrationSnapshot({
    transactionHash: TX_HASH,
    senderAddress: SENDER,
    packageSlug: 'sentinel-code-auditor',
    repositoryUrl: formState.repositoryUrl,
    baselineCommitSha: formState.baselineCommitSha,
    canonicalCharterJson: '{"schema_version":1}',
  });
}

describe('useRegisterPackage', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    submitRegistration.mockReset();
    checkRegistrationStatus.mockReset();
    invalidateQueries.mockReset();
    setLiveReceipt.mockReset();
    walletState.address = SENDER;
    formState.packageId = 'sentinel-code-auditor';
    Object.entries(VALID_LIVE_ENV).forEach(([key, value]) => vi.stubEnv(key, value));
    resetUpdateSealConfigCache();
  });

  it('invalidates registry queries after finalized success', async () => {
    const record = {
      ...SMOKE_PACKAGE,
      package_uid: '0x82fde1090c2941e5d8742a944813ebfc09c91c12/sentinel-code-auditor',
      package_slug: 'sentinel-code-auditor',
      publisher: '0x82fde1090c2941e5d8742a944813ebfc09c91c12',
    };
    submitRegistration.mockResolvedValue({
      ok: true,
      phase: 'finalized',
      success: {
        transactionHash: TX_HASH,
        packageUid: record.package_uid,
        record,
        consensusStatus: 'FINALIZED',
      },
    });

    const { result } = renderHook(() => useRegisterPackage(), { wrapper });
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: registryQueryKeys.all });
    });
    expect(setLiveReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        packageUid: record.package_uid,
        charterHash: record.charter_hash,
      }),
    );
    expect(parseUpdateSealConfig(VALID_LIVE_ENV).chainId).toBe(61997);
  });

  it('shows fee estimation progress without a transaction hash', async () => {
    submitRegistration.mockImplementation(async (input: { onProgress?: (event: { phase: string; estimatedFeeLabel?: string }) => void }) => {
      input.onProgress?.({ phase: 'estimating_fees' });
      input.onProgress?.({ phase: 'awaiting_wallet', estimatedFeeLabel: '0.12345 GEN' });
      return {
        ok: false,
        phase: 'wallet_rejected',
        message: 'Wallet rejected the registration signature.',
      };
    });

    const { result } = renderHook(() => useRegisterPackage(), { wrapper });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.view.phase).toBe('wallet_rejected');
    expect(result.current.view.transactionHash).toBeNull();
    expect(result.current.view.estimatedFeeLabel).toBe('0.12345 GEN');
  });

  it('retries against the original snapshot after wallet and slug changes, timeout, and RPC interruption', async () => {
    const snapshot = originalSnapshot();
    submitRegistration.mockImplementation(async (_input: unknown, _deps: unknown, onProgressMaybe?: unknown) => {
      void onProgressMaybe;
      const input = _input as { onProgress?: (event: { phase: string; transactionHash: string; snapshot: PendingRegistrationSnapshot }) => void };
      input.onProgress?.({ phase: 'submitted', transactionHash: TX_HASH, snapshot });
      return {
        ok: false,
        phase: 'status_unknown',
        message: 'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
        transactionHash: TX_HASH,
        snapshot,
      };
    });
    checkRegistrationStatus.mockResolvedValue({
      ok: false,
      phase: 'status_unknown',
      message: 'Transaction status is unknown.',
      transactionHash: TX_HASH,
      snapshot,
    });

    const { result } = renderHook(() => useRegisterPackage(), { wrapper });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.view.pendingSnapshot?.expectedPackageUid).toBe(snapshot.expectedPackageUid);
    expect(result.current.view.transactionHash).toBe(TX_HASH);

    walletState.address = '0x1111111111111111111111111111111111111111';
    formState.packageId = 'changed-after-submit';
    getEthereumProvider.mockClear();

    await act(async () => {
      await result.current.retryStatus();
    });

    expect(checkRegistrationStatus).toHaveBeenCalledTimes(1);
    const retryInput = checkRegistrationStatus.mock.calls[0][0] as { snapshot: PendingRegistrationSnapshot };
    expect(retryInput.snapshot.expectedPackageUid).toBe(snapshot.expectedPackageUid);
    expect(retryInput.snapshot.packageSlug).toBe('sentinel-code-auditor');
    expect(retryInput.snapshot.senderAddress).toBe(SENDER.toLowerCase());
    expect(result.current.view.pendingSnapshot?.expectedPackageUid).toBe(snapshot.expectedPackageUid);
    expect(result.current.view.transactionHash).toBe(TX_HASH);
    expect(getEthereumProvider).not.toHaveBeenCalled();
  });
});
