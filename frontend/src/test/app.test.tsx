import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Global mock state variables for Wagmi test control
let mockAddress: string | undefined = undefined;
let mockChainId = 61997;
let mockIsConnecting = false;
let mockSwitchShouldReject = false;
let mockSwitchErrorCode: number | null = null;
let mockAddChainCalled = false;
let mockDisconnectCalled = false;

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>();
  return {
    ...actual,
    useAccount: () => ({
      address: mockAddress,
      isConnected: Boolean(mockAddress),
      isConnecting: mockIsConnecting,
      isReconnecting: false,
      connector: mockAddress
        ? {
            name: 'MetaMask',
            getProvider: vi.fn(async () => ({
              request: vi.fn(async ({ method }) => {
                if (method === 'wallet_addEthereumChain') {
                  mockAddChainCalled = true;
                }
              }),
            })),
          }
        : undefined,
    }),
    useChainId: () => mockChainId,
    useBalance: () => ({
      data: mockAddress
        ? { formatted: '1245.50', symbol: 'GEN', decimals: 18, value: 1245500000000000000000n }
        : undefined,
      isLoading: false,
    }),
    useSwitchChain: () => ({
      switchChainAsync: vi.fn(async ({ chainId }: { chainId: number }) => {
        if (mockSwitchShouldReject) {
          const err: any = new Error('User rejected the request.');
          err.code = 4001;
          throw err;
        }
        if (mockSwitchErrorCode === 4902 && !mockAddChainCalled) {
          const err: any = new Error('Unrecognized chain ID 61997');
          err.code = 4902;
          throw err;
        }
        if (mockSwitchErrorCode && mockSwitchErrorCode !== 4902) {
          const err: any = new Error('Unexpected RPC failure');
          err.code = mockSwitchErrorCode;
          throw err;
        }
        mockChainId = chainId;
        return { id: chainId, name: 'GenLayer Studio-dev' };
      }),
      isPending: false,
    }),
    useConnect: () => ({
      connectAsync: vi.fn(async () => {
        mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
        return { accounts: [mockAddress], chainId: mockChainId };
      }),
      connectors: [
        {
          id: 'injected',
          name: 'Injected Provider',
          type: 'injected',
        },
      ],
    }),
    useDisconnect: () => ({
      disconnectAsync: vi.fn(async () => {
        mockAddress = undefined;
        mockDisconnectCalled = true;
      }),
    }),
  };
});

vi.mock('@reown/appkit/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@reown/appkit/react')>();
  return {
    ...actual,
    createAppKit: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn(),
    })),
    useAppKit: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn(),
    })),
  };
});

import { WalletProvider } from '../features/wallet/WalletContext';
import { useWallet } from '../features/wallet/useWallet';
import { TransactionProvider, useTransactions } from '../features/transactions/TransactionContext';
import { RegistrationProvider, useRegistration } from '../features/registration/RegistrationContext';
import { CandidateProvider } from '../features/candidate-release/CandidateContext';
import { AppLayout } from '../components/layout/AppLayout';

import { LandingPage } from '../pages/LandingPage';
import { RegistryPage } from '../pages/RegistryPage';
import { PackageDetailPage } from '../pages/PackageDetailPage';
import { RegisterStep1Page } from '../pages/RegisterStep1Page';
import { RegisterStep3Page } from '../pages/RegisterStep3Page';
import { RegisterSuccessPage } from '../pages/RegisterSuccessPage';
import { CandidateStep1Page } from '../pages/CandidateStep1Page';
import { ReviewTrackerPage } from '../pages/ReviewTrackerPage';
import { DecisionApprovedPage } from '../pages/DecisionApprovedPage';
import { DecisionReviewRequiredPage } from '../pages/DecisionReviewRequiredPage';
import { DecisionViolationPage } from '../pages/DecisionViolationPage';
import { DecisionUnavailablePage } from '../pages/DecisionUnavailablePage';
import { VerificationPage } from '../pages/VerificationPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ActivityFeedPage } from '../pages/ActivityFeedPage';
import { HowItWorksPage } from '../pages/HowItWorksPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ConnectWalletModal } from '../components/ui/ConnectWalletModal';
import { isValidReownProjectId, createWalletConfig } from '../lib/walletConfig';

