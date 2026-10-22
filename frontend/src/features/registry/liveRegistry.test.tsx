import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletProvider } from '../wallet/WalletContext';
import { RegistryPage } from '../../pages/RegistryPage';
import { resetUpdateSealConfigCache } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import { makeSnapshot, SMOKE_PACKAGE } from '../../test/updateSealFixtures';

const { snapshotQuery } = vi.hoisted(() => ({
  snapshotQuery: {
    data: undefined as ReturnType<typeof makeSnapshot> | undefined,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
}));

vi.mock('./registryQueries', () => ({
  useRegistrySnapshot: () => snapshotQuery,
}));

vi.mock('@reown/appkit/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@reown/appkit/react')>();
  return {
    ...actual,
    createAppKit: vi.fn(() => ({ open: vi.fn(), close: vi.fn() })),
    useAppKit: vi.fn(() => ({ open: vi.fn(), close: vi.fn() })),
  };
});

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>();
  return {
    ...actual,
    useAccount: () => ({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      connector: undefined,
    }),
    useChainId: () => 61997,
    useBalance: () => ({ data: undefined, isLoading: false }),
    useSwitchChain: () => ({ switchChainAsync: vi.fn(), isPending: false }),
    useConnect: () => ({ connectAsync: vi.fn(), connectors: [] }),
    useDisconnect: () => ({ disconnectAsync: vi.fn() }),
  };
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function renderLiveRegistry() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/registry']}>
          <Routes>
            <Route
              path="/registry"
              element={
                <>
                  <RegistryPage />
                  <LocationProbe />
                </>
              }
            />
            <Route path="/packages/:publisher/:packageSlug" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </WalletProvider>,
  );
}

function setLiveMode() {
  vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
  resetUpdateSealConfigCache();
}

function setDemoMode() {
  vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
  resetUpdateSealConfigCache();
}

describe('Live registry page', () => {
  beforeEach(() => {
    snapshotQuery.data = undefined;
    snapshotQuery.isLoading = false;
    snapshotQuery.error = null;
    snapshotQuery.refetch = vi.fn();
    setLiveMode();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('17. shows a loading skeleton while the live snapshot is fetching', () => {
    snapshotQuery.isLoading = true;
    renderLiveRegistry();
    expect(screen.getByTestId('live-registry-loading')).toBeInTheDocument();
  });

  it('18. shows an honest RPC error with Retry and never mock records', () => {
    snapshotQuery.error = new UpdateSealError(
      'RPC_UNAVAILABLE',
      'Studio-dev RPC is unavailable. The registry could not be read.',
    );
    renderLiveRegistry();
    expect(screen.getByTestId('live-registry-error')).toBeInTheDocument();
    expect(screen.getByText(/Studio-dev RPC is unavailable/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(snapshotQuery.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Atlas Research Agent/i)).not.toBeInTheDocument();
  });

  it('19. shows an empty live state when package_count is zero', () => {
    snapshotQuery.data = makeSnapshot({
      packageCount: 0,
      packages: Object.freeze([]),
    });
    renderLiveRegistry();
    expect(screen.getByTestId('live-registry-empty')).toBeInTheDocument();
    expect(screen.getByText(/package_count is 0/i)).toBeInTheDocument();
    expect(screen.queryByText(/Atlas Research Agent/i)).not.toBeInTheDocument();
  });

  it('20. renders the smoke-test package without an APPROVED label', () => {
    snapshotQuery.data = makeSnapshot();
    renderLiveRegistry();
    expect(screen.getByTestId('live-package-card-updateseal-smoke')).toBeInTheDocument();
    expect(screen.getByText('updateseal-smoke')).toBeInTheDocument();
    expect(screen.getByText(/REGISTERED • NO CANDIDATE/i)).toBeInTheDocument();
    expect(screen.queryByText(/^APPROVED$/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('live-package-count')).toHaveTextContent('1');
    expect(screen.getByTestId('live-candidate-count')).toHaveTextContent('0');
  });

  it('21. does not require a wallet connection for live reads', () => {
    snapshotQuery.data = makeSnapshot();
    renderLiveRegistry();
    expect(screen.getByText('updateseal-smoke')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/CONNECT OPERATOR KEY/i)).not.toBeInTheDocument();
  });

  it('22. renders the LIVE • STUDIO-DEV badge', () => {
    snapshotQuery.data = makeSnapshot();
    renderLiveRegistry();
    expect(screen.getAllByTestId('data-mode-badge')[0]).toHaveTextContent('LIVE • STUDIO-DEV');
  });

  it('23. demo mode still uses only mock data', () => {
    setDemoMode();
    snapshotQuery.data = makeSnapshot();
    render(
      <MemoryRouter>
        <RegistryPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Atlas Research Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Registry Index \(Demo data\)/i)).toBeInTheDocument();
    expect(screen.queryByText('updateseal-smoke')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('data-mode-badge')[0]).toHaveTextContent('DEMO DATA');
  });

  it('24. live mode never falls back to mocks after an RPC failure', () => {
    snapshotQuery.error = new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC is unavailable.');
    renderLiveRegistry();
    expect(screen.getByTestId('live-registry-error')).toBeInTheDocument();
    expect(screen.queryByText(/36 Agents/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Atlas Research Agent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Most Starred/i)).not.toBeInTheDocument();
  });

  it('25. live cards link to the publisher-scoped package route', () => {
    snapshotQuery.data = makeSnapshot();
    renderLiveRegistry();
    fireEvent.click(screen.getByTestId('live-package-card-updateseal-smoke'));
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      `/packages/${SMOKE_PACKAGE.publisher}/${SMOKE_PACKAGE.package_slug}`,
    );
  });

  it('shows a visible configuration error for an unknown data mode', () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'staging');
    resetUpdateSealConfigCache();
    render(
      <MemoryRouter>
        <RegistryPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Configuration Error/i)).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-badge')).toHaveTextContent('CONFIG ERROR');
  });
});
