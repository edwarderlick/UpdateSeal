import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { getUpdateSealConfigResult } from '../../lib/updateSealConfig';
import type { EthereumProviderLike } from '../../lib/genlayerClient';
import type { PendingCandidateSnapshot } from '../../types/updateSeal';
import { registryQueryKeys } from '../registry/registryQueryKeys';
import { useWallet } from '../wallet/useWallet';
import { useLiveCandidate } from './LiveCandidateContext';
import {
  checkCandidateStatus,
  submitLiveCandidate,
  type CandidateSubmitPhase,
  type SubmitCandidateOrchestrationDeps,
  type SubmitCandidateResult,
} from './submitCandidate';

export interface SubmitCandidateViewState {
  phase: CandidateSubmitPhase;
  message: string | null;
  fieldErrors: Record<string, string>;
  transactionHash: string | null;
  duplicatePath: string | null;
  duplicateId: string | null;
  pendingSnapshot: PendingCandidateSnapshot | null;
  estimatedFeeLabel: string | null;
}

const INITIAL_STATE: SubmitCandidateViewState = {
  phase: 'review',
  message: null,
  fieldErrors: {},
  transactionHash: null,
  duplicatePath: null,
  duplicateId: null,
  pendingSnapshot: null,
  estimatedFeeLabel: null,
};

