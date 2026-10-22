import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { UpdateSealError } from '../lib/updateSealErrors';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';
import { liveCandidateDecisionPath, liveCandidateRecordPath, liveCandidateReviewPath } from '../lib/registrationValidation';

const { getPackage, getCandidate, getPackageUid, packageExists, getRegistrySnapshot } = vi.hoisted(() => ({
  getPackage: vi.fn(),
  getCandidate: vi.fn(),
  getPackageUid: vi.fn(),
  packageExists: vi.fn(),
  getRegistrySnapshot: vi.fn(),
}));

const openWalletModal = vi.fn();

vi.mock('../services/updateSealContract', () => ({
  getPackage,
  getCandidate,
  getPackageUid,
  packageExists,
  getRegistrySnapshot,
}));

vi.mock('../features/wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: { isConnected: false, address: null, chainId: 61997 },
    isConnecting: false,
    isWrongNetwork: false,
    errorMessage: null,
    clearError: vi.fn(),
    openWalletModal,
    openNetworkModal: vi.fn(),
    disconnectWallet: vi.fn(),
    switchToStudioNext: vi.fn(),
    copyAddress: vi.fn(),
    viewOnExplorer: vi.fn(),
    copied: false,
    getEthereumProvider: async () => null,
  }),
}));

import { LiveCandidateDecisionPage } from './LiveCandidateDecisionPage';
import { LiveCandidateDetailPage } from './LiveCandidateDetailPage';
import { LiveCandidateReviewPage } from './LiveCandidateReviewPage';
import { DecisionApprovedPage } from './DecisionApprovedPage';

const OFFICIAL_PACKAGE: OnChainPackageRecord = {
  package_uid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal',
  package_slug: 'updateseal',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/UpdateSeal',
  baseline_commit_sha: 'b5d498fa08949e1e0f5113fb2f9d154368dfa97c',
  charter_json: '{}',
  charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
  sequence: 1,
};

