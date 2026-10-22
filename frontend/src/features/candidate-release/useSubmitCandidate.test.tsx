import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VALID_LIVE_ENV, SMOKE_PACKAGE } from '../../test/updateSealFixtures';
import { resetUpdateSealConfigCache } from '../../lib/updateSealConfig';
import { createPendingCandidateSnapshot } from '../../lib/candidateReceipt';
import { registryQueryKeys } from '../registry/registryQueryKeys';
import { buildEvidencePreflightInputs, type EvidencePreflightSuccess } from '../../lib/evidencePreflight';

const submitLiveCandidate = vi.fn();
const checkCandidateStatus = vi.fn();
const getEthereumProvider = vi.fn(async () => ({ request: vi.fn() }));
const openWalletModal = vi.fn();
const openNetworkModal = vi.fn();
const setLiveReceipt = vi.fn();
const setPendingSnapshot = vi.fn();
const clearDraftAfterSuccess = vi.fn();

const SENDER = SMOKE_PACKAGE.publisher;
const TX_HASH = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as const;

const walletState = {
  isConnected: true,
  address: SENDER,
  chainId: 61997,
};

const SHA = 'b'.repeat(40);
const URI = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA}/e.json`;
const HASH = 'aa'.repeat(32);

const preflight: EvidencePreflightSuccess = {
  ok: true,
  httpStatus: 200,
  bodySize: 1,
  computedSha256: HASH,
  expectedSha256: HASH,
  document: {
    schemaVersion: 2,
    packageUid: SMOKE_PACKAGE.package_uid,
    version: '1.0.1',
    baselineCommitSha: SMOKE_PACKAGE.baseline_commit_sha,
    diffSummary: 'd',
    changedFiles: [],
    declaredCapabilities: [],
    requestedDomains: [],
    evidenceItems: [],
    tests: [],
  },
  inputs: buildEvidencePreflightInputs({
    evidenceUri: URI,
    evidenceHash: HASH,
    packageUid: SMOKE_PACKAGE.package_uid,
    version: '1.0.1',
    baselineCommitSha: SMOKE_PACKAGE.baseline_commit_sha,
    candidateCommitSha: SHA,
  }),
};

vi.mock('./submitCandidate', () => ({
  submitLiveCandidate: (...args: unknown[]) => submitLiveCandidate(...args),
  checkCandidateStatus: (...args: unknown[]) => checkCandidateStatus(...args),
}));

vi.mock('../wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: walletState,
    isWrongNetwork: walletState.chainId !== 61997,
    openWalletModal,
    openNetworkModal,
    getEthereumProvider,
  }),
}));

vi.mock('./LiveCandidateContext', () => ({
  useLiveCandidate: () => ({
    packageRecord: SMOKE_PACKAGE,
    packageUid: SMOKE_PACKAGE.package_uid,
    publisher: SMOKE_PACKAGE.publisher,
    repositoryUrl: SMOKE_PACKAGE.repository_url,
    baselineCommitSha: SMOKE_PACKAGE.baseline_commit_sha,
    charterHash: SMOKE_PACKAGE.charter_hash,
    draft: {
      version: '1.0.1',
      candidateCommitSha: 'b'.repeat(40),
      evidenceUri: `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${'b'.repeat(40)}/e.json`,
      evidenceHash: 'aa'.repeat(32),
    },
    evidencePassed: preflight,
    pendingSnapshot: null,
    setPendingSnapshot,
    setLiveReceipt,
    clearDraftAfterSuccess,
  }),
}));

import { useSubmitCandidate } from './useSubmitCandidate';

describe('useSubmitCandidate', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    submitLiveCandidate.mockReset();
    checkCandidateStatus.mockReset();
    invalidateQueries.mockReset();
    setLiveReceipt.mockReset();
    setPendingSnapshot.mockReset();
    clearDraftAfterSuccess.mockReset();
    walletState.isConnected = true;
    walletState.address = SENDER;
    walletState.chainId = 61997;
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    vi.stubEnv('VITE_GENLAYER_RPC_URL', VALID_LIVE_ENV.VITE_GENLAYER_RPC_URL);
    vi.stubEnv('VITE_GENLAYER_CHAIN_ID', VALID_LIVE_ENV.VITE_GENLAYER_CHAIN_ID);
    vi.stubEnv('VITE_UPDATESEAL_CONTRACT_ADDRESS', VALID_LIVE_ENV.VITE_UPDATESEAL_CONTRACT_ADDRESS);
    resetUpdateSealConfigCache();
  });

  it('invalidates registry queries after finalized success', async () => {
    submitLiveCandidate.mockResolvedValue({
      ok: true,
      phase: 'finalized',
      success: {
        transactionHash: TX_HASH,
        candidateId: `${SMOKE_PACKAGE.package_uid}@1.0.1`,
        record: {
          candidate_id: `${SMOKE_PACKAGE.package_uid}@1.0.1`,
          package_uid: SMOKE_PACKAGE.package_uid,
          version: '1.0.1',
          candidate_commit_sha: 'b'.repeat(40),
          evidence_uri: 'https://raw.githubusercontent.com/edwarderlick/Provider-Court/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/e.json',
          evidence_hash: 'aa'.repeat(32),
          submitter: SENDER,
          status: 'PENDING',
          decision_code: 0,
          decision_summary: '',
          evaluation_attempts: 0,
          finding_codes_json: '',
          decision_hash: '',
        },
        consensusStatus: 'FINALIZED',
      },
    });
    const { result } = renderHook(() => useSubmitCandidate(), { wrapper });
    await act(async () => {
      await result.current.submit();
    });
    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: registryQueryKeys.all });
    });
    expect(setLiveReceipt).toHaveBeenCalled();
    expect(clearDraftAfterSuccess).toHaveBeenCalled();
  });

  it('double-click protection skips a second in-flight submit', async () => {
    let resolveFirst: (value: unknown) => void = () => undefined;
    submitLiveCandidate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { result } = renderHook(() => useSubmitCandidate(), { wrapper });
    let first: Promise<unknown> | undefined;
    act(() => {
      first = result.current.submit();
    });
    await act(async () => {
      const second = await result.current.submit();
      expect(second).toBeDefined();
    });
    resolveFirst({ ok: true, phase: 'demo' });
    await first;
    expect(submitLiveCandidate).toHaveBeenCalledTimes(1);
  });

  it('status retry uses the frozen snapshot and does not submit again', async () => {
    const snapshot = createPendingCandidateSnapshot({
      transactionHash: TX_HASH,
      senderAddress: SENDER,
      packageUid: SMOKE_PACKAGE.package_uid,
      version: '1.0.1',
      candidateCommitSha: 'b'.repeat(40),
      evidenceUri: 'https://example.test/e.json',
      evidenceHash: 'aa'.repeat(32),
    });
    checkCandidateStatus.mockResolvedValue({
      ok: false,
      phase: 'status_unknown',
      message: 'unknown',
      snapshot,
      transactionHash: TX_HASH,
    });
    submitLiveCandidate.mockResolvedValue({
      ok: false,
      phase: 'status_unknown',
      message: 'unknown',
      snapshot,
      transactionHash: TX_HASH,
    });
    const { result } = renderHook(() => useSubmitCandidate(), { wrapper });
    await act(async () => {
      await result.current.submit();
    });
    await act(async () => {
      await result.current.retryStatus();
    });
    expect(checkCandidateStatus).toHaveBeenCalledWith(
      expect.objectContaining({ snapshot: expect.objectContaining({ transactionHash: TX_HASH }) }),
      expect.anything(),
    );
    expect(submitLiveCandidate).toHaveBeenCalledTimes(1);
  });
});
