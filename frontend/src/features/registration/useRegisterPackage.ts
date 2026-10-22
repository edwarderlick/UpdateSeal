import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { getUpdateSealConfigResult } from '../../lib/updateSealConfig';
import type { EthereumProviderLike } from '../../lib/genlayerClient';
import type { PendingRegistrationSnapshot } from '../../types/updateSeal';
import { registryQueryKeys } from '../registry/registryQueryKeys';
import { useWallet } from '../wallet/useWallet';
import { useRegistration } from './RegistrationContext';
import {
  checkRegistrationStatus,
  submitRegistration,
  type RegistrationSubmitPhase,
  type SubmitRegistrationDeps,
  type SubmitRegistrationResult,
} from './submitRegistration';

export interface RegisterPackageViewState {
  phase: RegistrationSubmitPhase;
  message: string | null;
  fieldErrors: Record<string, string>;
  transactionHash: string | null;
  duplicatePath: string | null;
  duplicateUid: string | null;
  pendingSnapshot: PendingRegistrationSnapshot | null;
  estimatedFeeLabel: string | null;
}

const INITIAL_STATE: RegisterPackageViewState = {
  phase: 'review',
  message: null,
  fieldErrors: {},
  transactionHash: null,
  duplicatePath: null,
  duplicateUid: null,
  pendingSnapshot: null,
  estimatedFeeLabel: null,
};

export function useRegisterPackage(deps: SubmitRegistrationDeps = {}) {
  const queryClient = useQueryClient();
  const { formData, setLiveReceipt } = useRegistration();
  const { wallet, isWrongNetwork, openWalletModal, openNetworkModal, getEthereumProvider } = useWallet();
  const [view, setView] = useState<RegisterPackageViewState>(INITIAL_STATE);
  const inFlight = useRef(false);
  const pendingSnapshotRef = useRef<PendingRegistrationSnapshot | null>(null);
  const estimatedFeeLabelRef = useRef<string | null>(null);
  const configResult = getUpdateSealConfigResult();

  const storeSnapshot = useCallback((snapshot: PendingRegistrationSnapshot) => {
    pendingSnapshotRef.current = snapshot;
  }, []);

  const applyResult = useCallback((result: SubmitRegistrationResult) => {
    if (result.ok && result.phase === 'finalized') {
      pendingSnapshotRef.current = null;
      setLiveReceipt({
        packageUid: result.success.packageUid,
        transactionHash: result.success.transactionHash,
        publisher: result.success.record.publisher,
        repositoryUrl: result.success.record.repository_url,
        baselineCommitSha: result.success.record.baseline_commit_sha,
        charterHash: result.success.record.charter_hash,
        packageSlug: result.success.record.package_slug,
      });
      setView({
        phase: 'finalized',
        message: 'Registration finalized and accepted.',
        fieldErrors: {},
        transactionHash: result.success.transactionHash,
        duplicatePath: null,
        duplicateUid: null,
        pendingSnapshot: null,
        estimatedFeeLabel: null,
      });
      return;
    }
    if (result.ok && result.phase === 'demo') {
      pendingSnapshotRef.current = null;
      setView({
        phase: 'demo',
        message: null,
        fieldErrors: {},
        transactionHash: null,
        duplicatePath: null,
        duplicateUid: null,
        pendingSnapshot: null,
        estimatedFeeLabel: null,
      });
      return;
    }
    if (!result.ok) {
      const snapshot = result.snapshot ?? pendingSnapshotRef.current;
      if (snapshot) {
        pendingSnapshotRef.current = snapshot;
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
        duplicateUid: result.duplicate?.packageUid ?? null,
        pendingSnapshot: snapshot ?? null,
        estimatedFeeLabel:
          result.phase === 'fee_estimation_failed' || result.phase === 'fee_estimate_invalid'
            ? null
            : estimatedFeeLabelRef.current,
      });
    }
  }, [setLiveReceipt]);

  const submit = useCallback(async () => {
    if (inFlight.current) {
      return view;
    }
    inFlight.current = true;
    try {
      if (!configResult.ok) {
        const next: RegisterPackageViewState = {
          phase: 'config_invalid',
          message: configResult.error.userMessage,
          fieldErrors: {},
          transactionHash: view.transactionHash,
          duplicatePath: null,
          duplicateUid: null,
          pendingSnapshot: pendingSnapshotRef.current,
          estimatedFeeLabel: estimatedFeeLabelRef.current,
        };
        setView(next);
        return next;
      }

      if (configResult.config.dataMode === 'demo') {
        const next: RegisterPackageViewState = {
          ...INITIAL_STATE,
          phase: 'demo',
        };
        setView(next);
        return next;
      }

      if (!wallet.isConnected) {
        openWalletModal();
        const next: RegisterPackageViewState = {
          phase: 'wallet_required',
          message: 'Connect a wallet to register a package on Studio-dev.',
          fieldErrors: {},
          transactionHash: pendingSnapshotRef.current?.transactionHash ?? null,
          duplicatePath: null,
          duplicateUid: null,
          pendingSnapshot: pendingSnapshotRef.current,
          estimatedFeeLabel: estimatedFeeLabelRef.current,
        };
        setView(next);
        return next;
      }

      if (isWrongNetwork) {
        openNetworkModal();
        const next: RegisterPackageViewState = {
          phase: 'wrong_network',
          message: 'Switch to GenLayer Studio-dev (chain ID 61997) before registering.',
          fieldErrors: {},
          transactionHash: pendingSnapshotRef.current?.transactionHash ?? null,
          duplicatePath: null,
          duplicateUid: null,
          pendingSnapshot: pendingSnapshotRef.current,
          estimatedFeeLabel: estimatedFeeLabelRef.current,
        };
        setView(next);
        return next;
      }

      const provider = (await getEthereumProvider()) as EthereumProviderLike | null;
      const result = await submitRegistration(
        {
          form: formData,
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
                event.phase === 'estimating_fees'
                  ? null
                  : (event.transactionHash ?? current.transactionHash),
              pendingSnapshot: event.snapshot ?? current.pendingSnapshot,
              estimatedFeeLabel:
                event.phase === 'estimating_fees'
                  ? null
                  : (event.estimatedFeeLabel ?? current.estimatedFeeLabel),
              message:
                event.phase === 'estimating_fees'
                  ? 'Estimating Studio-dev transaction fee'
                  : event.phase === 'awaiting_wallet'
                    ? 'Approve the registration in your wallet.'
                    : event.phase === 'submitted'
                      ? 'Transaction submitted. Waiting does not mean the package is registered yet.'
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
    formData,
    getEthereumProvider,
    isWrongNetwork,
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
        message: `Checking transaction status for the original submitting wallet ${snapshot.senderAddress}. This does not submit a new registration.`,
      }));
      const result = await checkRegistrationStatus(
        {
          snapshot,
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
