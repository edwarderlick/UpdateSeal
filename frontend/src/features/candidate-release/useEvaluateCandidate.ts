import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getUpdateSealConfigResult } from '../../lib/updateSealConfig';
import type { EthereumProviderLike } from '../../lib/genlayerClient';
import {
  clearEvaluationSnapshot,
  loadEvaluationSnapshot,
} from '../../lib/evaluationReceipt';
import { registryQueryKeys } from '../registry/registryQueryKeys';
import { useWallet } from '../wallet/useWallet';
import {
  checkEvaluationStatus,
  estimateLiveEvaluation,
  submitLiveEvaluation,
  type EvaluateCandidateOrchestrationDeps,
  type EvaluateCandidateResult,
  type EvaluatePhase,
} from './evaluateCandidate';
import type {
  EvaluationConfirmation,
  EvaluationFeeEstimate,
  OnChainCandidateRecord,
  OnChainPackageRecord,
  PendingEvaluationSnapshot,
} from '../../types/updateSeal';
import { getEvaluationAction, isCandidateEvaluationEligible, isTerminalEvaluationStatus } from '../../lib/evaluationEligibility';

export interface EvaluateCandidateViewState {
  phase: EvaluatePhase;
  message: string | null;
  transactionHash: string | null;
  pendingSnapshot: PendingEvaluationSnapshot | null;
  confirmation: EvaluationConfirmation | null;
  estimate: EvaluationFeeEstimate | null;
  resultStatus: string | null;
  resultAttempts: number | null;
}

const INITIAL_STATE: EvaluateCandidateViewState = {
  phase: 'idle',
  message: null,
  transactionHash: null,
  pendingSnapshot: null,
  confirmation: null,
  estimate: null,
  resultStatus: null,
  resultAttempts: null,
};

