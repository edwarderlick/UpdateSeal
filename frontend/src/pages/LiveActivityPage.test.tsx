import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { UpdateSealError } from '../lib/updateSealErrors';
import { OFFICIAL_UPDATESEAL_PACKAGE_UID } from '../lib/registryLabels';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';

const {
  getCandidate,
  getCandidateCount,
  getCandidateIdAt,
  getPackage,
  getPackageCount,
  getPackageUidAt,
  getRegistrySnapshot,
} = vi.hoisted(() => ({
  getCandidate: vi.fn(),
  getCandidateCount: vi.fn(),
  getCandidateIdAt: vi.fn(),
  getPackage: vi.fn(),
  getPackageCount: vi.fn(),
  getPackageUidAt: vi.fn(),
  getRegistrySnapshot: vi.fn(),
}));

const openWalletModal = vi.fn();

vi.mock('../services/updateSealContract', async () => {
  const actual = await vi.importActual<typeof import('../services/updateSealContract')>(
    '../services/updateSealContract',
  );
  return {
    ...actual,
    getCandidate,
    getCandidateCount,
    getCandidateIdAt,
    getPackage,
    getPackageCount,
    getPackageUidAt,
    getRegistrySnapshot,
  };
});

vi.mock('../features/wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: { isConnected: false, address: null, chainId: 61997 },
    isConnecting: false,
    isWrongNetwork: false,
    errorMessage: null,
    clearError: vi.fn(),
    openWalletModal,
    openConnectModal: vi.fn(),
    openNetworkModal: vi.fn(),
    disconnectWallet: vi.fn(),
    switchToStudioNext: vi.fn(),
    copyAddress: vi.fn(),
    viewOnExplorer: vi.fn(),
    copied: false,
    getEthereumProvider: async () => null,
  }),
}));

import { ActivityFeedPage } from './ActivityFeedPage';

const OFFICIAL: OnChainPackageRecord = {
  package_uid: OFFICIAL_UPDATESEAL_PACKAGE_UID,
  package_slug: 'updateseal',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/UpdateSeal',
  baseline_commit_sha: 'b5d498fa08949e1e0f5113fb2f9d154368dfa97c',
  charter_json: '{}',
  charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
  sequence: 1,
};

const LEGACY: OnChainPackageRecord = {
  package_uid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal-v2-e2e',
  package_slug: 'updateseal-v2-e2e',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/Provider-Court',
  baseline_commit_sha: '3f278c3f80a657950873c26145ab1ef867d40af5',
  charter_json: '{}',
  charter_hash: '69591b822164cdc2aa5015e5acdc140f4271c7642d00bc7526b969e5d5705270',
  sequence: 0,
};

const APPROVED: OnChainCandidateRecord = {
  candidate_id: `${OFFICIAL_UPDATESEAL_PACKAGE_UID}@0.1.0-v2-smoke`,
  package_uid: OFFICIAL_UPDATESEAL_PACKAGE_UID,
  version: '0.1.0-v2-smoke',
  candidate_commit_sha: 'd097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f',
  evidence_uri: 'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/d097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f/evidence/evidence-v2.json',
  evidence_hash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  submitter: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  status: 'APPROVED',
  decision_code: 1,
  decision_summary: 'No charter violations were found',
  evaluation_attempts: 1,
  finding_codes_json: '["NO_VIOLATION"]',
  decision_hash: 'c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97',
};

const PENDING: OnChainCandidateRecord = {
  ...APPROVED,
  candidate_id: `${OFFICIAL_UPDATESEAL_PACKAGE_UID}@0.1.1-pending`,
  version: '0.1.1-pending',
  status: 'PENDING',
  decision_code: 0,
  decision_summary: '',
  evaluation_attempts: 0,
  finding_codes_json: '',
  decision_hash: '',
};

