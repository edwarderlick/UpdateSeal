import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ExternalLink,
  Menu,
  X,
  Wallet,
  Compass,
  Layers,
  Binary,
  Activity,
  Terminal,
  BookOpen,
  Info,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useWallet } from '../../features/wallet/useWallet';
import { DataModeBadge } from '../ui/DataModeBadge';
import { getUpdateSealConfigResult } from '../../lib/updateSealConfig';

export const AppHeader: React.FC = () => {
  const location = useLocation();
  const configResult = getUpdateSealConfigResult();
  const {
    wallet,
    isConnecting,
    isWrongNetwork,
    errorMessage,
    clearError,
    openWalletModal,
    openNetworkModal,
    disconnectWallet,
    switchToStudioNext,
    copyAddress,
    viewOnExplorer,
    copied,
  } = useWallet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoDisclosure, setShowDemoDisclosure] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDemoDisclosure(false);
        setWalletMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Compass },
    { to: '/registry', label: 'Registry', count: '4', icon: Layers },
    { to: '/how-it-works', label: 'How It Works', icon: BookOpen },
    { to: '/verify', label: 'Verify Release', icon: Binary },
    { to: '/activity', label: 'Activity', icon: Activity },
    { to: '/dashboard', label: 'My Packages', icon: Terminal },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const shortenedAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  return (
    <>
      {/* Top Network & Site-Wide Status Indicator Bar */}
      <aside
        className="bg-brand-charcoal text-stone-300 text-xs py-1.5 px-4 border-b border-stone-800 flex flex-wrap justify-between items-center z-50 select-none relative gap-2"
        data-purpose="network-indicator-bar"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Site-wide Status Indicator */}
          <div className="relative inline-flex items-center gap-1.5">
            <span data-testid="demo-data-indicator">
              <DataModeBadge />
            </span>
            <button
              type="button"
              onClick={() => setShowDemoDisclosure(!showDemoDisclosure)}
              aria-label="Demo data disclosure information"
              aria-expanded={showDemoDisclosure}
              className="p-0.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Demo data disclosure"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Accessible Info Popover */}
            {showDemoDisclosure && (
              <div
                role="dialog"
                aria-label="Data disclosure details"
                className="absolute left-0 top-7 z-50 w-80 sm:w-96 bg-[#FAF8F4] border-2 border-brand-charcoal p-4 text-brand-charcoal shadow-[6px_6px_0px_#0B130E] text-xs font-sans animate-in fade-in duration-100"
              >
                <div className="flex items-start justify-between gap-2 border-b border-brand-charcoal pb-2 mb-2 font-mono">
                  <span className="font-bold text-[10px] uppercase text-brand-orange flex items-center gap-1">
                    <span className="w-2 h-2 bg-brand-orange inline-block"></span>
                    DATA BOUNDARY DISCLOSURE
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDemoDisclosure(false)}
                    aria-label="Close disclosure"
                    className="text-brand-charcoal hover:bg-stone-200 px-1 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
                <p className="leading-relaxed text-stone-800 font-medium font-sans">
                  {configResult.ok && configResult.config.dataMode === 'live'
                    ? 'Public registry reads come from the deployed UpdateSealRegistry on Studio-dev. Writes, candidate submission, and evaluation remain unwired. Studio-dev may reset.'
                    : 'Wallet and network information can be live. Package, release, review, validator, block and transaction records are demonstration data in demo mode.'}
                </p>
                <div className="mt-3 pt-2 border-t border-brand-charcoal/30 font-mono text-[10px] text-stone-600 flex justify-between">
                  <span>NETWORK: STUDIO-DEV (61997)</span>
                  <span className="font-bold text-brand-forest">READS ONLY • WRITES UNWIRED</span>
                </div>
              </div>
            )}
          </div>

          <span className="hidden md:inline text-stone-500">|</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isWrongNetwork ? 'bg-brand-orange animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            ></span>
            <span className="font-mono text-[11px] font-semibold text-white tracking-wider uppercase">
              GenLayer Studio-dev (61997)
            </span>
          </span>
          <span className="hidden lg:inline text-stone-500">|</span>
          <span className="hidden lg:inline text-stone-400 text-[11px] font-mono">
            Contract:{' '}
            <span className="text-stone-300 font-bold">
              {configResult.ok ? configResult.config.contractAddress : 'Not configured'}
            </span>{' '}
            (Studio-dev)
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-stone-400 hidden sm:inline">
            Interface: <strong className="text-stone-200 font-mono">Estimated interface only</strong>
          </span>
          <button
            type="button"
            className="text-brand-pastelYellow hover:underline cursor-pointer flex items-center gap-1 font-mono"
            onClick={openNetworkModal}
          >
            <span>Network RPC</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* Global Notification Banner for Error / Rejected Requests */}
      {errorMessage && (
        <div className="bg-brand-orange text-white py-2 px-4 border-b-2 border-brand-charcoal flex items-center justify-between text-xs font-mono font-bold z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-pastelYellow shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error notice"
            className="px-2 py-0.5 hover:bg-brand-charcoal transition-colors cursor-pointer border border-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <header
        className="sticky top-0 z-40 bg-brand-cream border-b-2 border-brand-charcoal"
        data-purpose="global-navigation-header"
      >
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-stretch justify-between">
          {/* Brand & Wordmark */}
          <div className="flex items-center justify-between px-6 py-4 border-b lg:border-b-0 lg:border-r-2 border-brand-charcoal bg-brand-cream">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-brand-forest text-brand-pastelYellow flex items-center justify-center font-black text-xl border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] group-hover:bg-brand-orange transition-colors">
                ✦
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter uppercase leading-none font-sans text-brand-charcoal">
                  Update<span className="text-brand-orange">Seal</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-stone-600 mt-0.5 font-mono">
                  AI Release Governance • GenLayer
                </span>
              </div>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2 text-brand-charcoal hover:bg-stone-200 border border-brand-charcoal cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex flex-wrap items-center text-xs font-bold uppercase tracking-wider overflow-x-auto bg-brand-cream">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-4.5 border-r border-brand-charcoal hover:bg-stone-200 flex items-center gap-1.5 transition-colors font-mono ${
                    active ? 'bg-brand-forest text-white' : 'text-brand-charcoal'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.count && (
                    <span
                      className={`px-1 text-[10px] font-mono border ${
                        active
                          ? 'bg-brand-pastelYellow text-brand-charcoal border-brand-charcoal'
                          : 'bg-brand-pastelYellow text-brand-charcoal border-brand-charcoal'
                      }`}
                    >
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Web3 Connect Wallet Button (7 distinct states) */}
          <div className="flex items-center px-4 py-3 justify-end gap-2 bg-stone-100 lg:bg-transparent border-t lg:border-t-0 border-brand-charcoal relative">
            {/* State 4: Connected on Wrong Network */}
            {wallet.isConnected && isWrongNetwork ? (
              <div className="flex items-center gap-2">
                <span className="bg-brand-pastelPink text-red-900 border border-red-700 px-2.5 py-1.5 font-mono text-xs font-bold uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#0B130E]">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                  Wrong Network
                </span>
                <button
                  type="button"
                  onClick={switchToStudioNext}
                  className="bg-brand-orange text-white hover:bg-brand-orangeDark transition-colors text-xs font-bold uppercase tracking-wider px-3 py-1.5 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] cursor-pointer font-mono"
                >
                  Switch to Studio-dev
                </button>
              </div>
            ) : wallet.isConnected ? (
              /* State 3: Connected on Studio Next */
              <div className="flex items-center gap-2 relative">
                <div className="bg-brand-forest text-brand-pastelYellow border border-brand-charcoal px-3 py-1.5 font-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_#0B130E]">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="font-bold text-white tracking-wide" aria-label={`Connected address ${wallet.address}`}>
                    {shortenedAddress}
                  </span>
                  <span className="text-white/40">|</span>
                  <span className="text-brand-pastelYellow font-bold">{wallet.balanceGen} GEN</span>
                </div>

                {/* Dropdown Action Controls */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                    aria-label="Wallet account actions"
                    aria-expanded={walletMenuOpen}
                    className="bg-brand-cream border border-brand-charcoal text-brand-charcoal hover:bg-stone-200 px-2.5 py-1.5 font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#0B130E] cursor-pointer"
                  >
                    ⚙
                  </button>

                  {walletMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Wallet menu"
                      className="absolute right-0 top-9 z-50 w-56 bg-[#FAF8F4] border-2 border-brand-charcoal p-2 shadow-[6px_6px_0px_#0B130E] flex flex-col gap-1 font-mono text-xs animate-in fade-in duration-100"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={copyAddress}
                        className="p-2 hover:bg-stone-200 text-brand-charcoal flex items-center justify-between text-left font-bold transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
                          <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-normal">CLIPBOARD</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={viewOnExplorer}
                        className="p-2 hover:bg-stone-200 text-brand-charcoal flex items-center justify-between text-left font-bold transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                          <span>View on Explorer</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-normal">GENLAYER</span>
                      </button>

                      <div className="border-t border-brand-charcoal/30 my-1"></div>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setWalletMenuOpen(false);
                          disconnectWallet();
                        }}
                        className="p-2 bg-red-100 hover:bg-red-700 hover:text-white text-red-900 border border-red-300 font-bold uppercase transition-colors cursor-pointer text-left flex items-center justify-between"
                      >
                        <span>Disconnect</span>
                        <span>✕</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  aria-label="Disconnect Wallet"
                  className="bg-brand-cream border border-brand-charcoal text-brand-charcoal hover:bg-red-700 hover:text-white px-2 py-1.5 font-mono text-[10px] font-bold uppercase transition-colors shadow-[2px_2px_0px_#0B130E] cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : isConnecting ? (
              /* State 2: Connecting State */
              <button
                type="button"
                disabled
                className="bg-stone-300 text-brand-charcoal text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] cursor-not-allowed opacity-80"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping"></span>
                <span>Connecting...</span>
              </button>
            ) : (
              /* State 1: Disconnected State */
              <button
                type="button"
                className="bg-brand-charcoal text-white hover:bg-brand-orange transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 border border-brand-charcoal shadow-[2px_2px_0px_#EF5313] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                onClick={openWalletModal}
              >
                <Wallet className="w-3.5 h-3.5 text-brand-pastelYellow" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-brand-cream border-t border-brand-charcoal p-4 flex flex-col gap-2 font-mono text-xs font-bold uppercase">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 border border-brand-charcoal flex items-center justify-between ${
                    active ? 'bg-brand-forest text-white' : 'bg-white text-brand-charcoal hover:bg-stone-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </span>
                  {link.count && (
                    <span className="bg-brand-pastelYellow text-brand-charcoal px-1.5 py-0.5 text-[10px] border border-brand-charcoal">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
};
