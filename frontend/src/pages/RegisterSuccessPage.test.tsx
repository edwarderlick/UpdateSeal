import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistrationProvider } from '../features/registration/RegistrationContext';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { VALID_LIVE_ENV } from '../test/updateSealFixtures';
import { RegisterSuccessPage } from './RegisterSuccessPage';

describe('RegisterSuccessPage live receipt', () => {
  beforeEach(() => {
    sessionStorage.clear();
    Object.entries(VALID_LIVE_ENV).forEach(([key, value]) => vi.stubEnv(key, value));
    resetUpdateSealConfigCache();
    sessionStorage.setItem(
      'updateseal_registration_receipt',
      JSON.stringify({
        packageUid: '0x82fde1090c2941e5d8742a944813ebfc09c91c12/sentinel-code-auditor',
        transactionHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        publisher: '0x82fde1090c2941e5d8742a944813ebfc09c91c12',
        repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
        baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
        charterHash: '3827082a036312d53d7ea918fbbbad9e7de9ec4a180c03550b231524873c7f48',
        packageSlug: 'sentinel-code-auditor',
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', 'demo');
    resetUpdateSealConfigCache();
    sessionStorage.clear();
  });

  it('renders the live package link from the confirmed receipt', () => {
    render(
      <MemoryRouter>
        <RegistrationProvider>
          <RegisterSuccessPage />
        </RegistrationProvider>
      </MemoryRouter>,
    );

    const link = screen.getByTestId('open-live-package');
    expect(link).toHaveAttribute(
      'href',
      '/packages/0x82fde1090c2941e5d8742a944813ebfc09c91c12/sentinel-code-auditor',
    );
    expect(screen.getByTestId('live-registration-receipt')).toHaveTextContent(
      '0x82fde1090c2941e5d8742a944813ebfc09c91c12/sentinel-code-auditor',
    );
    expect(screen.getByText(/FINALIZED AND ACCEPTED/i)).toBeInTheDocument();
  });
});