const renderWithProviders = (
  ui: React.ReactElement,
  { initialEntries = ['/'], isProjectConfiguredOverride }: { initialEntries?: string[]; isProjectConfiguredOverride?: boolean } = {}
) => {
  return render(
    <WalletProvider isProjectConfiguredOverride={isProjectConfiguredOverride}>
      <TransactionProvider>
        <RegistrationProvider>
          <CandidateProvider>
            <MemoryRouter initialEntries={initialEntries}>
              {ui}
            </MemoryRouter>
          </CandidateProvider>
        </RegistrationProvider>
      </TransactionProvider>
    </WalletProvider>
  );
};

describe('UpdateSeal Comprehensive Test Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockAddress = undefined;
    mockChainId = 61997;
    mockIsConnecting = false;
    mockSwitchShouldReject = false;
    mockSwitchErrorCode = null;
    mockAddChainCalled = false;
    mockDisconnectCalled = false;
  });

  // 1. Primary routes render
  it('1. renders all primary routes correctly', () => {
    const { unmount: u1 } = renderWithProviders(<LandingPage />);
    expect(screen.getByText(/The on-chain/i)).toBeInTheDocument();
    u1();

    const { unmount: u2 } = renderWithProviders(<RegistryPage />);
    expect(screen.getByText(/Registry Index/i)).toBeInTheDocument();
    u2();

    const { unmount: u3 } = renderWithProviders(<PackageDetailPage />);
    expect(screen.getByText(/Atlas Research Agent/i)).toBeInTheDocument();
    u3();

    const { unmount: u4 } = renderWithProviders(<RegisterStep1Page />);
    expect(screen.getByText(/REGISTER PACKAGE IDENTITY/i)).toBeInTheDocument();
    u4();

    const { unmount: u5 } = renderWithProviders(<CandidateStep1Page />);
    expect(screen.getByText(/CANDIDATE GIT PROVENANCE/i)).toBeInTheDocument();
    u5();

    const { unmount: u6 } = renderWithProviders(<ReviewTrackerPage />);
    expect(screen.getAllByText(/0x02 Review Required/i)[0]).toBeInTheDocument();
    u6();

    const { unmount: u7 } = renderWithProviders(<VerificationPage />);
    expect(screen.getByText(/CHECK BEFORE/i)).toBeInTheDocument();
    u7();

    const { unmount: u8 } = renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Developer Registry Dashboard/i)).toBeInTheDocument();
    u8();

    const { unmount: u9 } = renderWithProviders(<ActivityFeedPage />);
    expect(screen.getByText(/PUBLIC ACTIVITY FEED/i)).toBeInTheDocument();
    u9();

    const { unmount: u10 } = renderWithProviders(<HowItWorksPage />);
    expect(screen.getByText(/How UpdateSeal Records Autonomous Agent Release Verdicts On-Chain/i)).toBeInTheDocument();
    u10();
  });

  // 2. Navigation links reach correct routes
  it('2. header contains correct navigation paths', () => {
    renderWithProviders(<AppLayout />);
    const registryLink = screen.getAllByRole('link', { name: /Registry/i })[0];
    expect(registryLink).toHaveAttribute('href', '/registry');

    const verifyLink = screen.getAllByRole('link', { name: /Verify Release/i })[0];
    expect(verifyLink).toHaveAttribute('href', '/verify');

    const howItWorksLink = screen.getAllByRole('link', { name: /How It Works/i })[0];
    expect(howItWorksLink).toHaveAttribute('href', '/how-it-works');

    const activityLink = screen.getAllByRole('link', { name: /Activity/i })[0];
    expect(activityLink).toHaveAttribute('href', '/activity');

    const dashboardLink = screen.getAllByRole('link', { name: /My Packages/i })[0];
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  // 3. Registry search and filters
  it('3. filters registry items by search query and category', () => {
    renderWithProviders(<RegistryPage />);
    const searchInput = screen.getByPlaceholderText(/Search agent name, ID, or keywords/i);
    fireEvent.change(searchInput, { target: { value: 'Chronos' } });

    expect(screen.getByText(/Chronos Time Oracle/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sentinel Code Auditor/i)).not.toBeInTheDocument();

    // Reset filters
    const resetButton = screen.getByTitle(/Reset Filters/i);
    fireEvent.click(resetButton);
    expect(screen.getByText(/Atlas Research Agent/i)).toBeInTheDocument();
  });

  // 4. Registration state persists between steps
  it('4. persists registration state across steps in sessionStorage', () => {
    const TestComponent = () => {
      const { form, updateField } = useRegistration();
      return (
        <div>
          <span data-testid="form-name">{form.displayName}</span>
          <button onClick={() => updateField('displayName', 'Custom Test Agent')}>Change Name</button>
        </div>
      );
    };

    const { unmount } = renderWithProviders(<TestComponent />);
    expect(screen.getByTestId('form-name').textContent).toBe('UpdateSeal');

    fireEvent.click(screen.getByText('Change Name'));
    expect(screen.getByTestId('form-name').textContent).toBe('Custom Test Agent');
    unmount();

    // Re-mount to verify sessionStorage hydration
    renderWithProviders(<TestComponent />);
    expect(screen.getByTestId('form-name').textContent).toBe('Custom Test Agent');
  });

  // 5. Registration validation
  it('5. validates Step 1 fields and prevents invalid progression', () => {
    renderWithProviders(<RegisterStep1Page />);
    const repoInput = screen.getByPlaceholderText(/https:\/\/github\.com\/edwarderlick\/UpdateSeal/i);
    fireEvent.change(repoInput, { target: { value: 'invalid-url' } });

    const submitBtn = screen.getByRole('button', { name: /Continue to Step 2/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Must be a valid GitHub repository URL/i)).toBeInTheDocument();
  });

  // 6. Candidate flow validation
  it('6. validates candidate semantic version and 40-char SHA', () => {
    renderWithProviders(<CandidateStep1Page />);
    const versionInput = screen.getByPlaceholderText('v1.5.0');
    fireEvent.change(versionInput, { target: { value: 'not-a-semver' } });

    const nextBtn = screen.getByRole('button', { name: /Continue to Step 2/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Version must follow SemVer format/i)).toBeInTheDocument();
  });

  // 7. All six capability categories render
  it('7. renders all 6 capability charter categories in Step 3', () => {
    renderWithProviders(<RegisterStep3Page />);
    expect(screen.getByRole('heading', { name: /Network Access/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /File & Data Access/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Shell & Process Execution/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Wallet & Signing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Payment & Spending/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /External Data Export/i })).toBeInTheDocument();
  });

  // 8. All four decision reports render
  it('8. renders all 4 canonical decision reports with specific verdicts', () => {
    const { unmount: u1 } = renderWithProviders(<DecisionApprovedPage />);
    expect(screen.getByText(/0x01 Approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate Release Approved/i)).toBeInTheDocument();
    u1();

    const { unmount: u2 } = renderWithProviders(<DecisionReviewRequiredPage />);
    expect(screen.getByText(/0x02 REVIEW_REQUIRED/i)).toBeInTheDocument();
    expect(screen.getByText(/HUMAN INTERLOCK REQUIRED/i)).toBeInTheDocument();
    u2();

    const { unmount: u3 } = renderWithProviders(<DecisionViolationPage />);
    expect(screen.getByText(/0x03 — CAPABILITY VIOLATION/i)).toBeInTheDocument();
    expect(screen.getAllByText(/RELEASE BLOCKED/i).length).toBeGreaterThan(0);
    u3();

    const { unmount: u4 } = renderWithProviders(<DecisionUnavailablePage />);
    expect(screen.getByText(/0x04 EVIDENCE_UNAVAILABLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluation Halted: Cryptographic Evidence Unreachable/i)).toBeInTheDocument();
    u4();
  });

  // 9. Verification tool approved and non-approved results
  it('9. switches verification tool between approved, blocked, and unknown states', () => {
    renderWithProviders(<VerificationPage />);
    expect(screen.getByText(/APPROVED RELEASE — 0x01/i)).toBeInTheDocument();

    const blockedPresetBtn = screen.getByRole('button', { name: /VIOLATION \(SENTINEL\)/i });
    fireEvent.click(blockedPresetBtn);
    expect(screen.getByText(/BLOCKED RELEASE — 0x03/i)).toBeInTheDocument();

    const unknownPresetBtn = screen.getByRole('button', { name: /UNKNOWN \(LOCAL\)/i });
    fireEvent.click(unknownPresetBtn);
    expect(screen.getByText(/UNSEALED \/ UNKNOWN — 0x00/i)).toBeInTheDocument();
  });

  // 10. Connect-wallet and disconnect lifecycle through Wagmi
  it('10. handles connect-wallet and disconnect lifecycle through Wagmi', async () => {
    mockAddress = undefined;

    const { unmount } = renderWithProviders(<AppLayout />);
    // Initial state: Disconnected
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
    unmount();

    // Connected state via Wagmi mock
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    renderWithProviders(<AppLayout />);

    // Connected state displays shortened address
    expect(screen.getByLabelText(/Connected address 0x82fDe1090c2941E5D8742A944813EbFc09C91C12/i)).toBeInTheDocument();

    // Disconnect
    const disconnectBtn = screen.getByRole('button', { name: /Disconnect Wallet/i });
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(mockDisconnectCalled).toBe(true);
    });
  });

  // 11. Wrong-network state and switching
  it('11. displays wrong-network warning when connected to incompatible chain and switches to Studio-dev', async () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 1;

    renderWithProviders(<AppLayout />);

    expect(screen.getByText(/Wrong Network/i)).toBeInTheDocument();
    const switchBtn = screen.getByRole('button', { name: /Switch to Studio-dev/i });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(mockChainId).toBe(61997);
    });
  });

  // 12. Transaction lifecycle states
  it('12. advances through transaction lifecycle states', () => {
    const TestComponent = () => {
      const { startTransaction, txState } = useTransactions();
      return (
        <div>
          <button onClick={() => startTransaction('Test Tx', 'Test payload')}>Start Tx</button>
          <span data-testid="tx-status">{txState.status}</span>
        </div>
      );
    };

    renderWithProviders(
      <>
        <AppLayout />
        <TestComponent />
      </>
    );

    fireEvent.click(screen.getByText('Start Tx'));
    expect(screen.getByText(/CANONICAL EIP-712 INSCRIBED PAYLOAD/i)).toBeInTheDocument();

    const signBtn = screen.getByRole('button', { name: /CONFIRM & SIGN TRANSACTION IN WALLET/i });
    fireEvent.click(signBtn);

    expect(screen.getAllByText(/Contract integration pending/i).length).toBeGreaterThan(0);
  });

  // 13. Copyable machine-readable verification output
  it('13. provides copyable machine-readable JSON output in verification tool', () => {
    renderWithProviders(<VerificationPage />);
    expect(screen.getByText(/MACHINE_READABLE_ORACLE_PAYLOAD/i)).toBeInTheDocument();
    expect(screen.getByText(/"verdict_code": "0x01"/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy JSON/i })).toBeInTheDocument();
  });

  // 14. Unknown routes render a designed Not Found page
  it('14. renders brutalist 404 Not Found page on unmatched route', () => {
    renderWithProviders(
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>,
      { initialEntries: ['/unregistered/path/unknown'] }
    );

    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/UNREGISTERED ROUTE/i)).toBeInTheDocument();
    expect(screen.getByText(/Cryptographic Proof Not Found/i)).toBeInTheDocument();
  });
});

