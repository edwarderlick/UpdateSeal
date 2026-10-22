import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { OnChainCandidateRecord, OnChainPackageRecord, PendingCandidateSnapshot } from '../../types/updateSeal';
import {
  buildEvidencePreflightInputs,
  evidencePreflightInputsEqual,
  isEvidencePreflightCurrent,
  type EvidencePreflightInputs,
  type EvidencePreflightResult,
  type EvidencePreflightSuccess,
} from '../../lib/evidencePreflight';
import { isAtlasDemoPackageUid } from './atlasDemoIds';

export interface LiveCandidateDraft {
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
}

export type LiveEvidenceStatus =
  | { kind: 'idle' }
  | { kind: 'fetching'; generation: number }
  | { kind: 'result'; result: EvidencePreflightResult; generation: number };

export interface LiveCandidateReceipt {
  candidateId: string;
  transactionHash: string;
  packageUid: string;
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
  status: string;
  record: OnChainCandidateRecord;
}

interface StoredLiveDraft {
  dataMode: 'live';
  packageUid: string;
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
}

const SENSITIVE_KEYS = ['privateKey', 'private_key', 'mnemonic', 'seed', 'provider', 'wallet', 'secret'];

function storageKey(packageUid: string): string {
  return `updateseal_candidate_form:live:${packageUid}`;
}

function sanitizeStoredDraft(raw: unknown, expectedPackageUid: string): LiveCandidateDraft | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (SENSITIVE_KEYS.includes(key)) {
      return null;
    }
  }
  if (record.dataMode !== 'live') {
    return null;
  }
  if (typeof record.packageUid !== 'string' || record.packageUid !== expectedPackageUid) {
    return null;
  }
  if (isAtlasDemoPackageUid(record.packageUid)) {
    return null;
  }
  const pick = (key: keyof StoredLiveDraft): string => {
    const value = record[key];
    return typeof value === 'string' ? value : '';
  };
  return {
    version: pick('version'),
    candidateCommitSha: pick('candidateCommitSha'),
    evidenceUri: pick('evidenceUri'),
    evidenceHash: pick('evidenceHash'),
  };
}

function loadDraft(packageUid: string): LiveCandidateDraft {
  const empty: LiveCandidateDraft = {
    version: '',
    candidateCommitSha: '',
    evidenceUri: '',
    evidenceHash: '',
  };
  if (typeof sessionStorage === 'undefined') {
    return empty;
  }
  const saved = sessionStorage.getItem(storageKey(packageUid));
  if (!saved) {
    return empty;
  }
  try {
    const parsed = JSON.parse(saved) as unknown;
    return sanitizeStoredDraft(parsed, packageUid) ?? empty;
  } catch {
    return empty;
  }
}

export interface BeginEvidencePreflight {
  generation: number;
  signal: AbortSignal;
}

interface LiveCandidateContextType {
  packageRecord: OnChainPackageRecord;
  packageUid: string;
  publisher: string;
  repositoryUrl: string;
  baselineCommitSha: string;
  charterHash: string;
  draft: LiveCandidateDraft;
  updateDraft: (updates: Partial<LiveCandidateDraft>) => void;
  evidenceStatus: LiveEvidenceStatus;
  setEvidenceStatus: (status: LiveEvidenceStatus) => void;
  evidencePassed: EvidencePreflightSuccess | null;
  evidencePreflightGeneration: number;
  currentEvidenceInputs: EvidencePreflightInputs;
  beginEvidencePreflight: () => BeginEvidencePreflight;
  applyEvidencePreflightResult: (generation: number, result: EvidencePreflightResult) => boolean;
  abortInFlightEvidencePreflight: () => void;
  pendingSnapshot: PendingCandidateSnapshot | null;
  setPendingSnapshot: (snapshot: PendingCandidateSnapshot | null) => void;
  liveReceipt: LiveCandidateReceipt | null;
  setLiveReceipt: (receipt: LiveCandidateReceipt | null) => void;
  resetDraft: () => void;
  clearDraftAfterSuccess: () => void;
}

const LiveCandidateContext = createContext<LiveCandidateContextType | undefined>(undefined);

