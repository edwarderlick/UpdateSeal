import React from 'react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppFooter } from './components/layout/AppFooter';
import { AppHeader } from './components/layout/AppHeader';
import { DESIGN_DEMO_BANNER_HEADING } from './lib/designDemo';
import { TRUST_BOUNDARY_NOTICE } from './lib/trustBoundary';
import { resetUpdateSealConfigCache } from './lib/updateSealConfig';
import { CandidateStep3Page } from './pages/CandidateStep3Page';
import { DecisionReviewRequiredPage } from './pages/DecisionReviewRequiredPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LandingPage } from './pages/LandingPage';
import { LiveVerificationPage } from './pages/LiveVerificationPage';
import { RegisterStep1Page } from './pages/RegisterStep1Page';
import { WalletProvider } from './features/wallet/WalletContext';
import { TransactionProvider } from './features/transactions/TransactionContext';
import { RegistrationProvider } from './features/registration/RegistrationContext';
import { CandidateProvider } from './features/candidate-release/CandidateContext';
import * as contractService from './services/updateSealContract';

const rootReadme = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../README.md'), 'utf8');

function renderPage(ui: React.ReactElement, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WalletProvider>
        <TransactionProvider>
          <RegistrationProvider>
            <CandidateProvider>
              <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
            </CandidateProvider>
          </RegistrationProvider>
        </TransactionProvider>
      </WalletProvider>
    </QueryClientProvider>,
  );
}

describe('reviewer claim alignment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
  });

  it('root production copy does not claim UpdateSeal directly blocks deployment', () => {
    expect(rootReadme).not.toMatch(/prevent unauthorized network egress/i);
    expect(rootReadme).toMatch(/detect and review capability drift before choosing to deploy/i);
    expect(rootReadme).not.toMatch(/machine-enforceable deployment decision/i);
  });

  it('landing page uses detect/evaluate/record rather than an absolute prevention guarantee', () => {
    renderPage(<LandingPage />);
    expect(screen.getByText(/detects and records potential capability drift/i)).toBeInTheDocument();
    expect(screen.queryByText(/UpdateSeal prevents silent capability drift/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/machine-enforceable decision/i)).not.toBeInTheDocument();
  });

  it('How It Works says external systems may consume the verdict and no on-chain multisig exists', () => {
    renderPage(<HowItWorksPage />);
    expect(screen.getAllByText(/external systems may consume/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UpdateSeal v1 does not implement an on-chain multisig/i).length).toBeGreaterThan(0);
  });

  it('footer does not advertise Multisig Human Hooks as live functionality', () => {
    renderPage(<AppFooter />);
    expect(screen.queryByText(/Multisig Human Hooks/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Design preview screens \(not live\)/i)).toBeInTheDocument();
  });

  it('live registration includes the GitHub-ownership disclaimer', () => {
    renderPage(<RegisterStep1Page />, '/register/identity');
    expect(screen.getByTestId('trust-boundary-notice')).toHaveTextContent(TRUST_BOUNDARY_NOTICE);
    expect(screen.getAllByText(/does not prove GitHub repository ownership/i).length).toBeGreaterThan(0);
  });

  it('live verification UI includes the trust-boundary notice', () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'live');
    resetUpdateSealConfigCache();
    renderPage(<LiveVerificationPage />, '/verify');
    expect(screen.getByTestId('trust-boundary-notice')).toHaveTextContent(TRUST_BOUNDARY_NOTICE);
  });

  it('demo review-required page shows the design-demo banner, DEMO DATA, and simulated actions', () => {
    renderPage(<DecisionReviewRequiredPage />, '/decisions/review-required');
    expect(screen.getByTestId('design-demo-banner')).toHaveTextContent(DESIGN_DEMO_BANNER_HEADING);
    expect(screen.getByTestId('design-demo-data-label')).toHaveTextContent('DEMO DATA');
    expect(screen.getByRole('button', { name: /SIMULATE APPROVE EXPANSION/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SIMULATE REJECT/i })).toBeInTheDocument();
  });

  it('demo review-required and confirm actions make zero contract or wallet-signature calls', () => {
    const spies = [
      vi.spyOn(contractService, 'getPackage'),
      vi.spyOn(contractService, 'getCandidate'),
      vi.spyOn(contractService, 'getRegistrySnapshot'),
    ];

    const { unmount } = renderPage(<DecisionReviewRequiredPage />, '/decisions/review-required');
    fireEvent.click(screen.getByRole('button', { name: /SIMULATE APPROVE EXPANSION/i }));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    unmount();

    renderPage(<CandidateStep3Page />, '/packages/atlas-research-agent/releases/new/confirm');
    const agree = screen.getByRole('checkbox');
    fireEvent.click(agree);
    fireEvent.click(screen.getByRole('button', { name: /SIMULATE CANDIDATE DISPATCH/i }));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    for (const spy of spies) spy.mockRestore();
  });

  it('live routes do not show the design-demo banner', () => {
    const { unmount: u1 } = renderPage(<LandingPage />, '/');
    expect(screen.queryByTestId('design-demo-banner')).not.toBeInTheDocument();
    u1();
    const { unmount: u2 } = renderPage(<HowItWorksPage />, '/how-it-works');
    expect(screen.queryByTestId('design-demo-banner')).not.toBeInTheDocument();
    u2();
    renderPage(<RegisterStep1Page />, '/register/identity');
    expect(screen.queryByTestId('design-demo-banner')).not.toBeInTheDocument();
  });

  it('design-demo header badge stays DEMO DATA even when the rest of the app is live-configured', () => {
    renderPage(
      <>
        <AppHeader />
        <DecisionReviewRequiredPage />
      </>,
      '/decisions/review-required',
    );
    expect(screen.getAllByText('DEMO DATA').length).toBeGreaterThan(0);
    expect(screen.queryByText('LIVE • STUDIO-DEV')).not.toBeInTheDocument();
  });
});

