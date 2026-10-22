import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SMOKE_PACKAGE } from '../../test/updateSealFixtures';
import { LiveCandidateProvider, liveCandidateStorageKey, useLiveCandidate } from './LiveCandidateContext';

function Probe() {
  const live = useLiveCandidate();
  return (
    <div>
      <span data-testid="uid">{live.packageUid}</span>
      <span data-testid="version">{live.draft.version}</span>
      <span data-testid="sha">{live.draft.candidateCommitSha}</span>
    </div>
  );
}

describe('LiveCandidateContext isolation', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('does not restore Atlas demo session data into a live package', () => {
    sessionStorage.setItem(
      'updateseal_candidate_form',
      JSON.stringify({
        packageId: 'atlas-research-agent',
        version: 'v1.5.0-rc1',
        commitSha: '61997402be49f812cc994017bca882e558a12009',
      }),
    );
    sessionStorage.setItem(
      'updateseal_candidate_form:demo:atlas-research-agent',
      JSON.stringify({
        packageId: 'atlas-research-agent',
        version: 'v1.5.0-rc1',
        commitSha: '61997402be49f812cc994017bca882e558a12009',
      }),
    );
    render(
      <LiveCandidateProvider packageRecord={SMOKE_PACKAGE}>
        <Probe />
      </LiveCandidateProvider>,
    );
    expect(screen.getByTestId('uid')).toHaveTextContent(SMOKE_PACKAGE.package_uid);
    expect(screen.getByTestId('version')).toHaveTextContent('');
    expect(screen.getByTestId('sha')).toHaveTextContent('');
  });

  it('restores only a namespaced live draft for the same package UID', () => {
    sessionStorage.setItem(
      liveCandidateStorageKey(SMOKE_PACKAGE.package_uid),
      JSON.stringify({
        dataMode: 'live',
        packageUid: SMOKE_PACKAGE.package_uid,
        version: '1.0.1',
        candidateCommitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        evidenceUri: 'https://raw.githubusercontent.com/edwarderlick/Provider-Court/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/e.json',
        evidenceHash: 'aa'.repeat(32),
      }),
    );
    render(
      <LiveCandidateProvider packageRecord={SMOKE_PACKAGE}>
        <Probe />
      </LiveCandidateProvider>,
    );
    expect(screen.getByTestId('version')).toHaveTextContent('1.0.1');
    expect(screen.getByTestId('sha')).toHaveTextContent('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('rejects stored drafts with a different package UID, demo mode, or sensitive keys', () => {
    sessionStorage.setItem(
      liveCandidateStorageKey(SMOKE_PACKAGE.package_uid),
      JSON.stringify({
        dataMode: 'demo',
        packageUid: SMOKE_PACKAGE.package_uid,
        version: 'hacked',
        candidateCommitSha: 'x',
        evidenceUri: '',
        evidenceHash: '',
        privateKey: '0xabc',
      }),
    );
    render(
      <LiveCandidateProvider packageRecord={SMOKE_PACKAGE}>
        <Probe />
      </LiveCandidateProvider>,
    );
    expect(screen.getByTestId('version')).toHaveTextContent('');
  });
});
