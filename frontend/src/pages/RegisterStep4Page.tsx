import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Wallet } from 'lucide-react';
import { useRegistration } from '../features/registration/RegistrationContext';
import { useRegisterPackage } from '../features/registration/useRegisterPackage';
import { useWallet } from '../features/wallet/useWallet';
import { RegisterStepper } from '../components/forms/RegisterStepper';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { livePackagePath } from '../lib/registrationValidation';
import { buildCharterFromRegistration } from '../lib/charterFromWizard';

function buttonLabel(args: {
  isConnected: boolean;
  isWrongNetwork: boolean;
  configInvalid: boolean;
  phase: string;
}): string {
  if (args.configInvalid) {
    return 'Registration unavailable';
  }
  if (!args.isConnected) {
    return 'Connect wallet to register';
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
    return 'Sign registration in wallet';
  }
  if (
    args.phase === 'contract_rejected' ||
    args.phase === 'transaction_preparation_failed' ||
    args.phase === 'duplicate' ||
    args.phase === 'rpc_interrupted'
  ) {
    return 'Review and try again';
  }
  if (args.phase === 'finalized') {
    return 'Open live package';
  }
  return 'Register package';
}

export const RegisterStep4Page: React.FC = () => {
  const navigate = useNavigate();
  const { formData, liveReceipt } = useRegistration();
  const { wallet, isWrongNetwork, openWalletModal, openNetworkModal } = useWallet();
  const { view, configResult, submit, retryStatus } = useRegisterPackage();
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const configInvalid = !configResult.ok;
  const isDemo = configResult.ok && configResult.config.dataMode === 'demo';
  const pending =
    view.phase === 'estimating_fees' ||
    view.phase === 'awaiting_wallet' ||
    view.phase === 'submitted' ||
    view.phase === 'waiting_consensus';
  const charter = formData.capabilityCharter;
  const onChainCharter = buildCharterFromRegistration(formData);

  const handleRegisterAction = async () => {
    if (configInvalid) {
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
    if (isDemo) {
      setShowDemoNotice(true);
      return;
    }
    if (view.phase === 'status_unknown' && view.pendingSnapshot) {
      await retryStatus();
      return;
    }
    if (view.phase === 'finalized') {
      if (liveReceipt) {
        navigate(livePackagePath(liveReceipt.publisher, liveReceipt.packageSlug));
        return;
      }
      if (view.pendingSnapshot) {
        navigate(livePackagePath(view.pendingSnapshot.senderAddress, view.pendingSnapshot.packageSlug));
        return;
      }
    }
    const result = await submit();
    if (result && 'ok' in result && result.ok && result.phase === 'finalized') {
      navigate('/register/success');
    }
  };

  const label = buttonLabel({
    isConnected: wallet.isConnected,
    isWrongNetwork,
    configInvalid,
    phase: view.phase,
  });

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <RegisterStepper currentStep={4} />

      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                STAGE 04 / FINAL DOSSIER REVIEW
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] -rotate-1">
                IMMUTABLE BASELINE
              </span>
              <DataModeBadge />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none text-brand-charcoal font-sans">
              REVIEW CHARTER &amp; SEAL INITIAL BASELINE
            </h1>
            <p className="text-sm text-stone-700 max-w-2xl leading-relaxed font-medium">
              Verify all declared capabilities and baseline commit parameters before signing. Once broadcast to GenLayer Studio-dev, this charter becomes an immutable security specification.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-4xl mx-auto space-y-6">
          {isDemo && (
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 font-mono text-xs font-bold uppercase" data-testid="demo-registration-banner">
              DEMO DATA — simulated registration only. No Studio-dev write is sent.
            </div>
          )}

          {configInvalid && (
            <div className="bg-red-100 border-2 border-brand-charcoal p-4 space-y-2" role="alert" data-testid="registration-config-error">
              <div className="font-mono text-xs font-black uppercase text-red-800">Configuration error</div>
              <p className="text-sm text-stone-800">
                {configResult.ok ? 'Live registration is unavailable.' : configResult.error.userMessage}
              </p>
              <p className="text-xs text-stone-600 font-mono">
                Set VITE_UPDATESEAL_DATA_MODE, VITE_GENLAYER_RPC_URL, VITE_GENLAYER_CHAIN_ID, and VITE_UPDATESEAL_CONTRACT_ADDRESS. See the frontend README.
              </p>
            </div>
          )}

          {showDemoNotice && isDemo && (
            <div
              className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E] space-y-4 animate-in fade-in duration-100"
              role="alert"
              data-testid="demo-registration-notice"
            >
              <div className="flex items-center justify-between pb-2 border-b border-brand-charcoal font-mono text-xs font-bold">
                <span className="text-brand-orange uppercase flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-brand-orange inline-block"></span>
                  DEMO DATA
                </span>
                <button
                  type="button"
                  onClick={() => setShowDemoNotice(false)}
                  className="text-brand-charcoal hover:bg-white px-2 py-0.5 border border-brand-charcoal"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-medium text-stone-800 leading-relaxed font-sans">
                Demo mode simulates package registration. No wallet signature is requested and no Studio-dev RPC write is sent.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => navigate('/register/success')}
                  className="px-5 py-2.5 bg-brand-forest text-brand-pastelYellow font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] hover:bg-brand-orange hover:text-white transition-colors"
                >
                  Preview example receipt →
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoNotice(false)}
                  className="px-4 py-2.5 bg-white text-brand-charcoal font-bold uppercase border border-brand-charcoal hover:bg-stone-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {view.phase !== 'review' && view.phase !== 'demo' && (
            <div
              className="bg-white border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E] space-y-3"
              role="status"
              data-testid="registration-tx-panel"
            >
              <div className="font-mono text-xs font-black uppercase text-brand-charcoal">
                {view.phase === 'estimating_fees' && 'Estimating Studio-dev transaction fee'}
                {view.phase === 'awaiting_wallet' && 'Awaiting wallet approval'}
                {view.phase === 'submitted' && 'Submitted'}
                {view.phase === 'waiting_consensus' && 'Waiting for consensus'}
                {view.phase === 'finalized' && 'Finalized and accepted'}
                {view.phase === 'wallet_rejected' && 'Rejected by wallet'}
                {view.phase === 'wrong_network' && 'Wrong network'}
                {view.phase === 'contract_rejected' && 'Contract rejected'}
                {view.phase === 'transaction_preparation_failed' && 'Transaction could not be prepared'}
                {view.phase === 'rpc_interrupted' && 'RPC / network interruption'}
                {view.phase === 'status_unknown' && 'Status unknown'}
                {view.phase === 'duplicate' && 'Package already registered'}
                {view.phase === 'wallet_required' && 'Wallet required'}
                {view.phase === 'config_invalid' && 'Configuration error'}
                {view.phase === 'validation_error' && 'Fix registration fields'}
                {view.phase === 'fee_estimation_failed' && 'Fee estimation failed'}
                {view.phase === 'fee_estimate_invalid' && 'Fee estimation failed'}
              </div>
              {view.message && (
                <p className="text-sm text-stone-700">{view.message}</p>
              )}
              {view.estimatedFeeLabel && view.phase !== 'estimating_fees' && (
                <p className="font-mono text-xs" data-testid="estimated-fee-label">
                  Maximum Studio-dev fee: {view.estimatedFeeLabel}
                </p>
              )}
              {view.transactionHash && view.phase !== 'estimating_fees' && (
                <p className="font-mono text-xs break-all">
                  Transaction hash: {view.transactionHash}
                </p>
              )}
              {view.pendingSnapshot && (
                <p className="text-xs text-stone-600" data-testid="original-submitter-note">
                  Status is being checked for the original submitting wallet {view.pendingSnapshot.senderAddress}.
                </p>
              )}
              {view.phase === 'status_unknown' && (
                <p className="text-xs text-stone-600">
                  Timeout does not mean the transaction failed. Keep the hash and check status.
                </p>
              )}
              {view.duplicatePath && (
                <Link
                  to={view.duplicatePath}
                  className="inline-flex font-mono text-xs font-bold uppercase text-brand-orange underline"
                  data-testid="duplicate-package-link"
                >
                  Open live package {view.duplicateUid}
                </Link>
              )}
              {Object.entries(view.fieldErrors).map(([field, message]) => (
                <p key={field} className="text-error font-mono text-xs flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {field}: {message}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-charcoal">
                <span className="font-mono text-xs font-black uppercase text-stone-500">[01] PACKAGE IDENTITY</span>
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5">
                  VALIDATED
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div>
                  <span className="text-stone-500 uppercase block text-[10px]">Display Name</span>
                  <span className="font-bold text-brand-charcoal">{formData.displayName}</span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block text-[10px]">Package slug</span>
                  <span className="font-bold text-brand-charcoal">{formData.packageId}</span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block text-[10px]">Repository</span>
                  <span className="text-brand-orange font-bold break-all">{formData.repositoryUrl}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-charcoal">
                <span className="font-mono text-xs font-black uppercase text-stone-500">[02] BASELINE COMMIT</span>
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5">
                  PINNED
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div>
                  <span className="text-stone-500 uppercase block text-[10px]">Release Version</span>
                  <span className="font-bold text-brand-charcoal">{formData.baselineVersion}</span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block text-[10px]">Git Tree SHA</span>
                  <span className="font-bold text-brand-charcoal break-all">{formData.baselineCommitSha}</span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block text-[10px]">Verification Target</span>
                  <span className="font-bold text-emerald-800">GenLayer Studio-dev (61997)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-charcoal">
              <span className="font-mono text-xs font-black uppercase text-stone-500">[03] CAPABILITY CHARTER BOUNDARIES</span>
              <span className="bg-brand-pastelYellow text-brand-charcoal border border-brand-charcoal font-mono text-[10px] font-bold px-2 py-0.5">
                6 POLICIES FROZEN
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3 bg-stone-50 border border-brand-charcoal">
                <span className="text-[10px] text-stone-500 uppercase block">Network Egress</span>
                <span className="font-bold text-brand-charcoal uppercase">{charter.network_egress.policy}</span>
                <span className="text-[10px] text-stone-600 block mt-1">3 domains allowlisted</span>
              </div>
              <div className="p-3 bg-stone-50 border border-brand-charcoal">
                <span className="text-[10px] text-stone-500 uppercase block">Filesystem</span>
                <span className="font-bold text-brand-charcoal uppercase">{charter.file_system.policy}</span>
                <span className="text-[10px] text-stone-600 block mt-1">Jailed workspace</span>
              </div>
              <div className="p-3 bg-stone-50 border border-brand-charcoal">
                <span className="text-[10px] text-stone-500 uppercase block">Process Exec</span>
                <span className="font-bold text-red-700 uppercase">{charter.process_execution.policy}</span>
                <span className="text-[10px] text-stone-600 block mt-1">Subshells prohibited</span>
              </div>
              <div className="p-3 bg-stone-50 border border-brand-charcoal">
                <span className="text-[10px] text-stone-500 uppercase block">Cryptographic Signing</span>
                <span className="font-bold text-brand-charcoal uppercase">{charter.cryptographic_signing.policy}</span>
                <span className="text-[10px] text-stone-600 block mt-1">Airgapped</span>
              </div>
              <div className="p-3 bg-stone-50 border border-brand-charcoal">
                <span className="text-[10px] text-stone-500 uppercase block">Spending Limits</span>
                <span className="font-bold text-brand-charcoal uppercase">{charter.spending_limits.policy}</span>
                <span className="text-[10px] text-stone-600 block mt-1">Cap: 10 GEN / 24h</span>
              </div>
              <div className="p-3 bg-stone-50 border border-brand-charcoal">
                <span className="text-[10px] text-stone-500 uppercase block">External Export</span>
                <span className="font-bold text-brand-charcoal uppercase">{charter.external_data_export.policy}</span>
                <span className="text-[10px] text-stone-600 block mt-1">Encrypted schema</span>
              </div>
            </div>

            {onChainCharter.ok && (
              <div className="bg-stone-50 border border-brand-charcoal p-3 font-mono text-[11px] space-y-1">
                <div className="font-black uppercase text-stone-500">On-chain charter v1</div>
                <div>summary: {onChainCharter.charter.summary}</div>
                <div>allowed: {onChainCharter.charter.allowed_capabilities.join(', ') || '—'}</div>
                <div>forbidden: {onChainCharter.charter.forbidden_capabilities.join(', ') || '—'}</div>
                <div>domains: {onChainCharter.charter.allowed_domains.join(', ') || '—'}</div>
                <div>required evidence: {onChainCharter.charter.required_evidence.join(', ') || '—'}</div>
              </div>
            )}
          </div>

          <div className="bg-brand-forest text-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="font-mono text-xs text-brand-pastelYellow uppercase font-bold tracking-wider">
                NON-CUSTODIAL CHARTER RATIFICATION
              </span>
              <div className="text-xl font-black font-sans text-white">UpdateSeal Governance v1</div>
              <p className="text-xs text-stone-300 font-mono">
                Registration proves which wallet registered the package. It does not prove GitHub repository ownership. Candidate submission and evaluation remain unwired.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegisterAction}
              disabled={pending || configInvalid}
              data-testid="register-package-submit"
              className="w-full md:w-auto px-8 py-4 bg-brand-orange hover:bg-brand-charcoal text-white font-mono text-xs uppercase font-black tracking-wider border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!wallet.isConnected ? (
                <>
                  <Wallet className="w-4 h-4 text-brand-pastelYellow" />
                  <span>{label}</span>
                </>
              ) : (
                <span>{label}</span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 font-mono">
            <button
              type="button"
              onClick={() => navigate('/register/capabilities')}
              className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Capability Charter
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
