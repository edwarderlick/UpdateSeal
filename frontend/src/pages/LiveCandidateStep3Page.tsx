import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Wallet } from 'lucide-react';
import { CandidateStepper } from '../components/forms/CandidateStepper';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { useLiveCandidate } from '../features/candidate-release/LiveCandidateContext';
import { useSubmitCandidate } from '../features/candidate-release/useSubmitCandidate';
import { useWallet } from '../features/wallet/useWallet';
import { liveCandidateRecordPath, liveCandidateWizardPath, livePackagePath } from '../lib/registrationValidation';
import { deriveCandidateId, normalizeEvidenceHash } from '../lib/candidateValidation';
import { isEvidencePreflightCurrent } from '../lib/evidencePreflight';

function buttonLabel(args: {
  isConnected: boolean;
  isWrongNetwork: boolean;
  configInvalid: boolean;
  preflightOk: boolean;
  phase: string;
}): string {
  if (args.configInvalid) {
    return 'Submission unavailable';
  }
  if (!args.preflightOk && args.phase === 'review') {
    return 'Evidence preflight required';
  }
  if (!args.isConnected) {
    return 'Connect wallet to submit';
  }
  if (args.isWrongNetwork) {
    return 'Switch to Studio-dev';
  }
  if (args.phase === 'estimating_fees') {
    return 'Estimating Studio-dev transaction fee';
  }
  if (args.phase === 'awaiting_wallet') {
    return 'Awaiting wallet approval';
  }
  if (args.phase === 'submitted' || args.phase === 'waiting_consensus') {
    return 'Waiting for consensus';
  }
  if (args.phase === 'fee_estimation_failed' || args.phase === 'fee_estimate_invalid') {
    return 'Retry fee estimation';
  }
  if (args.phase === 'status_unknown') {
    return 'Check transaction status';
  }
  if (args.phase === 'wallet_rejected') {
    return 'Sign candidate in wallet';
  }
  if (args.phase === 'finalized') {
    return 'Open candidate record';
  }
  return 'Submit candidate';
}

