import React, { useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import { useTransaction } from '../../features/transactions/TransactionContext';

export const TransactionConfirmationModal: React.FC = () => {
  const { isOpen, currentIntent, lifecycle, confirmSign, closeModal, simulateError, simulateReject } = useTransaction();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  if (!isOpen || !currentIntent) return null;

  const isSigning = lifecycle.status === 'SUBMITTED' || lifecycle.status === 'CONSENSUS_PENDING';
  const isFinalized = lifecycle.status === 'FINALIZED';
  const hasError = lifecycle.status === 'CONTRACT_ERROR' || lifecycle.status === 'WALLET_REJECTED';

  const eip712Payload = {
    contract: 'Contract integration pending (Studio Next)',
    method: currentIntent.intent.toLowerCase(),
    packageId: currentIntent.packageId,
    candidateSha: currentIntent.commitSha,
    charterMerkleRoot: currentIntent.charterMerkleRoot,
    operatorAddress: 'Connected Signer (Studio Next)',
    chainId: 61997,
    simulationNotice: 'Demo record • UpdateSeal intelligent contract integration pending',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-charcoal/85 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signing-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#FAF8F4] border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] my-auto flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-brand-forest text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-brand-charcoal">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-brand-orange animate-pulse"></span>
            <span className="font-mono text-xs tracking-wider uppercase text-white font-bold" id="signing-modal-title">
              [TRANSACTION INTENT PREVIEW // STUDIO NEXT 61997]
            </span>
          </div>
          <button
            aria-label="Close modal"
            className="text-white hover:bg-brand-orange hover:text-white px-2 py-0.5 font-mono text-xs font-bold transition-colors cursor-pointer border border-brand-charcoal"
            onClick={closeModal}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* Stepper Progress Indicator */}
          <div className="w-full border-2 border-brand-charcoal bg-stone-100 p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center font-mono">
              <div className="flex items-center justify-center gap-1.5 p-2 bg-brand-cream border border-brand-charcoal text-brand-charcoal font-bold">
                <Check className="w-4 h-4 text-emerald-800" />
                <span className="text-[11px] tracking-tight uppercase">1. Inscription Built</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 bg-brand-cream border border-brand-charcoal text-brand-charcoal font-bold">
                <Check className="w-4 h-4 text-emerald-800" />
                <span className="text-[11px] tracking-tight uppercase">2. Charter Verification</span>
              </div>
              <div
                className={`flex items-center justify-center gap-1.5 p-2 border-2 border-brand-charcoal font-black shadow-[2px_2px_0px_#0B130E] ${
                  isSigning || isFinalized
                    ? 'bg-brand-cream text-brand-charcoal'
                    : 'bg-brand-pastelYellow text-brand-charcoal'
                }`}
              >
                {!isSigning && !isFinalized && <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping"></span>}
                <span className="text-[11px] tracking-tight uppercase">3. Awaiting Signature</span>
              </div>
              <div
                className={`flex items-center justify-center gap-1.5 p-2 border ${
                  isSigning || isFinalized
                    ? 'bg-brand-pastelYellow border-brand-charcoal text-brand-charcoal font-black shadow-[2px_2px_0px_#0B130E]'
                    : 'bg-stone-50 border-stone-300 text-stone-500 font-medium'
                }`}
              >
                {isSigning && <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>}
                {isFinalized && <Check className="w-4 h-4 text-emerald-800" />}
                <span className="text-[11px] tracking-tight uppercase">4. Consensus Simulation</span>
              </div>
            </div>
          </div>

          {/* Dossier Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Card: Target Candidate */}
            <div className="md:col-span-7 bg-white border-2 border-brand-charcoal p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E]">
              <div>
                <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    TARGET PACKAGE IDENTITY
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 border border-emerald-300 uppercase">
                    EVM 61997
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-sans font-black text-xl text-brand-charcoal uppercase tracking-tight">
                    {currentIntent.packageName}
                  </h3>
                  <div className="font-mono text-xs text-stone-600 mt-0.5">{currentIntent.packageId}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block">Candidate Version</span>
                    <span className="font-bold text-brand-charcoal">{currentIntent.version}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase block">Commit SHA</span>
                    <span className="font-bold text-brand-charcoal">{currentIntent.commitSha.substring(0, 8)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-500">NETWORK:</span>
                <span className="font-bold text-brand-forest">GenLayer Studio Next (Chain 61997)</span>
              </div>
            </div>

            {/* Right Card: Non-Custodial Protocol Model */}
            <div className="md:col-span-5 bg-brand-forest text-white border-2 border-brand-charcoal p-5 flex flex-col justify-between space-y-4 shadow-[4px_4px_0px_#0B130E]">
              <div>
                <div className="flex items-center justify-between border-b border-stone-700 pb-2.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    PROTOCOL GOVERNANCE
                  </span>
                  <span className="bg-brand-pastelYellow text-brand-charcoal px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase">
                    STATELESS
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-black text-2xl text-white font-mono leading-none">Consensus Model</div>
                  <div className="font-mono text-xs text-brand-pastelYellow font-bold uppercase mt-1 tracking-wider">
                    CHARTER EVALUATION
                  </div>
                </div>
                <p className="text-xs text-stone-300 mt-3 leading-relaxed font-normal">
                  UpdateSeal evaluates software release safety through frozen capability charters. UpdateSeal v1 does not custody funds or implement slashing.
                </p>
              </div>

              <div className="bg-stone-900 border border-stone-700 p-3 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-pastelYellow block">Validator Quorum</span>
                  <span className="text-[11px] text-stone-300">5-of-5 LLMs required</span>
                </div>
                <div className="text-emerald-400 text-xs font-bold border border-emerald-500/50 bg-emerald-950/60 px-2 py-1">
                  DEMO MODE
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Inscription Buffer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase font-bold tracking-wider text-brand-charcoal flex items-center gap-1.5">
                <span className="w-2 h-2 bg-brand-orange"></span>
                CANONICAL EIP-712 INSCRIBED PAYLOAD
              </span>
              <span className="font-mono text-[10px] text-stone-500 uppercase font-bold">
                ESTIMATED INTERFACE ONLY
              </span>
            </div>
            <div className="bg-brand-charcoal text-stone-200 border-2 border-brand-charcoal p-4 overflow-x-auto relative shadow-[4px_4px_0px_#0B130E]">
              <div className="absolute right-3 top-3">
                <span className="px-2 py-0.5 bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] uppercase font-bold border border-brand-charcoal">
                  SIMULATION
                </span>
              </div>
              <pre className="font-mono text-xs leading-relaxed select-all text-stone-300">
                {JSON.stringify(eip712Payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Honest Demo Disclosure Banner */}
          <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 flex items-start gap-3.5 shadow-[4px_4px_0px_#0B130E]">
            <Info className="w-5 h-5 text-brand-charcoal shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono text-xs font-black text-brand-charcoal uppercase tracking-wide block">
                CONTRACT INTEGRATION PENDING
              </span>
              <p className="text-xs text-brand-charcoal font-sans leading-normal font-medium">
                The UpdateSeal intelligent contract is pending deployment on GenLayer Studio Next. Clicking confirm will simulate the consensus evaluation lifecycle for demonstration purposes. No live transactions will be submitted on-chain.
              </p>
            </div>
          </div>

          {/* Error Message if Simulated */}
          {hasError && (
            <div className="bg-error/10 border-2 border-error p-3 text-error font-mono text-xs">
              <strong>TRANSACTION STATUS: </strong> {lifecycle.errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <button
                className="px-5 py-3.5 bg-brand-cream border-2 border-brand-charcoal text-brand-charcoal hover:bg-stone-200 font-mono text-xs uppercase font-bold tracking-wider transition-colors text-center cursor-pointer shadow-[2px_2px_0px_#0B130E]"
                onClick={closeModal}
              >
                Cancel / Return
              </button>

              <button
                disabled={isSigning || isFinalized}
                className="px-7 py-4 bg-brand-orange text-white hover:bg-brand-charcoal disabled:opacity-60 disabled:cursor-not-allowed border-2 border-brand-charcoal font-mono text-xs uppercase font-black tracking-wide shadow-[4px_4px_0px_#0B130E] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer"
                onClick={confirmSign}
              >
                <span>CONFIRM &amp; SIGN TRANSACTION IN WALLET</span>
                <span className="text-base leading-none">→</span>
              </button>
            </div>

            {/* Simulation Helpers for testing/inspection */}
            <div className="flex items-center justify-end gap-3 pt-2 text-[10px] font-mono text-stone-500">
              <button
                className="hover:underline cursor-pointer"
                onClick={simulateError}
              >
                Simulate Contract Error
              </button>
              <span>•</span>
              <button
                className="hover:underline cursor-pointer"
                onClick={simulateReject}
              >
                Simulate User Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
