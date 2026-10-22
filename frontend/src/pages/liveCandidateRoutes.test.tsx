import React from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { SMOKE_PACKAGE } from '../test/updateSealFixtures';
import { liveCandidateWizardPath } from '../lib/registrationValidation';

const { packageQuery } = vi.hoisted(() => ({
  packageQuery: {
    data: undefined as { packageUid: string; record: typeof SMOKE_PACKAGE } | undefined,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}));

vi.mock('../features/registry/registryQueries', () => ({
  useOnChainPackageByPublisherSlug: () => packageQuery,
  useOnChainCandidate: () => ({ data: undefined, isLoading: false, error: null }),
}));

vi.mock('../features/wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: { isConnected: false, address: null, chainId: 61997 },
    isWrongNetwork: false,
    openWalletModal: vi.fn(),
    openNetworkModal: vi.fn(),
    getEthereumProvider: async () => null,
  }),
}));

import { LiveCandidateWizardLayout } from './LiveCandidateWizardLayout';
import { LiveCandidateStep1Page } from './LiveCandidateStep1Page';
import { LiveCandidateStep2Page } from './LiveCandidateStep2Page';
import { LiveCandidateStep3Page } from './LiveCandidateStep3Page';
import { LivePackageDetailPage } from './LivePackageDetailPage';
import { CandidateStep1Page } from './CandidateStep1Page';

const identity = liveCandidateWizardPath(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug, 'identity');
const evidence = liveCandidateWizardPath(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug, 'evidence');
const confirm = liveCandidateWizardPath(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug, 'confirm');

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/packages/:publisher/:packageSlug/releases/new" element={<LiveCandidateWizardLayout />}>
            <Route index element={<Navigate to="identity" replace />} />
            <Route path="identity" element={<LiveCandidateStep1Page />} />
            <Route path="evidence" element={<LiveCandidateStep2Page />} />
            <Route path="confirm" element={<LiveCandidateStep3Page />} />
          </Route>
          <Route path="/packages/:packageId/releases/new/identity" element={<CandidateStep1Page />} />
          <Route path="/packages/:publisher/:packageSlug" element={<LivePackageDetailPage />} />
          <Route path="/registry" element={<div>registry-index</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('live candidate routes', () => {
  beforeEach(() => {
    packageQuery.data = { packageUid: SMOKE_PACKAGE.package_uid, record: SMOKE_PACKAGE };
    packageQuery.isLoading = false;
    packageQuery.error = null;
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    vi.unstubAllEnvs();
    resetUpdateSealConfigCache();
    sessionStorage.clear();
  });

  it('direct refresh on identity, evidence, and confirm loads the live package', () => {
    renderAt(identity);
    expect(screen.getByTestId('live-candidate-step-identity')).toBeInTheDocument();
    expect(screen.getAllByText(SMOKE_PACKAGE.package_uid).length).toBeGreaterThan(0);
    expect(screen.queryByText('v1.5.0-rc1')).not.toBeInTheDocument();
  });

  it('direct refresh on evidence shows preflight UI, not simulated AST claims', () => {
    renderAt(evidence);
    expect(screen.getByTestId('live-candidate-step-evidence')).toBeInTheDocument();
    expect(screen.getByText(/Evidence document preflight/i)).toBeInTheDocument();
    expect(screen.queryByText(/AST SYMBOLIC PROVER/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Simulate Violations/i)).not.toBeInTheDocument();
  });

  it('direct refresh on confirm shows live values and no mock validator claims', () => {
    renderAt(confirm);
    expect(screen.getByTestId('live-candidate-step-confirm')).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(SMOKE_PACKAGE.package_uid)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/5 \/ 5 READY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cryptographically signed by authorized key/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Atlas charter/i)).not.toBeInTheDocument();
  });

  it('blocks the confirm submit action when evidence preflight is missing', () => {
    renderAt(confirm);
    expect(screen.getByTestId('stale-evidence-preflight')).toBeInTheDocument();
    expect(screen.queryByTestId('live-submit-candidate')).not.toBeInTheDocument();
  });

  it('does not match the demo atlas wizard for a publisher/slug live path', () => {
    renderAt(identity);
    expect(screen.queryByText('CANDIDATE GIT PROVENANCE')).not.toBeInTheDocument();
    expect(screen.getByTestId('live-candidate-step-identity')).toBeInTheDocument();
  });

  it('shows a safe error in demo mode without seeding Atlas data', () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    renderAt(identity);
    expect(screen.getByTestId('live-candidate-demo-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-badge')).toHaveTextContent('DEMO DATA');
    expect(screen.queryByText(SMOKE_PACKAGE.package_uid)).not.toBeInTheDocument();
  });
});
