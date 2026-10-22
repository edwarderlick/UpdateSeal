import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveCandidateProvider, liveCandidateStorageKey, useLiveCandidate } from '../features/candidate-release/LiveCandidateContext';
import { sha256Hex } from '../lib/evidencePreflight';
import { resetUpdateSealConfigCache } from '../lib/updateSealConfig';
import { SMOKE_PACKAGE, VALID_LIVE_ENV } from '../test/updateSealFixtures';
import { LiveCandidateStep2Page } from './LiveCandidateStep2Page';

const SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const VERSION = '1.0.1';
const URI_A = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA}/updateseal/evidence.json`;
const URI_B = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA}/updateseal/evidence-b.json`;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function seedDraft(overrides: { evidenceUri?: string; evidenceHash?: string; version?: string; candidateCommitSha?: string } = {}) {
  sessionStorage.setItem(
    liveCandidateStorageKey(SMOKE_PACKAGE.package_uid),
    JSON.stringify({
      dataMode: 'live',
      packageUid: SMOKE_PACKAGE.package_uid,
      version: overrides.version ?? VERSION,
      candidateCommitSha: overrides.candidateCommitSha ?? SHA,
      evidenceUri: overrides.evidenceUri ?? URI_A,
      evidenceHash: overrides.evidenceHash ?? 'aa'.repeat(32),
    }),
  );
}

function DraftControls() {
  const live = useLiveCandidate();
  return (
    <div>
      <input
        data-testid="live-version"
        value={live.draft.version}
        onChange={(event) => live.updateDraft({ version: event.target.value })}
      />
      <input
        data-testid="live-candidate-sha"
        value={live.draft.candidateCommitSha}
        onChange={(event) => live.updateDraft({ candidateCommitSha: event.target.value })}
      />
    </div>
  );
}

function renderEvidence() {
  return render(
    <MemoryRouter>
      <LiveCandidateProvider packageRecord={SMOKE_PACKAGE}>
        <DraftControls />
        <LiveCandidateStep2Page />
      </LiveCandidateProvider>
    </MemoryRouter>,
  );
}

function validEvidenceJson(version = VERSION) {
  return JSON.stringify({
    schema_version: 2,
    package_uid: SMOKE_PACKAGE.package_uid,
    version,
    baseline_commit_sha: SMOKE_PACKAGE.baseline_commit_sha,
    diff_summary: 'Adds logging.',
    changed_files: ['src/index.ts'],
    declared_capabilities: ['network_egress'],
    requested_domains: ['github.com'],
    evidence_items: ['git_diff'],
    tests: [{ name: 'unit', status: 'passed' }],
  });
}