export const LiveCandidateStep3Page: React.FC = () => {
  const navigate = useNavigate();
  const live = useLiveCandidate();
  const { wallet, isWrongNetwork, openWalletModal, openNetworkModal } = useWallet();
  const { view, configResult, submit, retryStatus } = useSubmitCandidate();
  const [hasAgreed, setHasAgreed] = useState(false);
  const packagePath = livePackagePath(live.packageRecord.publisher, live.packageRecord.package_slug);
  const evidencePath = liveCandidateWizardPath(live.packageRecord.publisher, live.packageRecord.package_slug, 'evidence');
  const hash = normalizeEvidenceHash(live.draft.evidenceHash.trim());
  const expectedId = deriveCandidateId(live.packageUid, live.draft.version.trim());
  const configInvalid = !configResult.ok;
  const preflightOk = Boolean(
    live.evidencePassed && isEvidencePreflightCurrent(live.evidencePassed, live.currentEvidenceInputs),
  );
  const staleOrMissingPreflight = !preflightOk && view.phase !== 'status_unknown' && view.phase !== 'finalized';
  const pending =
    view.phase === 'estimating_fees' ||
    view.phase === 'awaiting_wallet' ||
    view.phase === 'submitted' ||
    view.phase === 'waiting_consensus';

  const handleSubmit = async () => {
    if (configInvalid || !hasAgreed) {
      return;
    }
    if (staleOrMissingPreflight && view.phase !== 'status_unknown' && view.phase !== 'finalized') {
      return;
    }
    if (!wallet.isConnected) {
      openWalletModal();
      return;
    }
    if (isWrongNetwork) {
      openNetworkModal();
      return;
    }
    if (view.phase === 'status_unknown' && view.pendingSnapshot) {
      await retryStatus();
      return;
    }
    if (view.phase === 'finalized' && live.liveReceipt) {
      navigate(
        liveCandidateRecordPath(live.packageRecord.publisher, live.packageRecord.package_slug, live.liveReceipt.version),
      );
      return;
    }
    await submit();
  };

  const label = buttonLabel({
    isConnected: wallet.isConnected,
    isWrongNetwork,
    configInvalid,
    preflightOk,
    phase: view.phase,
  });

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150 pb-16" data-testid="live-candidate-step-confirm">
      <div className="bg-brand-cream border-b-2 border-brand-charcoal px-6 py-2.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/registry" className="text-stone-500 hover:text-brand-charcoal">
            Registry
          </Link>
          <span className="text-stone-400">/</span>
          <Link to={packagePath} className="bg-white px-2 py-0.5 border border-brand-charcoal font-bold">
            {live.packageRecord.package_slug}
          </Link>
          <span className="text-stone-400">/</span>
          <span className="sticker-badge bg-brand-orange text-white">CONFIRM SUBMISSION</span>
        </div>
        <DataModeBadge />
      </div>

      <CandidateStepper currentStep={3} mode="live" />

      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-3xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
            Review and submit candidate
          </h1>
          <p className="text-sm text-stone-700 max-w-2xl font-medium">
            This transaction calls <code className="font-mono font-bold">submit_candidate</code> only. The candidate remains PENDING. Evaluation is a separate future transaction and is not started here.
          </p>
        </div>
      </section>

      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {configInvalid && (
            <div className="bg-red-100 border-2 border-brand-charcoal p-4" role="alert">
              <div className="font-mono text-xs font-black uppercase text-red-800">Configuration error</div>
              <p className="text-sm">{configResult.ok ? 'Live submission is unavailable.' : configResult.error.userMessage}</p>
            </div>
          )}

          {staleOrMissingPreflight && (
            <div className="bg-red-100 border-2 border-brand-charcoal p-4" role="alert" data-testid="stale-evidence-preflight">
              <div className="font-mono text-xs font-black uppercase text-red-800">Evidence preflight is missing or stale</div>
              <p className="text-sm">
                Evidence inputs changed or preflight is missing. Return to the evidence step and rerun preflight before submitting.
              </p>
              <Link to={evidencePath} className="inline-flex mt-2 font-mono text-xs font-bold uppercase text-brand-orange underline">
                Return to evidence preflight
              </Link>
            </div>
          )}

          {view.phase !== 'review' && (
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E] space-y-3" role="status" data-testid="candidate-tx-panel">
              <div className="font-mono text-xs font-black uppercase">
                {view.phase === 'estimating_fees' && 'Estimating Studio-dev transaction fee'}
                {view.phase === 'awaiting_wallet' && 'Awaiting wallet approval'}
                {view.phase === 'submitted' && 'Submitted'}
                {view.phase === 'waiting_consensus' && 'Waiting for consensus'}
                {view.phase === 'finalized' && 'Finalized and accepted'}
                {view.phase === 'wallet_rejected' && 'Rejected by wallet'}
                {view.phase === 'wrong_network' && 'Wrong network'}
                {view.phase === 'wrong_publisher' && 'Wrong publisher'}
                {view.phase === 'contract_rejected' && 'Contract rejected'}
                {view.phase === 'rpc_interrupted' && 'RPC / network interruption'}
                {view.phase === 'status_unknown' && 'Status unknown'}
                {view.phase === 'duplicate' && 'Candidate already exists'}
                {view.phase === 'wallet_required' && 'Wallet required'}
                {view.phase === 'config_invalid' && 'Configuration error'}
                {view.phase === 'validation_error' && 'Fix candidate fields'}
                {view.phase === 'fee_estimation_failed' && 'Fee estimation failed'}
                {view.phase === 'fee_estimate_invalid' && 'Fee estimation failed'}
              </div>
              {view.message && <p className="text-sm text-stone-700">{view.message}</p>}
              {view.estimatedFeeLabel && view.phase !== 'estimating_fees' && (
                <p className="font-mono text-xs" data-testid="estimated-fee-label">
                  Maximum Studio-dev fee: {view.estimatedFeeLabel}
                </p>
              )}
              {view.transactionHash && view.phase !== 'estimating_fees' && (
                <p className="font-mono text-xs break-all">Transaction hash: {view.transactionHash}</p>
              )}
              {view.pendingSnapshot && (
                <p className="text-xs text-stone-600">
                  Status is being checked for the original submitting wallet {view.pendingSnapshot.senderAddress}. Form and wallet changes do not replace this snapshot.
                </p>
              )}
              {view.phase === 'status_unknown' && (
                <p className="text-xs text-stone-600">Timeout does not mean the transaction failed. Keep the hash and check status. Checking status polls this hash only and never submits again.</p>
              )}
              {view.duplicatePath && (
                <Link to={view.duplicatePath} className="inline-flex font-mono text-xs font-bold uppercase text-brand-orange underline" data-testid="duplicate-candidate-link">
                  Open candidate record {view.duplicateId}
                </Link>
              )}
              {view.phase === 'finalized' && live.liveReceipt && (
                <div className="space-y-2" data-testid="candidate-success-panel">
                  <p className="font-bold">Candidate submitted with PENDING status. Evaluation has not started.</p>
                  <div className="flex flex-wrap gap-3 font-mono text-xs font-bold uppercase">
                    <Link to={packagePath} className="text-brand-orange underline">
                      Live package
                    </Link>
                    <Link to="/registry" className="text-brand-orange underline">
                      Live registry
                    </Link>
                    <Link
                      to={liveCandidateRecordPath(live.packageRecord.publisher, live.packageRecord.package_slug, live.liveReceipt.version)}
                      className="text-brand-orange underline"
                    >
                      Candidate record
                    </Link>
                  </div>
                </div>
              )}
              {Object.entries(view.fieldErrors).map(([field, message]) => (
                <p key={field} className="text-error font-mono text-xs flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {field}: {message}
                </p>
              ))}
            </div>
          )}

          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3 font-mono text-xs">
            <div className="font-black uppercase">Submission values</div>
            <p>Package UID: {live.packageUid}</p>
            <p className="break-all">Publisher: {live.publisher}</p>
            <p className="break-all">Frozen baseline SHA: {live.baselineCommitSha}</p>
            <p className="break-all">Charter hash: {live.charterHash}</p>
            <p>Version: {live.draft.version}</p>
            <p className="break-all">Candidate commit SHA: {live.draft.candidateCommitSha}</p>
            <p className="break-all">Evidence URI: {live.draft.evidenceUri}</p>
            <p className="break-all">Evidence hash: {hash.ok ? hash.hash : live.draft.evidenceHash}</p>
            <p>Evidence preflight: {preflightOk ? 'passed (document checks only)' : 'not passed'}</p>
            <p>Expected candidate ID: {expectedId}</p>
            {view.estimatedFeeLabel && <p>Estimated maximum fee: {view.estimatedFeeLabel}</p>}
          </div>

          <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 text-xs">
            Only the registered package publisher may submit candidates. GitHub ownership is not implied. Studio-dev may reset. Transaction status is not persisted across a full browser refresh; keep the hash if you leave this page during consensus.
          </div>

          <label className="flex items-start gap-3 bg-white border-2 border-brand-charcoal p-4">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded-none"
            />
            <span className="text-xs">
              I understand this submits candidate metadata only. The candidate will be PENDING. Evaluation will not start in this transaction.
            </span>
          </label>

          <div className="flex items-center justify-between font-mono">
            <button
              type="button"
              onClick={() => navigate(evidencePath)}
              className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to evidence
            </button>
            {staleOrMissingPreflight ? null : (
            <button
              type="button"
              disabled={!hasAgreed || pending || configInvalid || (!preflightOk && view.phase === 'review')}
              onClick={() => {
                void handleSubmit();
              }}
              className={`px-7 py-3.5 font-bold text-xs uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 ${
                hasAgreed && !pending && !configInvalid && (preflightOk || view.phase !== 'review')
                  ? 'bg-brand-orange text-white cursor-pointer'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
              data-testid="live-submit-candidate"
            >
              {!wallet.isConnected ? <Wallet className="w-4 h-4" /> : null}
              {label}
            </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
