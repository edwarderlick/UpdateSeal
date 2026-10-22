import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { UpdateSealError } from '../lib/updateSealErrors';
import { SMOKE_PACKAGE } from '../test/updateSealFixtures';

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
}));

import { LivePackageDetailPage } from './LivePackageDetailPage';

const LIVE_PATH = `/packages/${SMOKE_PACKAGE.publisher}/${SMOKE_PACKAGE.package_slug}`;

function renderLivePackage(path = LIVE_PATH) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/packages/:publisher/:packageSlug" element={<LivePackageDetailPage />} />
        <Route path="/packages/:packageId" element={<div>demo-package-route</div>} />
        <Route path="/registry" element={<div>registry-index</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LivePackageDetailPage', () => {
  beforeEach(() => {
    packageQuery.data = undefined;
    packageQuery.isLoading = false;
    packageQuery.error = null;
    packageQuery.refetch = vi.fn();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
  });

  afterEach(() => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    vi.unstubAllEnvs();
    resetUpdateSealConfigCache();
  });

  it('25. matches the publisher-scoped live route instead of the demo slug route', () => {
    packageQuery.data = { packageUid: SMOKE_PACKAGE.package_uid, record: SMOKE_PACKAGE };
    renderLivePackage();
    expect(screen.queryByText('demo-package-route')).not.toBeInTheDocument();
    expect(screen.getAllByText('updateseal-smoke').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'updateseal-smoke' })).toBeInTheDocument();
  });

  it('adds a Submit candidate action to the live package page', () => {
    packageQuery.data = { packageUid: SMOKE_PACKAGE.package_uid, record: SMOKE_PACKAGE };
    renderLivePackage();
    const action = screen.getByTestId('submit-candidate-action');
    expect(action).toHaveAttribute(
      'href',
      `/packages/${SMOKE_PACKAGE.publisher}/${SMOKE_PACKAGE.package_slug}/releases/new/identity`,
    );
  });

  it('26. shows an on-chain not-found state with a registry link', () => {
    packageQuery.error = new UpdateSealError(
      'CONTRACT_NOT_FOUND',
      'No package is registered for this publisher and slug.',
    );
    renderLivePackage(`/packages/${SMOKE_PACKAGE.publisher}/missing-slug`);
    expect(screen.getByTestId('live-package-not-found')).toBeInTheDocument();
    expect(screen.getByText(/Package Not Found On-Chain/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Back to registry/i));
    expect(screen.getByText('registry-index')).toBeInTheDocument();
  });

  it('27. renders the frozen charter from the on-chain record', () => {
    packageQuery.data = { packageUid: SMOKE_PACKAGE.package_uid, record: SMOKE_PACKAGE };
    renderLivePackage();
    expect(screen.getByText(SMOKE_PACKAGE.package_uid)).toBeInTheDocument();
    expect(screen.getAllByText(SMOKE_PACKAGE.publisher).length).toBeGreaterThan(0);
    expect(screen.getByText(SMOKE_PACKAGE.baseline_commit_sha)).toBeInTheDocument();
    expect(screen.getAllByText(SMOKE_PACKAGE.charter_hash).length).toBeGreaterThan(0);
    expect(screen.getByText(/Frozen Charter v1/i)).toBeInTheDocument();
    expect(screen.getByText(/Smoke-test charter for UpdateSealRegistry/i)).toBeInTheDocument();
    expect(screen.getByText('network_egress')).toBeInTheDocument();
    expect(screen.getByText('process_execution')).toBeInTheDocument();
    expect(
      screen.getByText(/Wallet registration identifies the publisher address\. GitHub repository ownership is not yet verified\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/validator/i)).not.toBeInTheDocument();
  });

  it('shows a bounded charter parse error with the stored hash', () => {
    packageQuery.data = {
      packageUid: SMOKE_PACKAGE.package_uid,
      record: { ...SMOKE_PACKAGE, charter_json: '{bad' },
    };
    renderLivePackage();
    expect(screen.getByTestId('charter-parse-error')).toBeInTheDocument();
    expect(screen.getAllByText(SMOKE_PACKAGE.charter_hash).length).toBeGreaterThan(0);
  });
});