describe('live evidence preflight races', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  let pending: Array<ReturnType<typeof deferred<Response>> & { signal?: AbortSignal }> = [];
  let bodyA: string;
  let bodyB: string;
  let hashA: string;

  beforeEach(async () => {
    vi.stubEnv('VITE_UPDATESEAL_DATA_MODE', VALID_LIVE_ENV.VITE_UPDATESEAL_DATA_MODE);
    vi.stubEnv('VITE_GENLAYER_RPC_URL', VALID_LIVE_ENV.VITE_GENLAYER_RPC_URL);
    vi.stubEnv('VITE_GENLAYER_CHAIN_ID', VALID_LIVE_ENV.VITE_GENLAYER_CHAIN_ID);
    vi.stubEnv('VITE_UPDATESEAL_CONTRACT_ADDRESS', VALID_LIVE_ENV.VITE_UPDATESEAL_CONTRACT_ADDRESS);
    resetUpdateSealConfigCache();
    sessionStorage.clear();
    pending = [];
    bodyA = validEvidenceJson();
    bodyB = validEvidenceJson();
    hashA = await sha256Hex(new TextEncoder().encode(bodyA));
    fetchSpy.mockImplementation((_url: unknown, init?: RequestInit) => {
      const item = { ...deferred<Response>(), signal: init?.signal ?? undefined };
      pending.push(item);
      return item.promise;
    });
  });

  afterEach(() => {
    fetchSpy.mockReset();
    sessionStorage.clear();
    vi.unstubAllEnvs();
    resetUpdateSealConfigCache();
  });

  it('ignores a successful preflight A after the URI changes and keeps Continue disabled', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    expect(pending).toHaveLength(1);
    fireEvent.change(screen.getByTestId('live-evidence-uri'), { target: { value: URI_B } });
    expect(screen.getByTestId('live-evidence-continue')).toBeDisabled();
    await act(async () => {
      pending[0].resolve(new Response(bodyA, { status: 200 }));
      await pending[0].promise.catch(() => undefined);
    });
    expect(screen.queryByText(/Evidence document checks passed/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('live-evidence-continue')).toBeDisabled();
    expect(screen.queryByText(/HTTP 200 is required/i)).not.toBeInTheDocument();
  });

  it('resets and ignores a pending preflight when the evidence hash changes', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    fireEvent.change(screen.getByTestId('live-evidence-hash'), { target: { value: 'cc'.repeat(32) } });
    await act(async () => {
      pending[0].resolve(new Response(bodyA, { status: 200 }));
      await pending[0].promise.catch(() => undefined);
    });
    expect(screen.getByTestId('live-evidence-continue')).toBeDisabled();
  });

  it('resets and ignores a pending preflight when the version changes', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    fireEvent.change(screen.getByTestId('live-version'), { target: { value: '1.0.2' } });
    await act(async () => {
      pending[0].resolve(new Response(bodyA, { status: 200 }));
      await pending[0].promise.catch(() => undefined);
    });
    expect(screen.getByTestId('live-evidence-continue')).toBeDisabled();
  });

  it('resets and ignores a pending preflight when the candidate SHA changes', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    fireEvent.change(screen.getByTestId('live-candidate-sha'), { target: { value: 'c'.repeat(40) } });
    await act(async () => {
      pending[0].resolve(new Response(bodyA, { status: 200 }));
      await pending[0].promise.catch(() => undefined);
    });
    expect(screen.getByTestId('live-evidence-continue')).toBeDisabled();
  });

  it('displays B when B finishes first and never lets A replace B', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    fireEvent.change(screen.getByTestId('live-evidence-uri'), { target: { value: URI_B } });
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    expect(pending).toHaveLength(2);
    await act(async () => {
      pending[1].resolve(new Response(bodyB, { status: 200 }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Evidence document checks passed/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('live-evidence-continue')).toBeEnabled();
    await act(async () => {
      pending[0].resolve(new Response(bodyA, { status: 200 }));
      await pending[0].promise.catch(() => undefined);
    });
    expect(screen.getByText(/Evidence document checks passed/i)).toBeInTheDocument();
    expect(screen.getByTestId('live-evidence-continue')).toBeEnabled();
  });

  it('does not render an HTTP failure for an aborted request', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    const signal = pending[0].signal;
    expect(signal).toBeDefined();
    fireEvent.change(screen.getByTestId('live-evidence-uri'), { target: { value: URI_B } });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      pending[0].reject(new DOMException('Aborted', 'AbortError'));
    });
    expect(screen.queryByText(/HTTP 200 is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/could not be fetched/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('live-evidence-continue')).toBeDisabled();
  });

  it('aborts the active request on unmount', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    const view = renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    const signal = pending[0].signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('enables Continue for a current successful result', async () => {
    seedDraft({ evidenceHash: hashA });
    const user = userEvent.setup();
    renderEvidence();
    await user.click(screen.getByTestId('live-evidence-preflight-button'));
    await act(async () => {
      pending[0].resolve(new Response(bodyA, { status: 200 }));
    });
    await waitFor(() => {
      expect(screen.getByTestId('live-evidence-continue')).toBeEnabled();
    });
  });

});
