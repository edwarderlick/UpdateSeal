import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../../lib/updateSealConfig';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../../types/updateSeal';
import { liveCandidateDecisionPath, liveCandidateRecordPath } from '../../lib/registrationValidation';
import { createPendingEvaluationSnapshot } from '../../lib/evaluationReceipt';

const { getPackage, getCandidate, getPackageUid, packageExists, getRegistrySnapshot } = vi.hoisted(() => ({
  getPackage: vi.fn(),
  getCandidate: vi.fn(),
  getPackageUid: vi.fn(),
  packageExists: vi.fn(),
  getRegistrySnapshot: vi.fn(),
}));

const estimateLiveEvaluation = vi.fn();
const submitLiveEvaluation = vi.fn();
const checkEvaluationStatus = vi.fn();
const loadEvaluationSnapshot = vi.fn();

const wallet = {
  isConnected: false,
  address: null as string | null,
  chainId: 61997,
};
const openWalletModal = vi.fn();

vi.mock('../../services/updateSealContract', () => ({
  getPackage,
  getCandidate,
  getPackageUid,
  packageExists,
  getRegistrySnapshot,
}));

vi.mock('../../features/candidate-release/evaluateCandidate', async () => {
  const actual = await vi.importActual<typeof import('../../features/candidate-release/evaluateCandidate')>(
    '../../features/candidate-release/evaluateCandidate',
  );
  return {
    ...actual,
    estimateLiveEvaluation: (...args: unknown[]) => estimateLiveEvaluation(...args),
    submitLiveEvaluation: (...args: unknown[]) => submitLiveEvaluation(...args),
    checkEvaluationStatus: (...args: unknown[]) => checkEvaluationStatus(...args),
  };
});

vi.mock('../../lib/evaluationReceipt', async () => {
  const actual = await vi.importActual<typeof import('../../lib/evaluationReceipt')>('../../lib/evaluationReceipt');
  return {
    ...actual,
    loadEvaluationSnapshot: (...args: unknown[]) => loadEvaluationSnapshot(...args),
  };
});

vi.mock('../../features/wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: {
      isConnected: wallet.isConnected,
      address: wallet.address,
      chainId: wallet.chainId,
    },
    isConnecting: false,
    isWrongNetwork: wallet.isConnected && wallet.chainId !== 61997,
    errorMessage: null,
    clearError: vi.fn(),
    openWalletModal,
    openConnectModal: openWalletModal,
    openNetworkModal: vi.fn(),
    disconnectWallet: vi.fn(),
    switchToStudioNext: vi.fn(),
    copyAddress: vi.fn(),
    viewOnExplorer: vi.fn(),
    copied: false,
    getEthereumProvider: async () => ({ request: vi.fn() }),
  }),
}));

import { LiveCandidateDetailPage } from '../../pages/LiveCandidateDetailPage';

const OFFICIAL: OnChainPackageRecord = {
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
  candidate_id: `${OFFICIAL.package_uid}@0.1.0-v2-smoke`,
  package_uid: OFFICIAL.package_uid,
  version: '0.1.0-v2-smoke',
  candidate_commit_sha: 'd097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f',
  evidence_uri:
    'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/d097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f/evidence/evidence-v2.json',
  evidence_hash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  submitter: OFFICIAL.publisher,
  status: 'APPROVED',
  decision_code: 1,
  decision_summary: 'No charter violations were found',
  evaluation_attempts: 1,
  finding_codes_json: '["NO_VIOLATION"]',
  decision_hash: 'c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97',
};

const PENDING: OnChainCandidateRecord = {
  ...APPROVED,
  candidate_id: `${OFFICIAL.package_uid}@0.1.0-pending`,
  version: '0.1.0-pending',
  status: 'PENDING',
  decision_code: 0,
  decision_summary: '',
  evaluation_attempts: 0,
  finding_codes_json: '',
  decision_hash: '',
};

const UNAVAILABLE: OnChainCandidateRecord = {
  ...APPROVED,
  candidate_id: `${OFFICIAL.package_uid}@0.1.0-unavailable`,
  version: '0.1.0-unavailable',
  status: 'EVIDENCE_UNAVAILABLE',
  decision_code: 4,
  decision_summary: 'Evidence could not be fetched',
  evaluation_attempts: 1,
  finding_codes_json: '["EVIDENCE_FETCH_FAILED"]',
};