const APPROVED_CANDIDATE: OnChainCandidateRecord = {
  candidate_id: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke',
  package_uid: OFFICIAL_PACKAGE.package_uid,
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

const DECISION_PATH = liveCandidateDecisionPath(
  OFFICIAL_PACKAGE.publisher,
  OFFICIAL_PACKAGE.package_slug,
  APPROVED_CANDIDATE.version,
);
const DETAIL_PATH = liveCandidateRecordPath(
  OFFICIAL_PACKAGE.publisher,
  OFFICIAL_PACKAGE.package_slug,
  APPROVED_CANDIDATE.version,
);
const REVIEW_PATH = liveCandidateReviewPath(
  OFFICIAL_PACKAGE.publisher,
  OFFICIAL_PACKAGE.package_slug,
  APPROVED_CANDIDATE.version,
);

function seedLiveReads(candidate: OnChainCandidateRecord = APPROVED_CANDIDATE) {
  getPackageUid.mockResolvedValue(OFFICIAL_PACKAGE.package_uid);
  packageExists.mockResolvedValue(true);
  getPackage.mockResolvedValue(OFFICIAL_PACKAGE);
  getCandidate.mockResolvedValue(candidate);
}

function renderLive(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/packages/:publisher/:packageSlug/candidates/:version/decision"
            element={<LiveCandidateDecisionPage />}
          />
          <Route
            path="/packages/:publisher/:packageSlug/candidates/:version/review"
            element={<LiveCandidateReviewPage />}
          />
          <Route
            path="/packages/:publisher/:packageSlug/candidates/:version"
            element={<LiveCandidateDetailPage />}
          />
          <Route path="/decisions/approved" element={<DecisionApprovedPage />} />
          <Route path="/registry" element={<div>registry-index</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('live candidate decision reports', () => {
  beforeEach(() => {
    getPackage.mockReset();
    getCandidate.mockReset();
    getPackageUid.mockReset();
    packageExists.mockReset();
    getRegistrySnapshot.mockReset();
    openWalletModal.mockReset();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('renders the APPROVED live decision report from a direct URL', async () => {
    seedLiveReads();
    renderLive(DECISION_PATH);

    expect(await screen.findByTestId('live-decision-approved')).toBeInTheDocument();
    expect(screen.getByTestId('report-status')).toHaveTextContent('APPROVED');
    expect(screen.getByTestId('report-decision-code')).toHaveTextContent('1');
    expect(screen.getByTestId('report-summary')).toHaveTextContent('No charter violations were found');
    expect(screen.getByTestId('finding-code')).toHaveTextContent('NO_VIOLATION');
    expect(screen.getByTestId('report-attempts')).toHaveTextContent('1');
    expect(screen.getByTestId('report-decision-hash')).toHaveTextContent(
      'c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97',
    );
    expect(screen.getByTestId('report-evidence-hash')).toHaveTextContent(
      'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
    );
    expect(screen.queryByText('GenLayer Consensus in Progress')).not.toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
    expect(screen.getByTestId('report-evidence-uri')).toHaveAttribute('target', '_blank');
    expect(screen.getByTestId('report-evidence-uri')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows an unsupported-status notice for unknown on-chain statuses', async () => {
    seedLiveReads({ ...APPROVED_CANDIDATE, status: 'SEALED' });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-unsupported')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Unsupported candidate status/i })).toBeInTheDocument();
  });

  it('selects REVIEW_REQUIRED presentation from status', async () => {
    seedLiveReads({
      ...APPROVED_CANDIDATE,
      status: 'REVIEW_REQUIRED',
      decision_code: 2,
      decision_summary: 'Human review is required',
      finding_codes_json: '["CAPABILITY_EXPANSION"]',
    });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-review_required')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Human Review Required/i })).toBeInTheDocument();
    expect(screen.getByTestId('report-status')).toHaveTextContent('REVIEW_REQUIRED');
  });

  it('selects VIOLATION presentation from status', async () => {
    seedLiveReads({
      ...APPROVED_CANDIDATE,
      status: 'VIOLATION',
      decision_code: 3,
      decision_summary: 'Charter violation',
      finding_codes_json: '["FORBIDDEN_CAPABILITY"]',
    });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-violation')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Capability Violation/i })).toBeInTheDocument();
  });

  it('selects EVIDENCE_UNAVAILABLE presentation from status', async () => {
    seedLiveReads({
      ...APPROVED_CANDIDATE,
      status: 'EVIDENCE_UNAVAILABLE',
      decision_code: 4,
      decision_summary: 'Evidence could not be fetched',
      finding_codes_json: '["EVIDENCE_UNAVAILABLE"]',
    });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-evidence_unavailable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Evidence Unavailable/i })).toBeInTheDocument();
  });

  it('shows a pending report without a fabricated verdict or required decision hash', async () => {
    seedLiveReads({
      ...APPROVED_CANDIDATE,
      status: 'PENDING',
      decision_code: 0,
      decision_summary: '',
      evaluation_attempts: 0,
      finding_codes_json: '',
      decision_hash: '',
    });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-pending')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Evaluation Pending/i })).toBeInTheDocument();
    expect(screen.queryByText('APPROVED')).not.toBeInTheDocument();
    expect(screen.queryByTestId('view-decision-report')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Candidate Release Approved/i })).not.toBeInTheDocument();
  });

  it('shows an integrity error for malformed finding_codes_json without crashing', async () => {
    seedLiveReads({ ...APPROVED_CANDIDATE, finding_codes_json: 'NO_VIOLATION,OTHER' });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-integrity')).toBeInTheDocument();
    expect(screen.getByText('On-chain data integrity error')).toBeInTheDocument();
    expect(screen.getByText('NO_VIOLATION,OTHER')).toBeInTheDocument();
    expect(screen.queryByTestId('finding-codes')).not.toBeInTheDocument();
  });

  it('rejects non-array JSON and non-string finding-code entries', async () => {
    seedLiveReads({ ...APPROVED_CANDIDATE, finding_codes_json: '{"code":"NO_VIOLATION"}' });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-integrity')).toBeInTheDocument();
  });

  it('shows an integrity error for uppercase, missing, or short decision hashes', async () => {
    seedLiveReads({
      ...APPROVED_CANDIDATE,
      decision_hash: 'C69CA06AA7F3B679600751DF1FB7F6F11F1BCF1EC4E69E7173E5E45FFFA80F97',
    });
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-integrity')).toBeInTheDocument();
  });

  it('never substitutes demo decision copy when the live RPC read fails', async () => {
    getPackageUid.mockRejectedValue(new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC failed.'));
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-error', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(screen.queryByText('Candidate Release Approved (Demo Record)')).not.toBeInTheDocument();
    expect(screen.queryByText('atlas-research-agent')).not.toBeInTheDocument();
  });

  it('makes zero contract-service calls in demo mode', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-demo-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-badge')).toHaveTextContent('DEMO DATA');
    await waitFor(() => {
      expect(getPackageUid).not.toHaveBeenCalled();
    });
    expect(getPackage).not.toHaveBeenCalled();
    expect(getCandidate).not.toHaveBeenCalled();
    expect(getRegistrySnapshot).not.toHaveBeenCalled();
  });

  it('makes zero service calls when configuration is invalid', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'staging');
    resetUpdateSealConfigCache();
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-config-error')).toBeInTheDocument();
    await waitFor(() => {
      expect(getCandidate).not.toHaveBeenCalled();
    });
    expect(getPackageUid).not.toHaveBeenCalled();
    expect(getPackage).not.toHaveBeenCalled();
  });

  it('does not open the wallet modal when loading a public report', async () => {
    seedLiveReads();
    renderLive(DECISION_PATH);
    expect(await screen.findByTestId('live-decision-report')).toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
  });

  it('shows parsed findings, the full decision hash, and a report CTA on the live candidate record', async () => {
    seedLiveReads();
    renderLive(DETAIL_PATH);
    expect(await screen.findByTestId('live-candidate-detail')).toBeInTheDocument();
    expect(screen.getByTestId('finding-code')).toHaveTextContent('NO_VIOLATION');
    expect(screen.getByTestId('detail-decision-hash')).toHaveTextContent(
      'c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97',
    );
    const cta = screen.getByTestId('view-decision-report');
    expect(cta).toHaveAttribute('href', DECISION_PATH);
    expect(screen.queryByTestId('evaluation-pending')).not.toBeInTheDocument();
  });

  it('shows Evaluation Pending on the live candidate record without a completed-report CTA', async () => {
    seedLiveReads({
      ...APPROVED_CANDIDATE,
      status: 'PENDING',
      decision_code: 0,
      decision_summary: '',
      evaluation_attempts: 0,
      finding_codes_json: '[]',
      decision_hash: '',
    });
    renderLive(DETAIL_PATH);
    expect(await screen.findByTestId('evaluation-pending')).toBeInTheDocument();
    expect(screen.queryByTestId('view-decision-report')).not.toBeInTheDocument();
  });

  it('routes an APPROVED live review path to the decision report instead of a stale pending tracker', async () => {
    seedLiveReads();
    renderLive(REVIEW_PATH);
    expect(await screen.findByTestId('live-decision-approved')).toBeInTheDocument();
    expect(screen.queryByText('GenLayer Consensus in Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo preview')).not.toBeInTheDocument();
  });
});