function renderActivity() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/activity']}>
        <Routes>
          <Route path="/activity" element={<ActivityFeedPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('live public activity', () => {
  beforeEach(() => {
    getCandidate.mockReset();
    getCandidateCount.mockReset();
    getCandidateIdAt.mockReset();
    getPackage.mockReset();
    getPackageCount.mockReset();
    getPackageUidAt.mockReset();
    getRegistrySnapshot.mockReset();
    openWalletModal.mockReset();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
    getPackageCount.mockResolvedValue(2);
    getPackageUidAt.mockImplementation(async (index: number) => (index === 0 ? LEGACY.package_uid : OFFICIAL.package_uid));
    getPackage.mockImplementation(async (uid: string) => (uid === LEGACY.package_uid ? LEGACY : OFFICIAL));
    getCandidateCount.mockResolvedValue(2);
    getCandidateIdAt.mockImplementation(async (index: number) =>
      index === 0 ? PENDING.candidate_id : APPROVED.candidate_id,
    );
    getCandidate.mockImplementation(async (id: string) => (id === PENDING.candidate_id ? PENDING : APPROVED));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('requires no wallet and does not open the wallet modal', async () => {
    renderActivity();
    expect(await screen.findByTestId('live-activity-page')).toBeInTheDocument();
    expect(screen.getByTestId('activity-snapshot-explainer')).toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
  });

  it('orders package and candidate records by descending registry index in separate sections', async () => {
    renderActivity();
    const packages = await screen.findAllByTestId('package-activity-card');
    expect(packages.map((node) => node.getAttribute('data-registry-index'))).toEqual(['1', '0']);
    const candidates = screen.getAllByTestId('candidate-activity-card');
    expect(candidates.map((node) => node.getAttribute('data-registry-index'))).toEqual(['1', '0']);
    expect(screen.getByRole('heading', { name: 'Package registrations' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Candidate records' })).toBeInTheDocument();
    expect(screen.queryByText(/unified chronology|2 hours ago|tx hash/i)).not.toBeInTheDocument();
  });

  it('renders CANDIDATE SUBMITTED and CANDIDATE DECIDED with a live decision link', async () => {
    renderActivity();
    expect(await screen.findByText('CANDIDATE SUBMITTED')).toBeInTheDocument();
    expect(screen.getByText('CANDIDATE DECIDED')).toBeInTheDocument();
    const decision = screen.getByTestId('activity-decision-link');
    expect(decision).toHaveAttribute(
      'href',
      '/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.1.0-v2-smoke/decision',
    );
  });

  it('filters and searches loaded records without extra RPC calls', async () => {
    renderActivity();
    await screen.findAllByTestId('package-activity-card');
    const calls = getPackageCount.mock.calls.length + getCandidateCount.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.queryByTestId('package-activity-section')).not.toBeInTheDocument();
    expect(screen.getByText('CANDIDATE SUBMITTED')).toBeInTheDocument();
    expect(screen.queryByText('CANDIDATE DECIDED')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.change(screen.getByLabelText('Search loaded public fields'), {
      target: { value: 'updateseal-v2-e2e' },
    });
    expect(screen.getByText('updateseal-v2-e2e')).toBeInTheDocument();
    expect(screen.queryByText('CANDIDATE DECIDED')).not.toBeInTheDocument();
    expect(getPackageCount.mock.calls.length + getCandidateCount.mock.calls.length).toBe(calls);
  });

  it('malformed finding codes create an integrity card without crashing other records', async () => {
    getCandidate.mockImplementation(async (id: string) => {
      if (id === PENDING.candidate_id) {
        return { ...PENDING, finding_codes_json: 'not-json' };
      }
      return APPROVED;
    });
    renderActivity();
    expect(await screen.findByTestId('integrity-record-card')).toBeInTheDocument();
    expect(screen.getByText('CANDIDATE DECIDED')).toBeInTheDocument();
  });

  it('demo activity makes zero contract-service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    renderActivity();
    expect(screen.getByTestId('demo-activity-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(getPackageCount).not.toHaveBeenCalled();
    });
  });

  it('invalid configuration makes zero service calls', () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'staging');
    resetUpdateSealConfigCache();
    renderActivity();
    expect(screen.getByTestId('activity-config-error')).toBeInTheDocument();
    expect(getPackageCount).not.toHaveBeenCalled();
  });

  it('live RPC failure never substitutes mock records', async () => {
    getPackageCount.mockRejectedValue(new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC failed.'));
    getCandidateCount.mockRejectedValue(new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC failed.'));
    renderActivity();
    expect(await screen.findByTestId('activity-network-error', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.queryByText(/DEMO ACTIVITY STREAM/i)).not.toBeInTheDocument();
  });
});