export function useEvaluateCandidate(
  args: {
    candidate: OnChainCandidateRecord | null;
    packageRecord: OnChainPackageRecord | null;
  },
  deps: EvaluateCandidateOrchestrationDeps = {},
) {
  const queryClient = useQueryClient();
  const { wallet, isWrongNetwork, openWalletModal, openNetworkModal, getEthereumProvider } = useWallet();
  const configResult = getUpdateSealConfigResult();
  const [view, setView] = useState<EvaluateCandidateViewState>(INITIAL_STATE);
  const inFlight = useRef(false);
  const estimateIdentity = useRef<string>('');
  const snapshotRef = useRef<PendingEvaluationSnapshot | null>(null);
  const confirmationRef = useRef<EvaluationConfirmation | null>(null);

  const candidateId = args.candidate?.candidate_id ?? '';
  const liveConfig = configResult.ok ? configResult.config : null;
  const liveChainId = liveConfig?.chainId;
  const liveContractAddress = liveConfig?.contractAddress;

  useEffect(() => {
    if (liveChainId === undefined || !liveContractAddress || !candidateId) {
      snapshotRef.current = null;
      setView(INITIAL_STATE);
      return;
    }
    const stored = (deps.loadSnapshotFn ?? loadEvaluationSnapshot)(
      liveChainId,
      liveContractAddress,
      candidateId,
    );
    snapshotRef.current = stored;
    confirmationRef.current = null;
    estimateIdentity.current = '';
    setView({
      ...INITIAL_STATE,
      pendingSnapshot: stored,
      transactionHash: stored?.transactionHash ?? null,
      phase: stored ? 'evaluation_already_pending' : 'idle',
      message: stored
        ? 'An unresolved evaluation transaction exists for this candidate. Check the existing transaction.'
        : null,
    });
  }, [candidateId, liveChainId, liveContractAddress, deps.loadSnapshotFn]);

  useEffect(() => {
    confirmationRef.current = null;
    estimateIdentity.current = '';
    setView((current) => ({
      ...current,
      confirmation: null,
      estimate: null,
      phase: current.pendingSnapshot ? current.phase : 'idle',
    }));
  }, [wallet.address, wallet.chainId, candidateId, args.candidate?.status, args.candidate?.evaluation_attempts]);

  const applyResult = useCallback(
    (result: EvaluateCandidateResult) => {
      if (result.ok && result.phase === 'finalized') {
        snapshotRef.current = null;
        confirmationRef.current = null;
        const remainingUnavailable = result.success.status === 'EVIDENCE_UNAVAILABLE';
        const attemptsExhausted = remainingUnavailable && !isCandidateEvaluationEligible(
          result.success.status,
          result.success.record.evaluation_attempts,
        );
        setView({
          phase: 'finalized',
          message: remainingUnavailable
            ? attemptsExhausted
              ? 'Evaluation transaction succeeded. Evidence remains unavailable. Maximum evaluation attempts reached. The deployed contract will reject additional evaluation requests.'
              : 'Evaluation transaction succeeded. Evidence remains unavailable. A future retry requires a new confirmation, fee, and transaction.'
            : `Evaluation complete. Status: ${result.success.status}.`,
          transactionHash: result.success.transactionHash,
          pendingSnapshot: null,
          confirmation: null,
          estimate: null,
          resultStatus: result.success.status,
          resultAttempts: result.success.record.evaluation_attempts,
        });
        void queryClient.invalidateQueries({ queryKey: registryQueryKeys.all });
        return;
      }
      if (result.ok && result.phase === 'ready') {
        confirmationRef.current = result.confirmation;
        setView({
          phase: 'ready',
          message: null,
          transactionHash: snapshotRef.current?.transactionHash ?? null,
          pendingSnapshot: snapshotRef.current,
          confirmation: result.confirmation,
          estimate: result.estimate,
          resultStatus: null,
          resultAttempts: null,
        });
        return;
      }
      if (!result.ok) {
        if (result.snapshot) {
          snapshotRef.current = result.snapshot;
        }
        const dropConfirmation =
          result.phase === 'stale_confirmation' || result.phase === 'max_evaluation_attempts';
        setView({
          phase: result.phase,
          message: result.message,
          transactionHash: result.transactionHash ?? snapshotRef.current?.transactionHash ?? null,
          pendingSnapshot: result.snapshot ?? snapshotRef.current,
          confirmation: dropConfirmation ? null : confirmationRef.current,
          estimate: dropConfirmation ? null : confirmationRef.current?.estimate ?? null,
          resultStatus: null,
          resultAttempts: null,
        });
        if (dropConfirmation) {
          confirmationRef.current = null;
          void queryClient.invalidateQueries({ queryKey: registryQueryKeys.all });
        }
      }
    },
    [queryClient],
  );

  const estimate = useCallback(async () => {
    if (inFlight.current || !args.candidate) {
      return view;
    }
    if (snapshotRef.current) {
      const next: EvaluateCandidateViewState = {
        ...view,
        phase: 'evaluation_already_pending',
        message: 'An unresolved evaluation transaction exists for this candidate. Check the existing transaction.',
        pendingSnapshot: snapshotRef.current,
        transactionHash: snapshotRef.current.transactionHash,
      };
      setView(next);
      return next;
    }
    inFlight.current = true;
    setView((current) => ({ ...current, phase: 'estimating_fees', message: null }));
    try {
      if (!configResult.ok) {
        const next: EvaluateCandidateViewState = {
          ...INITIAL_STATE,
          phase: 'config_invalid',
          message: configResult.error.userMessage,
        };
        setView(next);
        return next;
      }
      const provider = (await getEthereumProvider()) as EthereumProviderLike | null;
      const result = await estimateLiveEvaluation(
        {
          candidateId: args.candidate.candidate_id,
          connectedAddress: wallet.address,
          isConnected: wallet.isConnected,
          chainId: wallet.chainId,
          provider,
          unresolvedSnapshot: snapshotRef.current,
          configResult,
        },
        deps,
      );
      if (result.ok && result.phase === 'ready') {
        estimateIdentity.current = `${wallet.address}:${wallet.chainId}:${args.candidate.candidate_id}`;
      }
      applyResult(result);
      return view;
    } finally {
      inFlight.current = false;
    }
  }, [args.candidate, applyResult, configResult, deps, getEthereumProvider, view, wallet.address, wallet.chainId, wallet.isConnected]);

  const submit = useCallback(async () => {
    if (inFlight.current || !args.candidate) {
      return view;
    }
    const confirmation = confirmationRef.current;
    if (!confirmation) {
      return view;
    }
    if (snapshotRef.current) {
      return view;
    }
    inFlight.current = true;
    setView((current) => ({ ...current, phase: 'awaiting_wallet' }));
    try {
      const provider = (await getEthereumProvider()) as EthereumProviderLike | null;
      const result = await submitLiveEvaluation(
        {
          candidateId: args.candidate.candidate_id,
          connectedAddress: wallet.address,
          isConnected: wallet.isConnected,
          chainId: wallet.chainId,
          provider,
          unresolvedSnapshot: snapshotRef.current,
          configResult,
          confirmation,
        },
        deps,
      );
      applyResult(result);
      return view;
    } finally {
      inFlight.current = false;
    }
  }, [args.candidate, applyResult, configResult, deps, getEthereumProvider, view, wallet.address, wallet.chainId, wallet.isConnected]);

  const checkStatus = useCallback(async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot || inFlight.current) {
      return view;
    }
    inFlight.current = true;
    setView((current) => ({ ...current, phase: 'waiting_consensus', message: 'Checking existing transaction…' }));
    try {
      const result = await checkEvaluationStatus({ snapshot, configResult }, deps);
      applyResult(result);
      return view;
    } finally {
      inFlight.current = false;
    }
  }, [applyResult, configResult, deps, view]);

  const clearTerminalSnapshot = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (!snapshot || !liveConfig) {
      return;
    }
    const terminal =
      view.phase === 'transaction_rejected' ||
      view.phase === 'finalized' ||
      view.phase === 'user_rejected';
    if (!terminal && view.phase !== 'status_unknown') {
      return;
    }
    if (view.phase === 'status_unknown') {
      return;
    }
    (deps.clearSnapshotFn ?? clearEvaluationSnapshot)(snapshot.chainId, snapshot.contractAddress, snapshot.candidateId);
    snapshotRef.current = null;
    setView(INITIAL_STATE);
  }, [deps.clearSnapshotFn, liveConfig, view.phase]);

  const connectToEvaluate = useCallback(() => {
    openWalletModal();
  }, [openWalletModal]);

  const evaluationAction = getEvaluationAction(args.candidate?.status, args.candidate?.evaluation_attempts);
  const pending = evaluationAction === 'request';
  const eligible = isCandidateEvaluationEligible(args.candidate?.status, args.candidate?.evaluation_attempts);
  const completed = isTerminalEvaluationStatus(args.candidate?.status);
  const canEstimate =
    eligible &&
    configResult.ok &&
    configResult.config.dataMode === 'live' &&
    wallet.isConnected &&
    !isWrongNetwork &&
    !view.pendingSnapshot &&
    view.phase !== 'estimating_fees' &&
    view.phase !== 'awaiting_wallet' &&
    view.phase !== 'submitted' &&
    view.phase !== 'waiting_consensus';
  const canSubmit =
    canEstimate &&
    view.phase === 'ready' &&
    Boolean(view.confirmation) &&
    Boolean(view.estimate) &&
    view.estimate?.feeValue !== undefined &&
    view.estimate.feeValue > 0n;

  return {
    view,
    configResult,
    wallet,
    isWrongNetwork,
    evaluationAction,
    pending,
    eligible,
    completed,
    canEstimate,
    canSubmit,
    inFlight: inFlight.current,
    estimate,
    submit,
    checkStatus,
    clearTerminalSnapshot,
    connectToEvaluate,
    openNetworkModal,
    packageRecord: args.packageRecord,
  };
}