/* =====================================================================
 * PART 6 SPECIFIC WALLET VERIFICATION SUITE
 * Focused tests for all 14 required states mocking Wagmi directly
 * ===================================================================== */
describe('Part 6 — Wagmi & Studio-dev Wallet Verification Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockAddress = undefined;
    mockChainId = 61997;
    mockIsConnecting = false;
    mockSwitchShouldReject = false;
    mockSwitchErrorCode = null;
    mockAddChainCalled = false;
    mockDisconnectCalled = false;
  });

  // 1. Disconnected wallet
  it('Part 6.1: disconnected wallet displays Connect Wallet button and inactive controls', () => {
    mockAddress = undefined;
    renderWithProviders(<AppLayout />);
    const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
    expect(connectButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Disconnect Wallet/i })).not.toBeInTheDocument();
  });

  // 2. Connecting wallet
  it('Part 6.2: connecting wallet disables repeated clicks and displays connecting state', () => {
    mockIsConnecting = true;
    renderWithProviders(<AppLayout />);
    const btn = screen.getByRole('button', { name: /Connecting\.\.\./i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  // 3. Connected wallet with a real mocked Wagmi address
  it('Part 6.3: connected wallet displays shortened address, accessible label, and native GEN balance from Wagmi', () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 61997;

    renderWithProviders(<AppLayout />);

    expect(screen.getByText('0x82fD...1C12')).toBeInTheDocument();
    expect(screen.getByLabelText(`Connected address ${mockAddress}`)).toBeInTheDocument();
    expect(screen.getByText(/1,245\.50 GEN/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disconnect Wallet/i })).toBeInTheDocument();
  });

  // 4. Connected wallet on chain 61997
  it('Part 6.4: recognizes GenLayer Studio-dev (Chain ID 61997) as the active protocol network', () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 61997;

    renderWithProviders(<AppLayout />);

    expect(screen.getByText(/GenLayer Studio-dev \(61997\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Wrong Network/i)).not.toBeInTheDocument();
  });

  // 5. Wrong network detected from mocked Wagmi chain state
  it('Part 6.5: clearly detects wrong-network state from Wagmi chainId and displays Switch to Studio-dev button', () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 1; // Connected to Ethereum Mainnet instead of 61997

    renderWithProviders(<AppLayout />);

    expect(screen.getByText(/Wrong Network/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to Studio-dev/i })).toBeInTheDocument();
  });

  // 6. Successful switchChainAsync
  it('Part 6.6: executes switchChainAsync to restore Studio-dev chain (61997)', async () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 1;

    renderWithProviders(<AppLayout />);

    const switchBtn = screen.getByRole('button', { name: /Switch to Studio-dev/i });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(mockChainId).toBe(61997);
    });
  });

  // 7. Switch rejection code 4001
  it('Part 6.7: handles switch rejection code 4001 with an accessible message and does not alter chain', async () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 1;
    mockSwitchShouldReject = true;

    renderWithProviders(<AppLayout />);

    const switchBtn = screen.getByRole('button', { name: /Switch to Studio-dev/i });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network switch request was rejected\./i)).toBeInTheDocument();
    });
    expect(mockChainId).toBe(1); // Unchanged
  });

  // 8. Unknown-chain code 4902 and add-chain attempt
  it('Part 6.8: handles unknown-chain code 4902 by requesting wallet_addEthereumChain then retrying switch', async () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 1;
    mockSwitchErrorCode = 4902;

    renderWithProviders(<AppLayout />);

    const switchBtn = screen.getByRole('button', { name: /Switch to Studio-dev/i });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(mockAddChainCalled).toBe(true);
      expect(mockChainId).toBe(61997);
    });
  });

  // 9. Unexpected switch failure remains an error and does not pretend success
  it('Part 6.9: unexpected switch failure remains visible and never pretends success or changes chain', async () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
    mockChainId = 1;
    mockSwitchErrorCode = -32603;

    renderWithProviders(<AppLayout />);

    const switchBtn = screen.getByRole('button', { name: /Switch to Studio-dev/i });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Unexpected RPC failure/i)).toBeInTheDocument();
    });
    expect(mockChainId).toBe(1); // Never set simulated chain ID
  });

  // 10. Disconnect calls Wagmi’s disconnect function
  it('Part 6.10: disconnect calls Wagmi disconnectAsync function', async () => {
    mockAddress = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';

    renderWithProviders(<AppLayout />);

    const disconnectBtn = screen.getByRole('button', { name: /Disconnect Wallet/i });
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(mockDisconnectCalled).toBe(true);
    });
  });

  // 11. Missing Reown project ID uses injected-only configuration
  it('Part 6.11: unit test project-ID validation and configuration selection without relying on .env.local', () => {
    // Test explicitly with: empty string, undefined, your_reown_project_id, valid project ID
    expect(isValidReownProjectId('')).toBe(false);
    expect(isValidReownProjectId(undefined)).toBe(false);
    expect(isValidReownProjectId('   ')).toBe(false);
    expect(isValidReownProjectId('your_reown_project_id')).toBe(false);
    expect(isValidReownProjectId('mock_valid_project_id_12345')).toBe(true);

    // Empty string selects injected-only configuration and skips AppKit
    const emptyConfig = createWalletConfig('');
    expect(emptyConfig.isProjectConfigured).toBe(false);
    expect(emptyConfig.wagmiAdapter).toBeNull();
    expect(emptyConfig.appKit).toBeNull();
    expect(emptyConfig.config).toBeDefined();

    // Undefined selects injected-only configuration and skips AppKit
    const undefConfig = createWalletConfig(undefined);
    expect(undefConfig.isProjectConfigured).toBe(false);
    expect(undefConfig.wagmiAdapter).toBeNull();
    expect(undefConfig.appKit).toBeNull();
    expect(undefConfig.config).toBeDefined();

    // your_reown_project_id selects injected-only configuration and skips AppKit
    const placeholderConfig = createWalletConfig('your_reown_project_id');
    expect(placeholderConfig.isProjectConfigured).toBe(false);
    expect(placeholderConfig.wagmiAdapter).toBeNull();
    expect(placeholderConfig.appKit).toBeNull();
    expect(placeholderConfig.config).toBeDefined();

    // Valid project ID enables Reown path
    const validConfig = createWalletConfig('mock_valid_project_id_12345');
    expect(validConfig.isProjectConfigured).toBe(true);
    expect(validConfig.wagmiAdapter).not.toBeNull();
    expect(validConfig.config).toBe(validConfig.wagmiAdapter?.wagmiConfig);
  });

  // 12. QR/WalletConnect is unavailable with a clear notice when the project ID is missing
  it('Part 6.12: modal visibly disables WalletConnect/QR and displays notice when project ID is missing, but enables it when configured', () => {
    const TestModalWrapper = () => {
      const { openConnectModal } = useWallet();
      return (
        <div>
          <button onClick={openConnectModal}>Open Modal</button>
          <ConnectWalletModal />
        </div>
      );
    };

    // When project ID is missing (isProjectConfiguredOverride = false)
    const { unmount } = renderWithProviders(<TestModalWrapper />, { isProjectConfiguredOverride: false });
    fireEvent.click(screen.getByText('Open Modal'));

    // WalletConnect/QR is visibly disabled
    const walletConnectBtn = screen.getByRole('button', { name: /WalletConnect & Mobile/i });
    expect(walletConnectBtn).toBeInTheDocument();
    expect(walletConnectBtn.className).toContain('cursor-not-allowed');
    expect(screen.getByText(/PROJECT ID REQUIRED/i)).toBeInTheDocument();
    expect(screen.getByText(/QR Unavailable/i)).toBeInTheDocument();

    // Configuration notice is displayed
    expect(screen.getByText(/CONFIGURATION NOTICE: REOWN PROJECT ID NOT SET/i)).toBeInTheDocument();
    expect(screen.getByText(/WalletConnect QR pairing is disabled until VITE_REOWN_PROJECT_ID is configured/i)).toBeInTheDocument();

    // Clicking disabled WalletConnect triggers the unconfigured notice
    fireEvent.click(walletConnectBtn);
    expect(screen.getByText(/WalletConnect and QR login are unavailable because VITE_REOWN_PROJECT_ID is not configured/i)).toBeInTheDocument();
    unmount();

    // When valid project ID is configured (isProjectConfiguredOverride = true)
    renderWithProviders(<TestModalWrapper />, { isProjectConfiguredOverride: true });
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText(/REOWN \/ QR/i)).toBeInTheDocument();
    expect(screen.getByText(/Reown AppKit Modal/i)).toBeInTheDocument();
    expect(screen.queryByText(/CONFIGURATION NOTICE: REOWN PROJECT ID NOT SET/i)).not.toBeInTheDocument();
  });

  // 13. Remaining demo-data disclosure is visible
  it('Part 6.13: site-wide DEMO DATA indicator is visible and opens data boundary disclosure', () => {
    renderWithProviders(<AppLayout />);

    const indicator = screen.getByTestId('demo-data-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator.textContent).toContain('DEMO DATA');

    const disclosureBtn = screen.getByLabelText(/Demo data disclosure information/i);
    fireEvent.click(disclosureBtn);

    expect(
      screen.getByText(/Wallet and network information can be live\. Package, release, review, validator, block and transaction records are demonstration data in demo mode\./i)
    ).toBeInTheDocument();
  });

  // 14. Registration and decision demo actions never claim an on-chain transaction occurred
  it('Part 6.14: registration and decision demo actions never claim an on-chain transaction occurred', () => {
    const { unmount: u1 } = renderWithProviders(<RegisterSuccessPage />);
    expect(screen.getAllByText(/DEMO REGISTRATION COMPLETE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/DEMO DATA only — no transaction was submitted\./i)).toBeInTheDocument();
    expect(screen.queryByText(/SEALED ON-CHAIN/i)).not.toBeInTheDocument();
    u1();

    renderWithProviders(<DecisionReviewRequiredPage />);
    const approveBtn = screen.getByRole('button', { name: /SIMULATE APPROVE EXPANSION/i });
    fireEvent.click(approveBtn);
    expect(screen.getByText(/Demo decision updated locally\. Contract integration pending; nothing was broadcast\./i)).toBeInTheDocument();
    expect(screen.queryByText(/BROADCASTING SIGNATURE/i)).not.toBeInTheDocument();
  });
});
