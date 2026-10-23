import React, { useEffect } from 'react';
import { QrCode, AlertTriangle, ExternalLink } from 'lucide-react';
import { useWallet } from '../../features/wallet/useWallet';

export const ConnectWalletModal: React.FC = () => {
  const { isWalletModalOpen, closeWalletModal, connectWallet, isProjectConfigured, errorMessage } = useWallet();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWalletModalOpen) {
        closeWalletModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWalletModalOpen, closeWalletModal]);

  if (!isWalletModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-brand-charcoal/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={closeWalletModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-auth-title"
    >
      <div
        className="relative w-full max-w-3xl bg-[#FAF8F4] border-2 border-brand-charcoal flex flex-col shadow-[8px_8px_0px_#0B130E] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-brand-forest text-white px-5 py-3 border-b-2 border-brand-charcoal flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-brand-pastelYellow flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-brand-orange border border-brand-charcoal"></span>
              [CONNECT OPERATOR KEY // PROTOCOL AUTH]
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-brand-charcoal border border-stone-700 px-2.5 py-1 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[10px] uppercase text-brand-pastelYellow tracking-wider font-bold">
                GENLAYER STUDIO-DEV (61997)
              </span>
            </div>
            <button
              aria-label="Close Authentication Modal"
              className="w-7 h-7 bg-white hover:bg-brand-orange hover:text-white text-brand-charcoal border border-brand-charcoal flex items-center justify-center font-mono text-sm font-bold shadow-[2px_2px_0px_#0B130E] transition-colors cursor-pointer"
              onClick={closeWalletModal}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body Canvas */}
        <div className="p-6 sm:p-8 flex flex-col gap-6 bg-[#FAF8F4]">
          {errorMessage && (
            <div className="bg-red-50 border-2 border-red-600 text-red-900 p-3 font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0B130E]">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Missing Project ID Callout if unconfigured */}
          {!isProjectConfigured && (
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 shadow-[3px_3px_0px_#0B130E] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-mono font-bold uppercase text-brand-charcoal block">
                  CONFIGURATION NOTICE: REOWN PROJECT ID NOT SET
                </span>
                <p className="text-stone-800 font-medium">
                  Set <code className="font-mono font-bold bg-white px-1 border border-brand-charcoal">VITE_REOWN_PROJECT_ID</code> in the public frontend environment to enable full public Reown AppKit wallet features.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 border-b-2 border-brand-charcoal pb-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 id="wallet-auth-title" className="text-2xl sm:text-3xl text-brand-charcoal uppercase font-black tracking-tight font-sans">
                Connect Operator Key
              </h1>
              <span className="bg-brand-orange text-white font-mono text-xs font-bold px-2 py-0.5 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                NETWORK: STUDIO-DEV
              </span>
            </div>
            <p className="font-mono text-xs text-stone-700 uppercase tracking-wider font-semibold">
              SELECT SECURE EVM KEY PROVIDER OR REOWN APPKIT TO CONNECT LIVE WALLET
            </p>
          </div>

          {/* Provider Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* MetaMask / Injected EIP-1193 */}
            <button
              type="button"
              className="group text-left p-5 bg-brand-pastelYellow border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0B130E] transition-all cursor-pointer flex flex-col justify-between gap-4"
              onClick={() => connectWallet('MetaMask')}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-brand-charcoal text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold shadow-[2px_2px_0px_#0B130E]">
                  ⚡
                </div>
                <span className="bg-brand-orange text-white font-mono text-[10px] font-bold px-2 py-0.5 border border-brand-charcoal uppercase">
                  INJECTED / BROWSER
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase text-brand-charcoal group-hover:text-brand-orange transition-colors tracking-tight font-sans">
                    Browser Wallet
                  </h3>
                  <span className="font-mono font-bold text-base text-brand-charcoal group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
                </div>
                <p className="text-xs font-medium text-stone-800 leading-relaxed font-sans">
                  MetaMask, Rabby, Coinbase Wallet, or any EIP-1193 / EIP-6963 injected browser extension.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-brand-charcoal/30 bg-black/5 px-2.5 py-1.5 border border-brand-charcoal">
                <span className="font-mono text-[10px] text-brand-charcoal uppercase font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-charcoal"></span> Chain 61997 Studio-dev
                </span>
                <span className="font-mono text-[9px] bg-brand-forest text-white px-1.5 py-0.5 font-bold uppercase">EIP-1193</span>
              </div>
            </button>

            {/* Reown AppKit / WalletConnect */}
            <button
              type="button"
              className={`group text-left p-5 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] transition-all flex flex-col justify-between gap-4 ${
                isProjectConfigured
                  ? 'bg-brand-pastelPink hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0B130E] cursor-pointer'
                  : 'bg-stone-200 opacity-80 cursor-not-allowed'
              }`}
              onClick={() => connectWallet('WalletConnect')}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-brand-orange text-white border border-brand-charcoal flex items-center justify-center font-bold shadow-[2px_2px_0px_#0B130E]">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="bg-brand-charcoal text-white font-mono text-[10px] font-bold px-2 py-0.5 border border-brand-charcoal uppercase">
                  {isProjectConfigured ? 'REOWN / QR' : 'PROJECT ID REQUIRED'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase text-brand-charcoal group-hover:text-brand-orangeDark transition-colors tracking-tight font-sans">
                    WalletConnect &amp; Mobile
                  </h3>
                  {isProjectConfigured && (
                    <span className="font-mono font-bold text-base text-brand-charcoal group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
                  )}
                </div>
                <p className="text-xs font-medium text-stone-800 leading-relaxed font-sans">
                  {isProjectConfigured
                    ? 'Connect via QR code with Rainbow, MetaMask Mobile, Safe multisig, or 300+ mobile wallets.'
                    : 'WalletConnect QR pairing is disabled until VITE_REOWN_PROJECT_ID is configured in the public frontend environment.'}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-brand-charcoal/30 bg-black/5 px-2.5 py-1.5 border border-brand-charcoal">
                <span className="font-mono text-[10px] text-brand-charcoal uppercase font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isProjectConfigured ? 'bg-brand-orange' : 'bg-stone-400'}`}></span>{' '}
                  {isProjectConfigured ? 'Reown AppKit Modal' : 'QR Unavailable'}
                </span>
                <span className="font-mono text-[9px] bg-brand-forest text-white px-1.5 py-0.5 font-bold uppercase">
                  {isProjectConfigured ? 'REOWN v1' : 'DISABLED'}
                </span>
              </div>
            </button>
          </div>

          {/* Installation Hint for users without a wallet */}
          <div className="bg-white border border-stone-300 p-4 font-mono text-xs text-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-brand-charcoal uppercase">No Web3 wallet installed?</span>
              <p className="text-[11px] text-stone-600 font-sans">
                Install MetaMask, Rabby, or use WalletConnect with a mobile wallet. UpdateSeal never requests private keys or seed phrases.
              </p>
            </div>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange hover:underline font-bold text-xs flex items-center gap-1 shrink-0"
            >
              <span>Get MetaMask</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