describe('README reviewer proof links', () => {
  it('contains the contract explorer, both evidence links, and all six transaction proof links', () => {
    expect(rootReadme).toContain('https://explorer-studio-dev.genlayer.com/address/0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3');
    expect(rootReadme).toContain(
      'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/d097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f/evidence/evidence-v2.json',
    );
    expect(rootReadme).toContain(
      'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/fee557c42e9dab4b8fc4eebd4b6f6482316840c7/evidence/frontend-eval-smoke-v2.json',
    );
    const txs = [
      'https://explorer-studio-dev.genlayer.com/tx/0x8d8179e0ca8875a6cced3564575f98167e5b75245ec5a9c245fe4516016e9897',
      'https://explorer-studio-dev.genlayer.com/tx/0x2218c81a9a3e3f1e1dfb02234121611f808512c254e9bcf47a895628cea07ae0',
      'https://explorer-studio-dev.genlayer.com/tx/0x5545e2fbb76c8265b20b4fa03819ed1eeeb81f709171fd2cd860c4435e01a416',
      'https://explorer-studio-dev.genlayer.com/tx/0x0f911b652d9b66451ddafdb0aaf733acdb81542b4125376721d87c1f470cb408',
      'https://explorer-studio-dev.genlayer.com/tx/0xd07fbb240ee0e13eaa331bbadf55b50ecf0d0257a6a2cc4e8aaa22509e346fa1',
      'https://explorer-studio-dev.genlayer.com/tx/0xf4ee1038144c9e917e693149a09103d8322b3896cd888c7a06518ce9bbbf19e7',
    ];
    for (const tx of txs) {
      expect(rootReadme).toContain(tx);
    }
  });

  it('explicitly states no escrow/multisig/deployment control and that GitHub ownership is not proven', () => {
    expect(rootReadme).toMatch(/does not itself deploy software, halt external CI\/CD systems, operate a multisig, hold escrow, or transfer funds/i);
    expect(rootReadme).toMatch(/does not prove that the wallet owns the referenced GitHub repository/i);
  });
});
