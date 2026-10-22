import React, { useEffect } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../features/wallet/useWallet';
import {
  GENLAYER_CHAIN_ID,
  GENLAYER_CHAIN_NAME,
  GENLAYER_RPC_URL,
  GENLAYER_SYMBOL,
} from '../../lib/network';

export const WrongNetworkModal: React.FC = () => {
  const { isNetworkModalOpen, closeNetworkModal, switchToStudioNext, network, errorMessage } = useWallet();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNetworkModalOpen) {
        closeNetworkModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNetworkModalOpen, closeNetworkModal]);

  if (!isNetworkModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-charcoal/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 overflow-y-auto"
      onClick={closeNetworkModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="network-modal-title"
    >
      <div
        className="relative w-full max-w-3xl bg-[#FAF8F4] border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] my-auto text-brand-charcoal animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: High Urgency Banner Bar */}
        <div className="bg-brand-orange border-b-2 border-brand-charcoal px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-white text-lg leading-none">⚠</span>
            <div className="font-mono font-bold text-xs uppercase tracking-wider text-white">
              [NETWORK MISMATCH // CHAIN ID {network.chainId}]
            </div>
          </div>
          <button
            aria-label="Dismiss warning"
            className="w-7 h-7 bg-brand-charcoal text-white flex items-center justify-center font-mono font-bold text-xs hover:bg-white hover:text-brand-charcoal transition-colors border border-brand-charcoal cursor-pointer"
            onClick={closeNetworkModal}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 md:p-8 flex flex-col gap-6">
          {/* Top Critical Warning Callout */}
          <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E] relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="bg-brand-charcoal text-white font-mono text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
                  CRITICAL_STOP
                </span>
                <h2 id="network-modal-title" className="font-black text-sm uppercase tracking-tight text-brand-charcoal font-sans">
                  INCORRECT CHAIN DETECTED: {network.networkName} (Chain ID {network.chainId})
                </h2>
              </div>
              <div className="font-mono text-[10px] font-bold uppercase bg-white text-brand-charcoal border border-brand-charcoal px-2 py-0.5 w-fit shadow-[2px_2px_0px_#0B130E]">
                GATEWAY_LOCK: REJECT_EXECUTION
              </div>
            </div>
            <p className="text-xs leading-relaxed text-stone-800 font-medium font-sans">
              UpdateSeal is configured for {GENLAYER_CHAIN_NAME}. Public registry reads use the deployed contract. Writes remain unwired.
            </p>
          </div>

          {/* Provider Spec Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Incompatible Current Box */}
            <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] font-bold uppercase bg-brand-charcoal text-white px-2 py-0.5 tracking-wider">
                    CURRENT PROVIDER
                  </span>
                  <span className="font-mono text-[10px] font-bold bg-red-700 text-white px-2 py-0.5 border border-brand-charcoal flex items-center gap-1 shadow-[2px_2px_0px_#0B130E]">
                    REJECTED
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-stone-800 block">Chain</span>
                    <span className="font-black text-lg tracking-tight uppercase text-brand-charcoal font-sans">
                      {network.networkName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="bg-white/80 p-2 border border-brand-charcoal">
                      <span className="text-[9px] uppercase font-bold text-stone-600 block">Chain ID</span>
                      <span className="text-xs font-bold text-brand-charcoal">{network.chainId}</span>
                    </div>
                    <div className="bg-white/80 p-2 border border-brand-charcoal">
                      <span className="text-[9px] uppercase font-bold text-stone-600 block">Status</span>
                      <span className="text-xs font-bold text-red-700">INCOMPATIBLE</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-charcoal bg-white/70 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase font-mono">
                  <span>✕</span>
                  <span>State: Incompatible / Read-Only</span>
                </div>
              </div>
            </div>

            {/* Target Required Box */}
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] font-bold uppercase bg-brand-forest text-brand-pastelYellow px-2 py-0.5 tracking-wider border border-brand-charcoal">
                    TARGET PROTOCOL
                  </span>
                  <span className="font-mono text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 border border-brand-charcoal flex items-center gap-1 shadow-[2px_2px_0px_#0B130E]">
                    REQUIRED
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-stone-800 block">Target Chain</span>
                    <span className="font-black text-lg tracking-tight uppercase text-brand-charcoal font-sans">
                      {GENLAYER_CHAIN_NAME}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div className="bg-white/80 p-2 border border-brand-charcoal">
                      <span className="text-[9px] uppercase font-bold text-stone-600 block">Chain ID</span>
                      <span className="text-xs font-bold text-brand-charcoal">{GENLAYER_CHAIN_ID}</span>
                    </div>
                    <div className="bg-white/80 p-2 border border-brand-charcoal">
                      <span className="text-[9px] uppercase font-bold text-stone-600 block">Gas Token</span>
                      <span className="text-xs font-bold text-brand-charcoal">{GENLAYER_SYMBOL}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-charcoal bg-white/70 p-2.5 font-mono text-[11px] truncate text-stone-700">
                <span>RPC: {GENLAYER_RPC_URL}</span>
              </div>
            </div>
          </div>

          {/* Error Message if rejected */}
          {errorMessage && (
            <div className="bg-red-100 border-2 border-red-700 p-3 text-red-900 font-mono text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-brand-charcoal font-mono text-xs">
            <button
              type="button"
              onClick={closeNetworkModal}
              className="w-full sm:w-auto px-5 py-3 border-2 border-brand-charcoal text-brand-charcoal font-bold uppercase hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Continue in Read-Only Mode
            </button>

            <button
              type="button"
              onClick={switchToStudioNext}
              className="w-full sm:w-auto px-6 py-3.5 bg-brand-orange hover:bg-brand-orangeDark text-white font-bold uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Switch to {GENLAYER_CHAIN_NAME} ({GENLAYER_CHAIN_ID})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