export function useSubmitCandidate(deps: SubmitCandidateOrchestrationDeps = {}) {
  const queryClient = useQueryClient();
  const live = useLiveCandidate();
  const { wallet, isWrongNetwork, openWalletModal, openNetworkModal, getEthereumProvider } = useWallet();
  const [view, setView] = useState<SubmitCandidateViewState>(INITIAL_STATE);
  const inFlight = useRef(false);
  const pendingSnapshotRef = useRef<PendingCandidateSnapshot | null>(live.pendingSnapshot);
  const estimatedFeeLabelRef = useRef<string | null>(null);
  const configResult = getUpdateSealConfigResult();

  const storeSnapshot = useCallback(
    (snapshot: PendingCandidateSnapshot) => {
      pendingSnapshotRef.current = snapshot;
      live.setPendingSnapshot(snapshot);
    },
    [live],
  );

  const applyResult = useCallback(
    (result: SubmitCandidateResult) => {
      if (result.ok && result.phase === 'finalized') {
        pendingSnapshotRef.current = null;
        live.setPendingSnapshot(null);
        live.setLiveReceipt({
          candidateId: result.success.candidateId,
          transactionHash: result.success.transactionHash,
          packageUid: result.success.record.package_uid,
          version: result.success.record.version,
          candidateCommitSha: result.success.record.candidate_commit_sha,
          evidenceUri: result.success.record.evidence_uri,
          evidenceHash: result.success.record.evidence_hash,
          status: result.success.record.status,
          record: result.success.record,
        });
        live.clearDraftAfterSuccess();
        setView({
          phase: 'finalized',
          message: 'Candidate submitted with PENDING status. Evaluation has not started.',
          fieldErrors: {},
          transactionHash: result.success.transactionHash,
          duplicatePath: null,
          duplicateId: null,
          pendingSnapshot: null,
          estimatedFeeLabel: null,
        });
        return;
      }
      if (result.ok && result.phase === 'demo') {
        pendingSnapshotRef.current = null;
        setView({
          ...INITIAL_STATE,
          phase: 'demo',
        });
        return;
      }
      if (!result.ok) {
        const snapshot = result.snapshot ?? pendingSnapshotRef.current;
        if (snapshot) {
          pendingSnapshotRef.current = snapshot;
          live.setPendingSnapshot(snapshot);
        }
        if (result.phase === 'fee_estimation_failed' || result.phase === 'fee_estimate_invalid') {
          estimatedFeeLabelRef.current = null;
        }
        setView({
          phase: result.phase,
          message: result.message,
          fieldErrors: result.fieldErrors ?? {},
          transactionHash: result.transactionHash ?? snapshot?.transactionHash ?? null,
          duplicatePath: result.duplicate?.path ?? null,
          duplicateId: result.duplicate?.candidateId ?? null,
          pendingSnapshot: snapshot ?? null,
          estimatedFeeLabel:
            result.phase === 'fee_estimation_failed' || result.phase === 'fee_estimate_invalid'
              ? null
              : estimatedFeeLabelRef.current,
        });
      }
    },
    [live],
  );

  const submit = useCallback(async () => {
    if (inFlight.current) {
      return view;
    }
    inFlight.current = true;
    try {
      if (!configResult.ok) {
        const next: SubmitCandidateViewState = {
          phase: 'config_invalid',
          message: configResult.error.userMessage,
          fieldErrors: {},
          transactionHash: view.transactionHash,
          duplicatePath: null,
          duplicateId: null,
          pendingSnapshot: pendingSnapshotRef.current,
          estimatedFeeLabel: estimatedFeeLabelRef.current,
        };
        setView(next);
        return next;
      }

      if (configResult.config.dataMode === 'demo') {
        const next: SubmitCandidateViewState = { ...INITIAL_STATE, phase: 'demo' };
        setView(next);
        return next;
      }

      if (!wallet.isConnected) {
        openWalletModal();
        const next: SubmitCandidateViewState = {
          phase: 'wallet_required',
          message: 'Connect a wallet to submit a candidate on Studio-dev.',
          fieldErrors: {},
          transactionHash: pendingSnapshotRef.current?.transactionHash ?? null,
          duplicatePath: null,
          duplicateId: null,
          pendingSnapshot: pendingSnapshotRef.current,
          estimatedFeeLabel: estimatedFeeLabelRef.current,
        };
        setView(next);
        return next;
      }

      if (isWrongNetwork) {
        openNetworkModal();
        const next: SubmitCandidateViewState = {
          phase: 'wrong_network',
          message: 'Switch to GenLayer Studio-dev (chain ID 61997) before submitting a candidate.',
          fieldErrors: {},
          transactionHash: pendingSnapshotRef.current?.transactionHash ?? null,
          duplicatePath: null,
          duplicateId: null,
          pendingSnapshot: pendingSnapshotRef.current,
          estimatedFeeLabel: estimatedFeeLabelRef.current,
        };
        setView(next);
        return next;
      }

      const provider = (await getEthereumProvider()) as EthereumProviderLike | null;
      const result = await submitLiveCandidate(
        {
          packageRecord: live.packageRecord,
          version: live.draft.version,
          candidateCommitSha: live.draft.candidateCommitSha,
          evidenceUri: live.draft.evidenceUri,
          evidenceHash: live.draft.evidenceHash,
          evidencePreflight: live.evidencePassed,
          connectedAddress: wallet.address,
          isConnected: wallet.isConnected,
          chainId: wallet.chainId,
          provider,
          configResult,
          onProgress: (event) => {
            if (event.snapshot) {
              storeSnapshot(event.snapshot);
            }
            if (event.estimatedFeeLabel) {
              estimatedFeeLabelRef.current = event.estimatedFeeLabel;
            }
            setView((current) => ({
              ...current,
              phase: event.phase,
              transactionHash:
                event.phase === 'estimating_fees' ? null : (event.transactionHash ?? current.transactionHash),
              pendingSnapshot: event.snapshot ?? current.pendingSnapshot,
              estimatedFeeLabel:
                event.phase === 'estimating_fees' ? null : (event.estimatedFeeLabel ?? current.estimatedFeeLabel),
              message:
                event.phase === 'estimating_fees'
                  ? 'Estimating Studio-dev transaction fee'
                  : event.phase === 'awaiting_wallet'
                    ? 'Approve the candidate submission in your wallet.'
                    : event.phase === 'submitted'
                      ? 'Transaction submitted. Waiting does not mean the candidate is recorded yet.'
                      : 'Waiting for GenLayer consensus to finalize.',
            }));
          },
        },
        deps,
      );

      applyResult(result);
      if (result.ok && result.phase === 'finalized') {
        await queryClient.invalidateQueries({ queryKey: registryQueryKeys.all });
      }
      return result;
    } finally {
      inFlight.current = false;
    }
  }, [
    applyResult,
    configResult,
    deps,
    getEthereumProvider,
    isWrongNetwork,
    live.draft,
    live.evidencePassed,
    live.packageRecord,
    openNetworkModal,
    openWalletModal,
    queryClient,
    storeSnapshot,
    view,
    wallet.address,
    wallet.chainId,
    wallet.isConnected,
  ]);

  const retryStatus = useCallback(async () => {
    const snapshot = pendingSnapshotRef.current;
    if (!snapshot || inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      setView((current) => ({
        ...current,
        phase: 'waiting_consensus',
        pendingSnapshot: snapshot,
        transactionHash: snapshot.transactionHash,
        message: `Checking transaction status for the original submitting wallet ${snapshot.senderAddress}. This does not submit a new candidate.`,
      }));
      const result = await checkCandidateStatus(
        {
          snapshot,
          publisherAddress: snapshot.senderAddress,
          configResult,
        },
        deps,
      );
      applyResult(result);
      if (result.ok && result.phase === 'finalized') {
        await queryClient.invalidateQueries({ queryKey: registryQueryKeys.all });
      }
    } finally {
      inFlight.current = false;
    }
  }, [applyResult, configResult, deps, queryClient]);

  const resetView = useCallback(() => {
    pendingSnapshotRef.current = null;
    estimatedFeeLabelRef.current = null;
    setView(INITIAL_STATE);
  }, []);

  return {
    view,
    configResult,
    inFlight: inFlight.current,
    pendingSnapshot: pendingSnapshotRef.current,
    submit,
    retryStatus,
    resetView,
  };
}