function renderDetail(version: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const path = liveCandidateRecordPath(OFFICIAL.publisher, OFFICIAL.package_slug, version);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/packages/:publisher/:packageSlug/candidates/:version"
            element={<LiveCandidateDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('live evaluation UI', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    vi.stubEnv('VITE_GENLAYER_RPC_URL', 'https://studio-dev.genlayer.com/api');
    vi.stubEnv('VITE_GENLAYER_CHAIN_ID', '61997');
    vi.stubEnv('VITE_UPDATESEAL_CONTRACT_ADDRESS', '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3');
    resetUpdateSealConfigCache();
    wallet.isConnected = false;
    wallet.address = null;
    wallet.chainId = 61997;
    openWalletModal.mockReset();
    estimateLiveEvaluation.mockReset();
    submitLiveEvaluation.mockReset();
    checkEvaluationStatus.mockReset();
    loadEvaluationSnapshot.mockReset().mockReturnValue(null);
    getPackageUid.mockResolvedValue(OFFICIAL.package_uid);
    packageExists.mockResolvedValue(true);
    getPackage.mockResolvedValue(OFFICIAL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetUpdateSealConfigCache();
  });

  it('PENDING disconnected shows Connect Wallet and does not auto-open the modal', async () => {
    getCandidate.mockResolvedValue(PENDING);
    renderDetail(PENDING.version);
    expect(await screen.findByTestId('connect-to-evaluate')).toHaveTextContent(/Connect Wallet to Request Evaluation/i);
    expect(openWalletModal).not.toHaveBeenCalled();
    expect(estimateLiveEvaluation).not.toHaveBeenCalled();
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
  });

  it('PENDING connected/correct network shows Request Evaluation', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue(PENDING);
    renderDetail(PENDING.version);
    expect(await screen.findByTestId('request-evaluation')).toBeDisabled();
    expect(screen.getByTestId('estimate-evaluation-fee')).toBeInTheDocument();
  });

  it('explicit confirmation submits evaluate_candidate exactly once', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue(PENDING);
    const confirmation = {
      candidateId: PENDING.candidate_id,
      packageUid: PENDING.package_uid,
      version: PENDING.version,
      candidateCommitSha: PENDING.candidate_commit_sha,
      evidenceUri: PENDING.evidence_uri,
      evidenceHash: PENDING.evidence_hash,
      submitter: PENDING.submitter,
      originalStatus: 'PENDING' as const,
      originalEvaluationAttempts: 0,
      callerAddress: wallet.address,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      estimate: {
        senderAddress: wallet.address,
        chainId: 61997,
        contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
        method: 'evaluate_candidate' as const,
        candidateId: PENDING.candidate_id,
        feeValue: 123n,
        feeLabel: '0.000000000000000123 GEN',
        distribution: {},
        messageAllocations: [],
      },
    };
    estimateLiveEvaluation.mockResolvedValue({
      ok: true,
      phase: 'ready',
      confirmation,
      estimate: confirmation.estimate,
    });
    submitLiveEvaluation.mockImplementation(() => new Promise(() => undefined));
    renderDetail(PENDING.version);
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('estimate-evaluation-fee'));
    await waitFor(() => {
      expect(screen.getByTestId('request-evaluation')).not.toBeDisabled();
    });
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('request-evaluation'));
    await waitFor(() => {
      expect(submitLiveEvaluation).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('request-evaluation')).toBeDisabled();
    await user.click(screen.getByTestId('request-evaluation'));
    expect(submitLiveEvaluation).toHaveBeenCalledTimes(1);
  });

  it('completed candidate has no Request Evaluation button and links the decision report', async () => {
    getCandidate.mockResolvedValue(APPROVED);
    renderDetail(APPROVED.version);
    expect(await screen.findByTestId('evaluation-complete')).toHaveTextContent(/Evaluation complete/i);
    const link = screen.getByTestId('view-decision-report');
    expect(link).toHaveAttribute(
      'href',
      liveCandidateDecisionPath(OFFICIAL.publisher, OFFICIAL.package_slug, APPROVED.version),
    );
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(estimateLiveEvaluation).not.toHaveBeenCalled();
  });

  it('EVIDENCE_UNAVAILABLE disconnected shows Connect Wallet to Retry Evaluation without auto-opening the modal', async () => {
    getCandidate.mockResolvedValue(UNAVAILABLE);
    renderDetail(UNAVAILABLE.version);
    expect(await screen.findByTestId('connect-to-evaluate')).toHaveTextContent(/Connect Wallet to Retry Evaluation/i);
    expect(screen.getByText(/Retry evidence evaluation/i)).toBeInTheDocument();
    expect(screen.getByText(/incurs a new GenLayer fee/i)).toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
    expect(estimateLiveEvaluation).not.toHaveBeenCalled();
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
  });

  it('EVIDENCE_UNAVAILABLE connected/correct network shows Retry Evaluation and does not auto-submit', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue(UNAVAILABLE);
    renderDetail(UNAVAILABLE.version);
    expect(await screen.findByTestId('retry-evaluation')).toBeDisabled();
    expect(screen.getByTestId('estimate-evaluation-fee')).toBeInTheDocument();
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
  });

  it('wrong-network retry cannot submit', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    wallet.chainId = 1;
    getCandidate.mockResolvedValue(UNAVAILABLE);
    renderDetail(UNAVAILABLE.version);
    expect(await screen.findByTestId('evaluate-wrong-network')).toBeInTheDocument();
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
  });

  it('unresolved snapshot disables Retry Evaluation', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    const snapshot = createPendingEvaluationSnapshot({
      transactionHash: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      candidateId: UNAVAILABLE.candidate_id,
      packageUid: UNAVAILABLE.package_uid,
      version: UNAVAILABLE.version,
      candidateCommitSha: UNAVAILABLE.candidate_commit_sha,
      evidenceUri: UNAVAILABLE.evidence_uri,
      evidenceHash: UNAVAILABLE.evidence_hash,
      originalStatus: 'EVIDENCE_UNAVAILABLE',
      originalEvaluationAttempts: 1,
      callerAddress: wallet.address,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      feeEstimateWei: 1n,
      submitter: UNAVAILABLE.submitter,
    });
    loadEvaluationSnapshot.mockReturnValue(snapshot);
    getCandidate.mockResolvedValue(UNAVAILABLE);
    renderDetail(UNAVAILABLE.version);
    expect(await screen.findByTestId('check-existing-transaction')).toHaveTextContent('Check Existing Transaction');
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
  });

  it('unresolved snapshot disables new evaluation and keeps the hash', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    const snapshot = createPendingEvaluationSnapshot({
      transactionHash: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      candidateId: PENDING.candidate_id,
      packageUid: PENDING.package_uid,
      version: PENDING.version,
      candidateCommitSha: PENDING.candidate_commit_sha,
      evidenceUri: PENDING.evidence_uri,
      evidenceHash: PENDING.evidence_hash,
      originalStatus: 'PENDING',
      originalEvaluationAttempts: 0,
      callerAddress: wallet.address,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      feeEstimateWei: 1n,
      submitter: PENDING.submitter,
    });
    loadEvaluationSnapshot.mockReturnValue(snapshot);
    getCandidate.mockResolvedValue(PENDING);
    renderDetail(PENDING.version);
    expect(await screen.findByTestId('check-existing-transaction')).toHaveTextContent('Check Existing Transaction');
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.getByTestId('evaluation-tx-hash')).toHaveTextContent(snapshot.transactionHash);
  });

  it('demo mode never renders the production Request Evaluation action', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    getCandidate.mockResolvedValue(PENDING);
    renderDetail(PENDING.version);
    expect(await screen.findByTestId('live-candidate-detail-demo-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('connect-to-evaluate')).not.toBeInTheDocument();
    expect(estimateLiveEvaluation).not.toHaveBeenCalled();
  });

  it('public candidate reads still require no wallet', async () => {
    getCandidate.mockResolvedValue(APPROVED);
    renderDetail(APPROVED.version);
    expect(await screen.findByTestId('live-candidate-detail')).toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
  });

  it('PENDING attempt 2 shows Request Evaluation and that this request will be attempt 3', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue({ ...PENDING, evaluation_attempts: 2 });
    renderDetail(PENDING.version);
    expect(await screen.findByTestId('request-evaluation')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-next-attempt')).toHaveTextContent(/attempt 3/i);
    expect(screen.getByTestId('evaluation-attempts-used')).toHaveTextContent('Attempts used: 2 of 3');
    expect(screen.getByTestId('evaluation-attempts-remaining')).toHaveTextContent(
      'Attempts remaining before this transaction: 1',
    );
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('evaluation-attempts-exhausted')).not.toBeInTheDocument();
  });

  it('EVIDENCE_UNAVAILABLE attempt 2 shows Retry Evaluation and that this request will be attempt 3', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue({ ...UNAVAILABLE, evaluation_attempts: 2 });
    renderDetail(UNAVAILABLE.version);
    expect(await screen.findByTestId('retry-evaluation')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-next-attempt')).toHaveTextContent(/attempt 3/i);
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('evaluation-attempts-exhausted')).not.toBeInTheDocument();
  });

  it('PENDING attempt 3 shows Maximum evaluation attempts reached and no evaluate actions', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue({ ...PENDING, evaluation_attempts: 3 });
    renderDetail(PENDING.version);
    expect(await screen.findByTestId('evaluation-attempts-exhausted')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Maximum evaluation attempts reached/i })).toBeInTheDocument();
    expect(screen.getByTestId('exhausted-attempts')).toHaveTextContent('3');
    expect(screen.getByTestId('exhausted-max-attempts')).toHaveTextContent('3');
    expect(screen.getByTestId('exhausted-status')).toHaveTextContent('PENDING');
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('connect-to-evaluate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('estimate-evaluation-fee')).not.toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
    expect(estimateLiveEvaluation).not.toHaveBeenCalled();
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
  });

  it('EVIDENCE_UNAVAILABLE attempt 3 shows Maximum evaluation attempts reached and no retry', async () => {
    getCandidate.mockResolvedValue({ ...UNAVAILABLE, evaluation_attempts: 3 });
    renderDetail(UNAVAILABLE.version);
    expect(await screen.findByTestId('evaluation-attempts-exhausted')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Maximum evaluation attempts reached/i })).toBeInTheDocument();
    expect(screen.getByText(/Evidence remains unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/does not allow another evaluation attempt/i)).toBeInTheDocument();
    expect(screen.getByTestId('exhausted-status')).toHaveTextContent('EVIDENCE_UNAVAILABLE');
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('connect-to-evaluate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('estimate-evaluation-fee')).not.toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
    expect(estimateLiveEvaluation).not.toHaveBeenCalled();
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
  });

  it('attempt 2 becoming attempt 3 before submission invalidates confirmation and writes nothing', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue({ ...PENDING, evaluation_attempts: 2 });
    const confirmation = {
      candidateId: PENDING.candidate_id,
      packageUid: PENDING.package_uid,
      version: PENDING.version,
      candidateCommitSha: PENDING.candidate_commit_sha,
      evidenceUri: PENDING.evidence_uri,
      evidenceHash: PENDING.evidence_hash,
      submitter: PENDING.submitter,
      originalStatus: 'PENDING' as const,
      originalEvaluationAttempts: 2,
      callerAddress: wallet.address,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      estimate: {
        senderAddress: wallet.address,
        chainId: 61997,
        contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
        method: 'evaluate_candidate' as const,
        candidateId: PENDING.candidate_id,
        feeValue: 123n,
        feeLabel: '0.000000000000000123 GEN',
        distribution: {},
        messageAllocations: [],
      },
    };
    estimateLiveEvaluation.mockResolvedValue({
      ok: true,
      phase: 'ready',
      confirmation,
      estimate: confirmation.estimate,
    });
    submitLiveEvaluation.mockResolvedValue({
      ok: false,
      phase: 'max_evaluation_attempts',
      message: 'Maximum evaluation attempts reached. The deployed contract permits at most 3 attempts for this candidate.',
    });
    renderDetail(PENDING.version);
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('estimate-evaluation-fee'));
    await waitFor(() => {
      expect(screen.getByTestId('request-evaluation')).not.toBeDisabled();
    });
    getCandidate.mockResolvedValue({ ...PENDING, evaluation_attempts: 3 });
    await user.click(screen.getByTestId('request-evaluation'));
    await waitFor(() => {
      expect(submitLiveEvaluation).toHaveBeenCalledTimes(1);
    });
    expect(submitLiveEvaluation).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByTestId('evaluation-attempts-exhausted')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('request-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('estimate-evaluation-fee')).not.toBeInTheDocument();
  });

  it('finalized EVIDENCE_UNAVAILABLE at attempt 3 is success with no further retry', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    getCandidate.mockResolvedValue({ ...UNAVAILABLE, evaluation_attempts: 2 });
    const confirmation = {
      candidateId: UNAVAILABLE.candidate_id,
      packageUid: UNAVAILABLE.package_uid,
      version: UNAVAILABLE.version,
      candidateCommitSha: UNAVAILABLE.candidate_commit_sha,
      evidenceUri: UNAVAILABLE.evidence_uri,
      evidenceHash: UNAVAILABLE.evidence_hash,
      submitter: UNAVAILABLE.submitter,
      originalStatus: 'EVIDENCE_UNAVAILABLE' as const,
      originalEvaluationAttempts: 2,
      callerAddress: wallet.address,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      estimate: {
        senderAddress: wallet.address,
        chainId: 61997,
        contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
        method: 'evaluate_candidate' as const,
        candidateId: UNAVAILABLE.candidate_id,
        feeValue: 123n,
        feeLabel: '0.000000000000000123 GEN',
        distribution: {},
        messageAllocations: [],
      },
    };
    estimateLiveEvaluation.mockResolvedValue({
      ok: true,
      phase: 'ready',
      confirmation,
      estimate: confirmation.estimate,
    });
    const after = { ...UNAVAILABLE, evaluation_attempts: 3 };
    submitLiveEvaluation.mockResolvedValue({
      ok: true,
      phase: 'finalized',
      success: {
        transactionHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        candidateId: UNAVAILABLE.candidate_id,
        record: after,
        packageRecord: OFFICIAL,
        consensusStatus: 'FINALIZED',
        status: 'EVIDENCE_UNAVAILABLE',
      },
    });
    renderDetail(UNAVAILABLE.version);
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('estimate-evaluation-fee'));
    await waitFor(() => {
      expect(screen.getByTestId('retry-evaluation')).not.toBeDisabled();
    });
    await user.click(screen.getByTestId('retry-evaluation'));
    expect(await screen.findByTestId('evaluation-attempts-exhausted')).toBeInTheDocument();
    expect(screen.getByTestId('evaluate-message')).toHaveTextContent(/Evaluation transaction succeeded/i);
    expect(screen.getByTestId('evaluate-message')).toHaveTextContent(/Evidence remains unavailable/i);
    expect(screen.getByRole('heading', { name: /Maximum evaluation attempts reached/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Evidence remains unavailable/i).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('retry-evaluation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('estimate-evaluation-fee')).not.toBeInTheDocument();
    expect(submitLiveEvaluation).toHaveBeenCalledTimes(1);
    expect(estimateLiveEvaluation).toHaveBeenCalledTimes(1);
  });

  it('status_unknown keeps the transaction hash visible', async () => {
    wallet.isConnected = true;
    wallet.address = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';
    const snapshot = createPendingEvaluationSnapshot({
      transactionHash: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      candidateId: PENDING.candidate_id,
      packageUid: PENDING.package_uid,
      version: PENDING.version,
      candidateCommitSha: PENDING.candidate_commit_sha,
      evidenceUri: PENDING.evidence_uri,
      evidenceHash: PENDING.evidence_hash,
      originalStatus: 'PENDING',
      originalEvaluationAttempts: 0,
      callerAddress: wallet.address,
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      feeEstimateWei: 1n,
      submitter: PENDING.submitter,
    });
    loadEvaluationSnapshot.mockReturnValue(snapshot);
    getCandidate.mockResolvedValue(PENDING);
    renderDetail(PENDING.version);
    await screen.findByTestId('evaluation-tx-hash');
    const user = userEvent.setup();
    checkEvaluationStatus.mockResolvedValue({
      ok: false,
      phase: 'status_unknown',
      message: 'Transaction status is unknown.',
      snapshot,
      transactionHash: snapshot.transactionHash,
    });
    await user.click(screen.getByTestId('check-existing-transaction'));
    await waitFor(() => {
      expect(checkEvaluationStatus).toHaveBeenCalled();
    });
    expect(screen.getByTestId('evaluation-tx-hash')).toHaveTextContent(snapshot.transactionHash);
    expect(submitLiveEvaluation).not.toHaveBeenCalled();
  });
});
