import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegistrationProvider } from '../features/registration/RegistrationContext';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';

const registerPackageFn = vi.fn();

vi.mock('../services/updateSealWrites', () => ({
  registerPackage: (...args: unknown[]) => registerPackageFn(...args),
  waitForExistingRegistration: vi.fn(),
}));

vi.mock('../features/wallet/useWallet', () => ({
  useWallet: () => ({
    wallet: {
      isConnected: true,
      address: '0x82fDe1090c2941E5D8742A944813EbFc09C91C12',
      chainId: 61997,
    },
    isWrongNetwork: false,
    openWalletModal: vi.fn(),
    openNetworkModal: vi.fn(),
    getEthereumProvider: vi.fn(async () => ({ request: vi.fn() })),
  }),
}));

import { RegisterStep4Page } from './RegisterStep4Page';

describe('RegisterStep4Page demo isolation', () => {
  beforeEach(() => {
    registerPackageFn.mockReset();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('keeps demo registration local and never calls the write service', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <RegistrationProvider>
          <MemoryRouter>
            <RegisterStep4Page />
          </MemoryRouter>
        </RegistrationProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('demo-registration-banner')).toHaveTextContent('DEMO DATA');
    fireEvent.click(screen.getByTestId('register-package-submit'));
    expect(screen.getByTestId('demo-registration-notice')).toBeInTheDocument();
    expect(registerPackageFn).not.toHaveBeenCalled();
  });
});
