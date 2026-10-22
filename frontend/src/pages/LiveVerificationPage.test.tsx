import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { UpdateSealError } from '../lib/updateSealErrors';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';

const { candidateExists, getCandidate, getCandidateId, getPackage, getPackageUid, packageExists, getRegistrySnapshot } =
  vi.hoisted(() => ({
    candidateExists: vi.fn(),
    getCandidate: vi.fn(),
    getCandidateId: vi.fn(),
    getPackage: vi.fn(),
    getPackageUid: vi.fn(),
    packageExists: vi.fn(),
    getRegistrySnapshot: vi.fn(),
  }));

const openWalletModal = vi.fn();
const fetchSpy = vi.fn();

vi.mock('../services/updateSealContract', async () => {
  const actual = await vi.importActual<typeof import('../services/updateSealContract')>(
    '../services/updateSealContract',
  );
  return {
    ...actual,
    candidateExists,
    getCandidate,
    getCandidateId,
    getPackage,
    getPackageUid,
    packageExists,
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
    openNetworkModal: vi.fn(),
    disconnectWallet: vi.fn(),
    switchToStudioNext: vi.fn(),
    copyAddress: vi.fn(),
    viewOnExplorer: vi.fn(),
    copied: false,
    getEthereumProvider: async () => null,
  }),
}));

import { VerificationPage } from './VerificationPage';

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

const APPROVED: OnChainCandidateRecord = {
  candidate_id: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke',
  package_uid: PACKAGE.package_uid,
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

const QUERY = `/verify?candidate=${encodeURIComponent(APPROVED.candidate_id)}`;

function renderVerify(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/verify" element={<VerificationPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('live public verification tool', () => {
  beforeEach(() => {
    candidateExists.mockReset();
    getCandidate.mockReset();
    getCandidateId.mockReset();
    getPackage.mockReset();
    getPackageUid.mockReset();
    packageExists.mockReset();
    getRegistrySnapshot.mockReset();
    openWalletModal.mockReset();
    fetchSpy.mockReset();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('invalid input produces zero service calls', async () => {
    renderVerify('/verify?candidate=not-valid');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await waitFor(() => {
      expect(candidateExists).not.toHaveBeenCalled();
    });
    expect(getCandidate).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('loads a shareable candidate query and does not fetch evidence automatically', async () => {
    candidateExists.mockResolvedValue(true);
    getCandidate.mockResolvedValue(APPROVED);
    getPackage.mockResolvedValue(PACKAGE);
    renderVerify(QUERY);
    expect(await screen.findByRole('heading', { name: 'VERIFIED — APPROVED' })).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-badge')).toHaveTextContent('LIVE • STUDIO-DEV');
    expect(screen.getByTestId('verify-decision-code')).toHaveTextContent('1');
    expect(screen.getByTestId('decision-hash-verified')).toHaveTextContent('Decision hash verified');
    expect(screen.getByLabelText('Copy verification link')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(openWalletModal).not.toHaveBeenCalled();
  });

  it('never opens the wallet modal', async () => {
    candidateExists.mockResolvedValue(true);
    getCandidate.mockResolvedValue(APPROVED);
    getPackage.mockResolvedValue(PACKAGE);
    renderVerify(QUERY);
    expect(await screen.findByTestId('live-verify-result')).toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
  });

  it('live RPC failure never falls back to mock data', async () => {
    candidateExists.mockRejectedValue(new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC failed.'));
    renderVerify(QUERY);
    expect(await screen.findByTestId('live-verify-network-error', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.queryByText('atlas-protocol/research-agent')).not.toBeInTheDocument();
    expect(screen.queryByText('SAFE TO TREAT AS THE REGISTRY')).not.toBeInTheDocument();
  });

  it('demo mode makes zero contract-service calls and keeps DEMO DATA', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    renderVerify('/verify');
    expect(screen.getByTestId('demo-verification-page')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-badge')).toHaveTextContent('DEMO DATA');
    await waitFor(() => {
      expect(getCandidate).not.toHaveBeenCalled();
    });
    expect(candidateExists).not.toHaveBeenCalled();
    expect(getRegistrySnapshot).not.toHaveBeenCalled();
  });

  it('invalid configuration makes zero service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'staging');
    resetUpdateSealConfigCache();
    renderVerify(QUERY);
    expect(screen.getByTestId('verify-config-error')).toBeInTheDocument();
    await waitFor(() => {
      expect(getCandidate).not.toHaveBeenCalled();
    });
    expect(candidateExists).not.toHaveBeenCalled();
  });

  it('submitting a candidate ID writes the shareable query', async () => {
    candidateExists.mockResolvedValue(true);
    getCandidate.mockResolvedValue(APPROVED);
    getPackage.mockResolvedValue(PACKAGE);
    renderVerify('/verify');
    fireEvent.change(screen.getByLabelText('Candidate ID'), {
      target: { value: APPROVED.candidate_id },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify release/i }));
    expect(await screen.findByRole('heading', { name: 'VERIFIED — APPROVED' })).toBeInTheDocument();
    expect(screen.getByLabelText('Copy verification link')).toBeInTheDocument();
  });
});
