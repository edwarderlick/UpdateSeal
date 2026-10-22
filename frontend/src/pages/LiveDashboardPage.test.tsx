import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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

const wallet = {
  isConnected: false,
  address: null as string | null,
  chainId: 61997,
};
const openWalletModal = vi.fn();
const openConnectModal = vi.fn();
const openNetworkModal = vi.fn();

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
    wallet: {
      isConnected: wallet.isConnected,
      address: wallet.address,
      chainId: wallet.chainId,
    },
    walletState: {
      account: wallet.address,
      isConnected: wallet.isConnected,
      address: wallet.address,
      chainId: wallet.chainId,
    },
    isConnecting: false,
    isWrongNetwork: wallet.isConnected && wallet.chainId !== 61997,
    errorMessage: null,
    clearError: vi.fn(),
    openWalletModal,
    openConnectModal,
    openNetworkModal,
    disconnectWallet: vi.fn(),
    switchToStudioNext: vi.fn(),
    copyAddress: vi.fn(),
    viewOnExplorer: vi.fn(),
    copied: false,
    getEthereumProvider: async () => null,
  }),
}));

import { DashboardPage } from './DashboardPage';

const OFFICIAL: OnChainPackageRecord = {
  package_uid: OFFICIAL_UPDATESEAL_PACKAGE_UID,
  package_slug: 'updateseal',
  publisher: '0xb3F7518df619ef485f7a1568ED3705bB6f5B0407',
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

const OTHER: OnChainPackageRecord = {
  package_uid: '0x1111111111111111111111111111111111111111/otherpkg',
  package_slug: 'otherpkg',
  publisher: '0x1111111111111111111111111111111111111111',
  repository_url: 'https://github.com/example/other',
  baseline_commit_sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  charter_json: '{}',
  charter_hash: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  sequence: 2,
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

function seedRegistry() {
  const packages = [LEGACY, OFFICIAL, OTHER];
  getPackageCount.mockResolvedValue(packages.length);
  getPackageUidAt.mockImplementation(async (index: number) => packages[index]!.package_uid);
  getPackage.mockImplementation(async (uid: string) => packages.find((item) => item.package_uid === uid) ?? OFFICIAL);
  getCandidateCount.mockResolvedValue(1);
  getCandidateIdAt.mockResolvedValue(APPROVED.candidate_id);
  getCandidate.mockResolvedValue(APPROVED);
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('live developer dashboard', () => {
  beforeEach(() => {
    getCandidate.mockReset();
    getCandidateCount.mockReset();
    getCandidateIdAt.mockReset();
    getPackage.mockReset();
    getPackageCount.mockReset();
    getPackageUidAt.mockReset();
    getRegistrySnapshot.mockReset();
    openWalletModal.mockReset();
    openConnectModal.mockReset();
    openNetworkModal.mockReset();
    wallet.isConnected = false;
    wallet.address = null;
    wallet.chainId = 61997;
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('disconnected live dashboard does not auto-open the wallet modal or filter by address', async () => {
    renderDashboard();
    expect(await screen.findByTestId('dashboard-disconnected')).toBeInTheDocument();
    expect(openWalletModal).not.toHaveBeenCalled();
    expect(openConnectModal).not.toHaveBeenCalled();
    expect(getPackageCount).not.toHaveBeenCalled();
    expect(getRegistrySnapshot).not.toHaveBeenCalled();
  });

  it('connected wallet shows only matching publishers with case-insensitive comparison', async () => {
    wallet.isConnected = true;
    wallet.address = '0xB3F7518DF619EF485F7A1568ED3705BB6F5B0407';
    seedRegistry();
    renderDashboard();
    expect(await screen.findAllByTestId('dashboard-package-card')).toHaveLength(2);
    expect(screen.getByTestId('official-package-label')).toHaveTextContent('Official UpdateSeal package');
    expect(screen.getByTestId('legacy-smoke-label')).toHaveTextContent('Legacy smoke record');
    expect(screen.queryByText('otherpkg')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('candidate-count-label').map((node) => node.textContent)).toEqual([
      '1 candidate',
      '0 candidates',
    ]);
    expect(screen.queryByText(/2 hours ago|0xdeadbeef|gas used|revenue/i)).not.toBeInTheDocument();
  });

  it('wallet change and disconnect clear previous ownership results', async () => {
    wallet.isConnected = true;
    wallet.address = '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407';
    seedRegistry();
    const view = renderDashboard();
    expect(await screen.findByTestId('official-package-label')).toBeInTheDocument();
    wallet.address = '0x1111111111111111111111111111111111111111';
    view.rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('otherpkg')).toBeInTheDocument();
    expect(screen.queryByTestId('official-package-label')).not.toBeInTheDocument();
    wallet.isConnected = false;
    wallet.address = null;
    view.rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId('dashboard-disconnected')).toBeInTheDocument();
    expect(screen.queryByText('My Registered Packages')).not.toBeInTheDocument();
  });

  it('wrong-network state uses the existing network UI', () => {
    wallet.isConnected = true;
    wallet.address = '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407';
    wallet.chainId = 1;
    renderDashboard();
    expect(screen.getByTestId('dashboard-wrong-network')).toBeInTheDocument();
    expect(getPackageCount).not.toHaveBeenCalled();
  });

  it('empty state explains a partial scan', async () => {
    wallet.isConnected = true;
    wallet.address = '0x2222222222222222222222222222222222222222';
    getPackageCount.mockResolvedValue(25);
    getPackageUidAt.mockImplementation(async (index: number) => `0x1111111111111111111111111111111111111111/pkg-${index}`);
    getPackage.mockImplementation(async (uid: string) => ({
      ...OTHER,
      package_uid: uid,
      package_slug: uid.split('/')[1] ?? 'otherpkg',
    }));
    getCandidateCount.mockResolvedValue(0);
    renderDashboard();
    expect(await screen.findByTestId('dashboard-empty')).toBeInTheDocument();
    expect(screen.getByTestId('partial-scan-notice')).toBeInTheDocument();
  });

  it('demo mode makes zero contract-service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    renderDashboard();
    expect(screen.getByTestId('demo-dashboard-page')).toBeInTheDocument();
    await waitFor(() => {
      expect(getPackageCount).not.toHaveBeenCalled();
    });
  });

  it('invalid configuration makes zero service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'staging');
    resetUpdateSealConfigCache();
    renderDashboard();
    expect(screen.getByTestId('dashboard-config-error')).toBeInTheDocument();
    expect(getPackageCount).not.toHaveBeenCalled();
  });

  it('live RPC failure never substitutes mock records', async () => {
    wallet.isConnected = true;
    wallet.address = '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407';
    getPackageCount.mockRejectedValue(new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC failed.'));
    getCandidateCount.mockRejectedValue(new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC failed.'));
    renderDashboard();
    expect(await screen.findByTestId('dashboard-network-error', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.queryByText('Atlas Research Agent')).not.toBeInTheDocument();
  });
});
