import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../features/wallet/useWallet';
import { Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';

export const DashboardPage: React.FC = () => {
  const { walletState, openConnectModal, openNetworkModal } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmptyState, setShowEmptyState] = useState(false);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Demo Toolbar: Toggle Empty State & Wallet Test Modals */}
      <aside className="w-full bg-brand-pastelYellow border-b-2 border-brand-charcoal py-2 px-4 lg:px-12 font-mono text-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-brand-charcoal text-brand-pastelYellow px-2 py-0.5 font-bold uppercase tracking-wider text-[11px] shadow-[2px_2px_0px_#0B130E]">
              OPERATOR TOOLBAR
            </span>
            <span className="font-bold text-brand-charcoal">Demo preview triggers:</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-brand-charcoal">
              <input
                type="checkbox"
                checked={showEmptyState}
                onChange={(e) => setShowEmptyState(e.target.checked)}
                className="rounded-none border-2 border-brand-charcoal"
              />
              <span>Simulate First-Use Empty State</span>
            </label>

            <button
              onClick={openNetworkModal}
              className="px-2.5 py-0.5 bg-white hover:bg-stone-100 text-brand-charcoal border border-brand-charcoal font-bold cursor-pointer"
            >
              Test Wrong Network Modal
            </button>
          </div>
        </div>
      </aside>

      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-10 space-y-12">
        {/* Top Identity & Status Bar */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#FAF8F4] p-6 border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <span className="bg-brand-orange text-white px-2.5 py-0.5 font-bold uppercase tracking-wider border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] -rotate-1">
                OPERATOR CONSOLE
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#0B130E]">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping"></span>
                GenLayer Studio Next (61997)
              </span>
              <span className="bg-brand-vibrantCyan text-brand-charcoal px-2.5 py-0.5 font-bold uppercase border border-brand-charcoal rotate-1">
                EPOCH #4192
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
              Developer Registry Dashboard
            </h1>

            <div className="font-mono text-xs text-stone-700 flex items-center gap-2 flex-wrap">
              <span className="font-bold uppercase tracking-wider">Connected Signer:</span>
              {walletState.account ? (
                <>
                  <span className="px-2 py-0.5 bg-brand-pastelYellow text-brand-charcoal font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                    {`${walletState.account.substring(0, 6)}...${walletState.account.substring(walletState.account.length - 4)}`}
                  </span>
                  <CopyButton text={walletState.account} label="[COPY ADDR]" />
                </>
              ) : (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="px-2.5 py-1 bg-brand-charcoal text-brand-pastelYellow font-bold border border-brand-charcoal text-xs hover:bg-brand-orange hover:text-white transition-colors cursor-pointer"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/register/identity"
              className="px-6 py-3.5 bg-brand-orange hover:bg-brand-orangeDark text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Package →</span>
            </Link>
          </div>
        </section>

        {showEmptyState ? (
          /* Empty State Display */
          <div className="bg-white border-2 border-brand-charcoal p-12 text-center shadow-[8px_8px_0px_#0B130E] flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-brand-pastelYellow border-2 border-brand-charcoal flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_#0B130E]">
              ✦
            </div>
            <h2 className="font-black text-2xl uppercase tracking-tight text-brand-charcoal font-sans">
              No Registered Autonomous Packages Found
            </h2>
            <p className="font-sans text-stone-600 max-w-md text-sm leading-relaxed">
              Your connected wallet has not sealed any agent packages on GenLayer Studio Next yet. Register your initial code baseline and immutable charter boundaries to establish on-chain provenance.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Link
                to="/register/identity"
                className="px-6 py-3 bg-brand-orange hover:bg-brand-orangeDark text-white font-mono text-xs uppercase font-black tracking-wider border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]"
              >
                Register Your First Agent →
              </Link>
              <button
                onClick={() => setShowEmptyState(false)}
                className="px-4 py-3 bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-mono text-xs uppercase font-bold border border-brand-charcoal"
              >
                Load Demo Packages
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Metrics Strip */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
              {/* Card 1: Soft Pastel Pink */}
              <div className="relative bg-brand-pastelPink p-6 border-2 border-brand-charcoal shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between h-44 overflow-hidden">
                <div className="absolute -right-4 -bottom-6 font-black text-7xl text-brand-charcoal/15 select-none pointer-events-none">
                  01
                </div>
                <div className="flex justify-between items-start">
                  <span className="bg-brand-charcoal text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                    [INDEX :: 01]
                  </span>
                  <span className="px-2 py-0.5 bg-white text-brand-charcoal text-[10px] font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                    TIER 1 VALID
                  </span>
                </div>
                <div>
                  <div className="text-5xl font-black text-brand-charcoal leading-none mb-1 tracking-tighter">
                    2
                  </div>
                  <div className="text-xs uppercase tracking-wider text-brand-charcoal font-bold">
                    Packages Owned
                  </div>
                </div>
              </div>

              {/* Card 2: Pale Yellow */}
              <div className="relative bg-brand-pastelYellow p-6 border-2 border-brand-charcoal shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between h-44 overflow-hidden">
                <div className="absolute -right-4 -bottom-6 font-black text-7xl text-brand-charcoal/15 select-none pointer-events-none">
                  02
                </div>
                <div className="flex justify-between items-start">
                  <span className="bg-brand-orange text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                    [AWAITING EVAL]
                  </span>
                  <span className="w-3 h-3 bg-brand-orange border border-brand-charcoal animate-pulse"></span>
                </div>
                <div>
                  <div className="text-5xl font-black text-brand-charcoal leading-none mb-1 tracking-tighter">
                    1
                  </div>
                  <div className="text-xs uppercase tracking-wider text-brand-charcoal font-bold">
                    Candidate Review
                  </div>
                </div>
              </div>

              {/* Card 3: Deep Forest Green */}
              <div className="relative bg-brand-forest text-white p-6 border-2 border-brand-charcoal shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between h-44 overflow-hidden">
                <div className="absolute -right-4 -bottom-6 font-black text-7xl text-white/10 select-none pointer-events-none">
                  03
                </div>
                <div className="flex justify-between items-start">
                  <span className="bg-brand-vibrantCyan text-brand-charcoal px-2 py-0.5 text-[10px] font-bold uppercase">
                    [DEMO APPROVED]
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-brand-pastelYellow" />
                </div>
                <div>
                  <div className="text-5xl font-black text-white leading-none mb-1 tracking-tighter">
                    3
                  </div>
                  <div className="text-xs uppercase tracking-wider text-brand-pastelYellow font-bold">
                    Approved Releases
                  </div>
                </div>
              </div>

              {/* Card 4: Urgent Blocked */}
              <div className="relative bg-brand-orange text-white p-6 border-2 border-brand-charcoal shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between h-44 overflow-hidden">
                <div className="absolute -right-4 -bottom-6 font-black text-7xl text-white/20 select-none pointer-events-none">
                  04
                </div>
                <div className="flex justify-between items-start">
                  <span className="bg-white text-brand-charcoal px-2 py-0.5 text-[10px] font-bold uppercase">
                    [INTERVENTION]
                  </span>
                  <span className="px-2 py-0.5 bg-brand-charcoal text-brand-pastelYellow text-[10px] font-black uppercase border border-white shadow-[2px_2px_0px_#0B130E]">
                    URGENT
                  </span>
                </div>
                <div>
                  <div className="text-5xl font-black text-white leading-none mb-1 tracking-tighter">
                    1
                  </div>
                  <div className="text-xs uppercase tracking-wider text-white font-bold">
                    Blocked Candidate
                  </div>
                </div>
              </div>
            </section>

            {/* Visual Ledger Analytics Bar & Sparkline */}
            <section className="bg-[#FAF8F4] p-6 border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-brand-orange border border-brand-charcoal shadow-[1px_1px_0px_#0B130E]"></div>
                  <span className="uppercase tracking-wider text-brand-charcoal font-black">
                    Network Autonomous Evaluation Load (Last 24 Hours)
                  </span>
                </div>
                <span className="bg-brand-pastelYellow text-brand-charcoal px-2.5 py-1 border border-brand-charcoal font-bold">
                  5 / 5 Consensus Round Quorum Active
                </span>
              </div>

              {/* Sparkline Canvas */}
              <div className="w-full bg-white p-4 border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
                <svg className="w-full h-16 text-brand-charcoal" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 70">
                  <path d="M0,50 L80,48 L160,35 L240,40 L320,15 L400,22 L480,55 L560,20 L640,18 L720,42 L800,10 L880,28 L960,34 L1000,25" stroke="#102A1E" strokeLinecap="square" strokeWidth="2.5"></path>
                  <path d="M0,50 L80,48 L160,35 L240,40 L320,15 L400,22 L480,55 L560,20 L640,18 L720,42 L800,10 L880,28 L960,34 L1000,25 L1000,70 L0,70 Z" fill="#102A1E" fillOpacity="0.07"></path>
                  <circle cx="800" cy="10" fill="#EF5313" r="6" stroke="#0B130E" strokeWidth="1.5"></circle>
                  <line stroke="#EF5313" strokeDasharray="3,3" strokeWidth="2" x1="800" x2="800" y1="10" y2="65"></line>
                </svg>
                <div className="flex justify-between items-center mt-2 font-mono text-[11px] text-stone-600">
                  <span>T -24H (GENESIS SEED 61997)</span>
                  <span className="bg-brand-pastelPink text-brand-charcoal px-2 py-0.5 font-bold border border-brand-charcoal">
                    ● V1.5.0-RC1 REJECTED (EGRESS ANOMALY DETECTED)
                  </span>
                  <span>T -0M (LIVE VALIDATION)</span>
                </div>
              </div>
            </section>

            {/* Packages Catalog Section */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b-2 border-brand-charcoal">
                <div>
                  <span className="font-mono text-xs text-brand-orange uppercase font-bold tracking-wider block">
                    CATALOG 01 // PRODUCTION REGISTRY
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-black text-brand-charcoal tracking-tight uppercase font-sans">
                    My Registered Packages
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-mono text-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search slugs, versions, tags..."
                    className="bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-stone-400 border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] focus:outline-none w-full md:w-72"
                  />
                </div>
              </div>

              {/* Package Card 1: Atlas Research Agent */}
              <article className="bg-white border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] p-6 lg:p-8 space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 bg-[#FAF8F4] p-5 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E]">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                      <span className="bg-brand-forest text-white px-2.5 py-0.5 font-bold uppercase border border-brand-charcoal">
                        AGENT RUNTIME
                      </span>
                      <span className="bg-brand-pastelYellow text-brand-charcoal px-2.5 py-0.5 font-bold uppercase border border-brand-charcoal">
                        REGISTRY ID: #0042
                      </span>
                      <span className="bg-brand-vibrantCyan text-brand-charcoal px-2.5 py-0.5 font-bold uppercase border border-brand-charcoal">
                        CHARTER V1.4 COMPLIANT
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-brand-charcoal tracking-tight uppercase font-sans">
                      Atlas Research Agent
                    </h3>
                    <p className="font-mono text-xs text-stone-600">
                      atlas-protocol/research-agent
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block font-mono text-xs">
                      <div className="text-[10px] text-stone-500 uppercase font-bold">Contract Anchor</div>
                      <div className="text-brand-charcoal font-bold">0x98b1...04AA</div>
                    </div>
                    <div className="w-12 h-12 bg-brand-orange text-white flex items-center justify-center font-black text-base border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
                      AT
                    </div>
                  </div>
                </div>

                {/* Version Comparison Bento */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  <div className="md:col-span-5 bg-[#FAF8F4] p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-3 font-mono text-xs">
                        <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">Current Verified State</span>
                        <span className="bg-brand-forest text-white px-2 py-0.5 font-bold uppercase">ACTIVE BASELINE</span>
                      </div>
                      <div className="text-3xl font-black text-brand-charcoal tracking-tight font-mono">v1.4.2</div>
                      <p className="text-xs text-stone-700 mt-2 font-sans leading-relaxed">
                        Multi-source synthesis pipeline with bounded web-browser egress allowlist.
                      </p>
                    </div>
                    <div className="pt-4 space-y-2 bg-white p-3 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Merkle Root:</span>
                        <span className="text-brand-charcoal font-bold">0x88f2...7710</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Approved At:</span>
                        <span className="text-brand-charcoal font-bold">Block #61994200</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col justify-center items-center p-4 bg-brand-pastelYellow border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] text-center space-y-2 font-mono text-xs">
                    <ArrowRight className="w-6 h-6 text-brand-orange font-bold" />
                    <span className="text-[10px] text-brand-charcoal font-black uppercase">Candidate Delta</span>
                    <span className="bg-brand-orange text-white px-2 py-0.5 font-bold">BLOCKED</span>
                  </div>

                  <div className="md:col-span-5 bg-white p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-3 font-mono text-xs">
                        <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">Candidate Release</span>
                        <span className="bg-red-600 text-white px-2 py-0.5 font-bold uppercase">VERDICT: 0x03</span>
                      </div>
                      <div className="text-3xl font-black text-red-600 tracking-tight font-mono">v1.5.0-rc1</div>
                      <p className="text-xs text-stone-700 mt-2 font-sans leading-relaxed">
                        Flagged for unauthorized process spawning and unregistered network sockets.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        to="/decisions/capability-violation"
                        className="w-full bg-brand-orange text-white p-2.5 text-center font-mono text-xs font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]"
                      >
                        Inspect 0x03 Violation Dossier →
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-stone-200 font-mono text-xs">
                  <div className="flex items-center gap-4">
                    <Link
                      to="/packages/atlas-research-agent"
                      className="text-brand-orange font-bold hover:underline"
                    >
                      View Full Package Detail →
                    </Link>
                    <Link
                      to="/verify"
                      className="text-stone-600 hover:text-brand-charcoal"
                    >
                      Test In RPC Verifier
                    </Link>
                  </div>
                  <Link
                    to="/packages/atlas-research-agent/releases/new/identity"
                    className="px-4 py-2 bg-brand-forest hover:bg-brand-charcoal text-brand-pastelYellow font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]"
                  >
                    Submit New Candidate Release
                  </Link>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