export const LiveCandidateProvider: React.FC<{
  packageRecord: OnChainPackageRecord;
  children: React.ReactNode;
}> = ({ packageRecord, children }) => {
  const packageUid = packageRecord.package_uid;
  const [draft, setDraft] = useState<LiveCandidateDraft>(() => loadDraft(packageUid));
  const [evidenceStatus, setEvidenceStatus] = useState<LiveEvidenceStatus>({ kind: 'idle' });
  const [evidencePreflightGeneration, setEvidencePreflightGeneration] = useState(0);
  const [pendingSnapshot, setPendingSnapshot] = useState<PendingCandidateSnapshot | null>(null);
  const [liveReceipt, setLiveReceipt] = useState<LiveCandidateReceipt | null>(null);
  const preflightGenerationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const draftRef = useRef(draft);
  const evidenceStatusRef = useRef(evidenceStatus);
  draftRef.current = draft;
  evidenceStatusRef.current = evidenceStatus;

  const currentEvidenceInputs = useMemo(
    () =>
      buildEvidencePreflightInputs({
        evidenceUri: draft.evidenceUri,
        evidenceHash: draft.evidenceHash,
        packageUid,
        version: draft.version,
        baselineCommitSha: packageRecord.baseline_commit_sha,
        candidateCommitSha: draft.candidateCommitSha,
      }),
    [draft, packageUid, packageRecord.baseline_commit_sha],
  );

  const bumpPreflightGeneration = useCallback(() => {
    preflightGenerationRef.current += 1;
    setEvidencePreflightGeneration(preflightGenerationRef.current);
    return preflightGenerationRef.current;
  }, []);

  const abortActiveController = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const abortInFlightEvidencePreflight = useCallback(() => {
    abortActiveController();
    if (evidenceStatusRef.current.kind === 'fetching') {
      bumpPreflightGeneration();
      setEvidenceStatus({ kind: 'idle' });
    }
  }, [abortActiveController, bumpPreflightGeneration]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    const payload: StoredLiveDraft = {
      dataMode: 'live',
      packageUid,
      version: draft.version,
      candidateCommitSha: draft.candidateCommitSha,
      evidenceUri: draft.evidenceUri,
      evidenceHash: draft.evidenceHash,
    };
    sessionStorage.setItem(storageKey(packageUid), JSON.stringify(payload));
  }, [draft, packageUid]);

  const updateDraft = useCallback((updates: Partial<LiveCandidateDraft>) => {
    const prev = draftRef.current;
    const next = { ...prev, ...updates };
    const identityChanged =
      next.evidenceUri !== prev.evidenceUri ||
      next.evidenceHash !== prev.evidenceHash ||
      next.version !== prev.version ||
      next.candidateCommitSha !== prev.candidateCommitSha;
    draftRef.current = next;
    setDraft(next);
    if (identityChanged) {
      abortActiveController();
      bumpPreflightGeneration();
      setEvidenceStatus({ kind: 'idle' });
    }
  }, [abortActiveController, bumpPreflightGeneration]);

  const beginEvidencePreflight = useCallback((): BeginEvidencePreflight => {
    abortActiveController();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const generation = bumpPreflightGeneration();
    setEvidenceStatus({ kind: 'fetching', generation });
    return { generation, signal: controller.signal };
  }, [abortActiveController, bumpPreflightGeneration]);

  const applyEvidencePreflightResult = useCallback(
    (generation: number, result: EvidencePreflightResult): boolean => {
      if (generation !== preflightGenerationRef.current) {
        return false;
      }
      const expected = buildEvidencePreflightInputs({
        evidenceUri: draftRef.current.evidenceUri,
        evidenceHash: draftRef.current.evidenceHash,
        packageUid,
        version: draftRef.current.version,
        baselineCommitSha: packageRecord.baseline_commit_sha,
        candidateCommitSha: draftRef.current.candidateCommitSha,
      });
      if (!evidencePreflightInputsEqual(result.inputs, expected)) {
        return false;
      }
      setEvidenceStatus({ kind: 'result', result, generation });
      return true;
    },
    [packageRecord.baseline_commit_sha, packageUid],
  );

  const resetDraft = useCallback(() => {
    abortActiveController();
    bumpPreflightGeneration();
    setDraft({
      version: '',
      candidateCommitSha: '',
      evidenceUri: '',
      evidenceHash: '',
    });
    setEvidenceStatus({ kind: 'idle' });
    setPendingSnapshot(null);
    setLiveReceipt(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(storageKey(packageUid));
    }
  }, [abortActiveController, bumpPreflightGeneration, packageUid]);

  const clearDraftAfterSuccess = useCallback(() => {
    abortActiveController();
    bumpPreflightGeneration();
    setDraft({
      version: '',
      candidateCommitSha: '',
      evidenceUri: '',
      evidenceHash: '',
    });
    setEvidenceStatus({ kind: 'idle' });
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(storageKey(packageUid));
    }
  }, [abortActiveController, bumpPreflightGeneration, packageUid]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const evidencePassed =
    evidenceStatus.kind === 'result' &&
    evidenceStatus.result.ok &&
    evidenceStatus.generation === evidencePreflightGeneration &&
    isEvidencePreflightCurrent(evidenceStatus.result, currentEvidenceInputs)
      ? evidenceStatus.result
      : null;

  const value = useMemo<LiveCandidateContextType>(
    () => ({
      packageRecord,
      packageUid,
      publisher: packageRecord.publisher,
      repositoryUrl: packageRecord.repository_url,
      baselineCommitSha: packageRecord.baseline_commit_sha,
      charterHash: packageRecord.charter_hash,
      draft,
      updateDraft,
      evidenceStatus,
      setEvidenceStatus,
      evidencePassed,
      evidencePreflightGeneration,
      currentEvidenceInputs,
      beginEvidencePreflight,
      applyEvidencePreflightResult,
      abortInFlightEvidencePreflight,
      pendingSnapshot,
      setPendingSnapshot,
      liveReceipt,
      setLiveReceipt,
      resetDraft,
      clearDraftAfterSuccess,
    }),
    [
      packageRecord,
      packageUid,
      draft,
      updateDraft,
      evidenceStatus,
      evidencePassed,
      evidencePreflightGeneration,
      currentEvidenceInputs,
      beginEvidencePreflight,
      applyEvidencePreflightResult,
      abortInFlightEvidencePreflight,
      pendingSnapshot,
      liveReceipt,
      resetDraft,
      clearDraftAfterSuccess,
    ],
  );

  return <LiveCandidateContext.Provider value={value}>{children}</LiveCandidateContext.Provider>;
};

export function useLiveCandidate(): LiveCandidateContextType {
  const context = useContext(LiveCandidateContext);
  if (!context) {
    throw new Error('useLiveCandidate must be used within a LiveCandidateProvider');
  }
  return context;
}

export function liveCandidateStorageKey(packageUid: string): string {
  return storageKey(packageUid);
}
