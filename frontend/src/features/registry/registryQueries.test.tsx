import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetUpdateSealConfigCache } from '../../lib/updateSealConfig';
import { SMOKE_PACKAGE, SAMPLE_CANDIDATE } from '../../test/updateSealFixtures';

const { getPackage, getCandidate, getPackageUid, packageExists, getRegistrySnapshot } = vi.hoisted(() => ({
  getPackage: vi.fn(),
  getCandidate: vi.fn(),
  getPackageUid: vi.fn(),
  packageExists: vi.fn(),
  getRegistrySnapshot: vi.fn(),
}));

vi.mock('../../services/updateSealContract', () => ({
  getPackage,
  getCandidate,
  getPackageUid,
  packageExists,
  getRegistrySnapshot,
}));

import {
  useOnChainCandidate,
  useOnChainPackage,
  useOnChainPackageByPublisherSlug,
  useRegistrySnapshot,
} from './registryQueries';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function resetServiceMocks() {
  getPackage.mockReset();
  getCandidate.mockReset();
  getPackageUid.mockReset();
  packageExists.mockReset();
  getRegistrySnapshot.mockReset();
}

describe('live query hook isolation', () => {
  beforeEach(() => {
    resetServiceMocks();
    resetUpdateSealConfigCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('disables useOnChainPackage in demo mode with zero service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    const { result } = renderHook(() => useOnChainPackage(SMOKE_PACKAGE.package_uid), { wrapper });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(result.current.isFetching).toBe(false);
    expect(getPackage).not.toHaveBeenCalled();
  });

  it('disables useOnChainCandidate in demo mode with zero service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    const { result } = renderHook(() => useOnChainCandidate(SAMPLE_CANDIDATE.candidate_id), { wrapper });
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(getCandidate).not.toHaveBeenCalled();
  });

  it('disables useOnChainPackageByPublisherSlug in demo mode with zero service calls', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    const { result } = renderHook(
      () => useOnChainPackageByPublisherSlug(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle');
    });
    expect(getPackageUid).not.toHaveBeenCalled();
    expect(packageExists).not.toHaveBeenCalled();
    expect(getPackage).not.toHaveBeenCalled();
  });

  it('makes zero RPC/service calls when configuration is invalid', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'staging');
    resetUpdateSealConfigCache();
    const { result } = renderHook(
      () => {
        const snapshot = useRegistrySnapshot();
        const pkg = useOnChainPackage(SMOKE_PACKAGE.package_uid);
        const candidate = useOnChainCandidate(SAMPLE_CANDIDATE.candidate_id);
        const bySlug = useOnChainPackageByPublisherSlug(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug);
        return { snapshot, pkg, candidate, bySlug };
      },
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.snapshot.fetchStatus).toBe('idle');
      expect(result.current.pkg.fetchStatus).toBe('idle');
      expect(result.current.candidate.fetchStatus).toBe('idle');
      expect(result.current.bySlug.fetchStatus).toBe('idle');
    });
    expect(getRegistrySnapshot).not.toHaveBeenCalled();
    expect(getPackage).not.toHaveBeenCalled();
    expect(getCandidate).not.toHaveBeenCalled();
    expect(getPackageUid).not.toHaveBeenCalled();
    expect(packageExists).not.toHaveBeenCalled();
  });

  it('live mode still loads the deployed package', async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
    getPackage.mockResolvedValue(SMOKE_PACKAGE);
    const { result } = renderHook(() => useOnChainPackage(SMOKE_PACKAGE.package_uid), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(getPackage).toHaveBeenCalledTimes(1);
    expect(getPackage).toHaveBeenCalledWith(SMOKE_PACKAGE.package_uid);
    expect(result.current.data).toEqual(SMOKE_PACKAGE);
  });
});
