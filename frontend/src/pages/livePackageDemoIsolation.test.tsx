import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { SMOKE_PACKAGE } from '../test/updateSealFixtures';

const { getPackage, getCandidate, getPackageUid, packageExists, getRegistrySnapshot } = vi.hoisted(() => ({
  getPackage: vi.fn(),
  getCandidate: vi.fn(),
  getPackageUid: vi.fn(),
  packageExists: vi.fn(),
  getRegistrySnapshot: vi.fn(),
}));

vi.mock('../services/updateSealContract', () => ({
  getPackage,
  getCandidate,
  getPackageUid,
  packageExists,
  getRegistrySnapshot,
}));

import { LivePackageDetailPage } from './LivePackageDetailPage';

const LIVE_PATH = `/packages/${SMOKE_PACKAGE.publisher}/${SMOKE_PACKAGE.package_slug}`;

function renderDirectLiveRoute() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[LIVE_PATH]}>
        <Routes>
          <Route path="/packages/:publisher/:packageSlug" element={<LivePackageDetailPage />} />
          <Route path="/registry" element={<div>registry-index</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('direct live package route isolation', () => {
  beforeEach(() => {
    getPackage.mockReset();
    getCandidate.mockReset();
    getPackageUid.mockReset();
    packageExists.mockReset();
    getRegistrySnapshot.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('makes zero contract-service calls and shows the demo-safe state', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    renderDirectLiveRoute();

    expect(screen.getByTestId('live-package-demo-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-badge')).toHaveTextContent('DEMO DATA');
    expect(screen.getByText('Live package routes are unavailable in demo mode.')).toBeInTheDocument();
    expect(screen.queryByText(/Frozen Charter/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'updateseal-smoke' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getPackageUid).not.toHaveBeenCalled();
    });
    expect(packageExists).not.toHaveBeenCalled();
    expect(getPackage).not.toHaveBeenCalled();
    expect(getCandidate).not.toHaveBeenCalled();
    expect(getRegistrySnapshot).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Back to registry/i));
    expect(screen.getByText('registry-index')).toBeInTheDocument();
  });

  it('live mode still loads the deployed package through the publisher-scoped route', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
    getPackageUid.mockResolvedValue(SMOKE_PACKAGE.package_uid);
    packageExists.mockResolvedValue(true);
    getPackage.mockResolvedValue(SMOKE_PACKAGE);

    renderDirectLiveRoute();

    expect(await screen.findByRole('heading', { name: 'updateseal-smoke' })).toBeInTheDocument();
    expect(screen.getByText(SMOKE_PACKAGE.package_uid)).toBeInTheDocument();
    expect(getPackageUid).toHaveBeenCalledTimes(1);
    expect(packageExists).toHaveBeenCalledTimes(1);
    expect(getPackage).toHaveBeenCalledTimes(1);
  });
});
