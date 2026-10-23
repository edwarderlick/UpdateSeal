import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';
import { DesignDemoBanner } from '../components/ui/DesignDemoBanner';

export const DecisionApprovedPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-16">
      <DesignDemoBanner />
      {/* Top Breadcrumb & Metadata Bar */}
      <div className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-3 px-4 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-brand-charcoal">
          <div className="flex flex-wrap items-center gap-2 uppercase">
            <Link to="/registry" className="text-stone-500 hover:text-brand-orange font-bold">
              Registry
            </Link>
            <span className="text-stone-400">/</span>
            <Link to="/packages/atlas-research-agent" className="text-brand-orange font-bold hover:underline">
              atlas-research-agent
            </Link>
            <span className="text-stone-400">/</span>
            <span className="text-stone-500">Releases</span>
            <span className="text-stone-400">/</span>
            <span className="bg-stone-200 border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold">v1.4.2</span>
            <span className="text-stone-400">/</span>
            <span className="bg-brand-charcoal text-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 tracking-wider font-bold">
              Report-0x01
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-brand-charcoal px-2 py-1 font-bold text-[11px] shadow-[2px_2px_0px_#0B130E]">
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              GenLayer Consensus Finalized
            </span>
            <span className="bg-brand-forest text-brand-pastelYellow px-2 py-1 border border-brand-charcoal font-bold text-[11px] shadow-[2px_2px_0px_#0B130E]">
              TX: 0x98ef...3a1c
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8 w-full flex flex-col gap-8">
        {/* Main Verdict Hero Banner (0x01 Mint / Editorial) */}
        <div className="relative bg-brand-vibrantCyan border-2 border-brand-charcoal p-6 lg:p-10 overflow-hidden shadow-[8px_8px_0px_#0B130E]">
          <div className="absolute -right-8 -top-12 text-[15rem] font-black text-brand-charcoal/10 select-none pointer-events-none leading-none tracking-tighter font-sans">
            0x01
          </div>

          <div className="relative z-10 flex flex-col gap-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 bg-brand-forest text-brand-pastelYellow font-mono text-xs px-3 py-1.5 font-bold uppercase tracking-wider border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Canonical Verdict: 0x01 Approved
              </span>
              <span className="bg-white text-brand-charcoal font-mono text-xs px-3 py-1.5 border border-brand-charcoal font-bold uppercase tracking-wider shadow-[2px_2px_0px_#0B130E]">
                Charter Standard: ISO/IEC-42001-AI-SEC
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-xs px-2.5 py-1.5 font-black border border-brand-charcoal uppercase tracking-wider shadow-[2px_2px_0px_#0B130E]">
                100% QUORUM
              </span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-black text-brand-charcoal uppercase tracking-tight leading-none font-sans">
              Candidate Release Approved (Demo Record)
            </h1>

            <p className="text-base lg:text-lg font-medium text-brand-charcoal max-w-3xl leading-relaxed">
              All 5 independent GenLayer LLM evaluator validator nodes reached full deterministic consensus. Zero undeclared system primitives, capability breaches, or outbound egress escalations were identified across candidate AST analysis.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
              <span className="bg-brand-charcoal text-white px-3 py-1 border border-brand-charcoal font-semibold shadow-[2px_2px_0px_#0B130E]">
                EVALUATOR MODEL: GEN-LLM-CONSENSUS-V4
              </span>
              <span className="bg-white text-brand-charcoal px-3 py-1 border border-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                SEAL TIMESTAMP: 2025-02-28 14:02:18 UTC
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Bento Stats Bar (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Quorum */}
          <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E]">
            <div className="flex items-center justify-between pb-2 border-b border-brand-charcoal/20">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal">[01] Consensus Quorum</span>
              <CheckCircle2 className="w-4 h-4 text-brand-charcoal font-bold" />
            </div>
            <div className="py-3">
              <div className="text-3xl font-black text-brand-charcoal font-sans">5 of 5</div>
              <div className="font-mono text-xs text-brand-orange font-bold uppercase tracking-wider mt-0.5">Concurred (100.0%)</div>
            </div>
            <div className="font-mono text-[11px] text-brand-charcoal/80 font-medium">
              LLM Multi-Validator Round #409
            </div>
          </div>

          {/* Card 2: Gas Consumed */}
          <div className="bg-stone-50 border-2 border-brand-charcoal p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E]">
            <div className="flex items-center justify-between pb-2 border-b border-brand-charcoal/20">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal">[02] Execution Gas</span>
              <span className="font-mono text-xs text-brand-orange font-bold">GEN</span>
            </div>
            <div className="py-3">
              <div className="text-3xl font-black text-brand-charcoal font-sans">6,420,110</div>
              <div className="font-mono text-xs text-brand-forest font-bold uppercase tracking-wider mt-0.5">GEN Consumed</div>
            </div>
            <div className="font-mono text-[11px] text-stone-600 font-medium">
              State Proof Inscription included
            </div>
          </div>

          {/* Card 3: Boundary Drift */}
          <div className="bg-emerald-100 border-2 border-brand-charcoal p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E]">
            <div className="flex items-center justify-between pb-2 border-b border-brand-charcoal/20">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal">[03] Boundary Drift</span>
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
            </div>
            <div className="py-3">
              <div className="text-3xl font-black text-emerald-900 font-sans">0 Detected</div>
              <div className="font-mono text-xs text-emerald-800 font-bold uppercase tracking-wider mt-0.5">Full Invariance Pass</div>
            </div>
            <div className="font-mono text-[11px] text-emerald-900/80 font-medium">
              Charter Delta: 0.00% Divergence
            </div>
          </div>

          {/* Card 4: Sealed Block Height */}
          <div className="bg-brand-forest border-2 border-brand-charcoal p-5 flex flex-col justify-between text-white shadow-[4px_4px_0px_#0B130E]">
            <div className="flex items-center justify-between pb-2 border-b border-white/20">
              <span className="font-mono text-xs uppercase tracking-wider text-brand-pastelYellow font-bold">[04] Block Anchor</span>
              <Terminal className="w-4 h-4 text-brand-pastelYellow" />
            </div>
            <div className="py-3">
              <div className="text-2xl font-black text-white font-mono tracking-tight">#61,989,012</div>
              <div className="font-mono text-xs text-brand-pastelYellow uppercase tracking-wider mt-0.5 font-bold">Finalized & Immutable</div>
            </div>
            <div className="font-mono text-[11px] text-stone-300 font-medium">
              Chain ID: 61997 (Studio Next)
            </div>
          </div>
        </div>

        {/* Main Split: Matrix & Cryptographic Receipts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Compliance Matrix */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-brand-charcoal text-white border-2 border-brand-charcoal p-4 flex items-center justify-between shadow-[4px_4px_0px_#EF5313]">
              <span className="text-lg font-black uppercase tracking-tight font-sans text-brand-pastelYellow">
                1. Capability Charter Compliance Matrix
              </span>
              <span className="font-mono text-xs bg-emerald-400 text-brand-charcoal px-2.5 py-1 uppercase font-black border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                6 / 6 Compliant
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Item 1 */}
              <div className="bg-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0B130E]">
                      ✓
                    </span>
                    <span className="font-bold text-sm uppercase text-brand-charcoal font-sans">Network Egress Sandbox</span>
                  </div>
                  <span className="font-mono text-xs bg-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                    ALLOWLIST STRICT
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-700 pl-8 leading-relaxed">
                  Outbound sockets strictly bound to declared LLM inference endpoints (<code className="font-mono text-xs bg-stone-100 border border-stone-300 px-1 font-bold text-brand-charcoal">api.anthropic.com</code>, <code className="font-mono text-xs bg-stone-100 border border-stone-300 px-1 font-bold text-brand-charcoal">api.openai.com</code>). Zero arbitrary TCP/UDP socket formation observed.
                </p>
                <div className="ml-8 bg-stone-100 border-l-4 border-brand-forest p-2 font-mono text-[11px] text-stone-700">
                  <span className="font-bold text-brand-charcoal">Node 0x01:</span> "DNS queries resolved inside deterministic enclave interceptor."
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0B130E]">
                      ✓
                    </span>
                    <span className="font-bold text-sm uppercase text-brand-charcoal font-sans">File System Containment</span>
                  </div>
                  <span className="font-mono text-xs bg-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                    JAIL: /tmp/workspace
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-700 pl-8 leading-relaxed">
                  Read/write operations restricted to temporary sandbox workspace directory. No directory traversal attempts (<code className="font-mono text-xs bg-stone-100 border border-stone-300 px-1 font-bold text-brand-charcoal">../</code>) or access to root filesystem, environment paths, or secret stores.
                </p>
                <div className="ml-8 bg-stone-100 border-l-4 border-brand-forest p-2 font-mono text-[11px] text-stone-700">
                  <span className="font-bold text-brand-charcoal">Node 0x03:</span> "In-memory ramfs jail verified with ephemeral mount points."
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0B130E]">
                      ✓
                    </span>
                    <span className="font-bold text-sm uppercase text-brand-charcoal font-sans">Shell Subprocess Execution</span>
                  </div>
                  <span className="font-mono text-xs bg-emerald-200 border border-brand-charcoal text-brand-charcoal px-2 py-0.5 font-bold shadow-[2px_2px_0px_#0B130E]">
                    BLOCKED (BY CHARTER)
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-700 pl-8 leading-relaxed">
                  Candidate package contains zero invocation of <code className="font-mono text-xs bg-stone-100 border border-stone-300 px-1 font-bold text-brand-charcoal">subprocess.Popen</code>, <code className="font-mono text-xs bg-stone-100 border border-stone-300 px-1 font-bold text-brand-charcoal">os.system</code>, or POSIX <code className="font-mono text-xs bg-stone-100 border border-stone-300 px-1 font-bold text-brand-charcoal">fork()</code>. Execution occurs purely in interpreted bytecode runtime.
                </p>
                <div className="ml-8 bg-stone-100 border-l-4 border-brand-forest p-2 font-mono text-[11px] text-stone-700">
                  <span className="font-bold text-brand-charcoal">Node 0x02:</span> "Static symbol scan: zero process spawning symbols imported."
                </div>
              </div>

              {/* Item 4 */}
              <div className="bg-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0B130E]">
                      ✓
                    </span>
                    <span className="font-bold text-sm uppercase text-brand-charcoal font-sans">Private Key Custody Protection</span>
                  </div>
                  <span className="font-mono text-xs bg-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                    NO SEED ACCESS
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-700 pl-8 leading-relaxed">
                  No runtime memory introspection targeting wallet keystores or hardware security modules. Agent executes actions via signed delegation contracts with restricted allowances.
                </p>
                <div className="ml-8 bg-stone-100 border-l-4 border-brand-forest p-2 font-mono text-[11px] text-stone-700">
                  <span className="font-bold text-brand-charcoal">Node 0x04:</span> "No raw mnemonic or private key material exposed in memory dump."
                </div>
              </div>

              {/* Item 5 */}
              <div className="bg-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0B130E]">
                      ✓
                    </span>
                    <span className="font-bold text-sm uppercase text-brand-charcoal font-sans">Autonomous Treasury Spend Limits</span>
                  </div>
                  <span className="font-mono text-xs bg-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                    CAP: 50.00 USDC/DAY
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-700 pl-8 leading-relaxed">
                  Smart contract spending limits preserved from v1.4.1. No manipulation of rate limiters or balance threshold triggers detected. Maximum autonomous transaction value locked at 5.00 USDC.
                </p>
                <div className="ml-8 bg-stone-100 border-l-4 border-brand-forest p-2 font-mono text-[11px] text-stone-700">
                  <span className="font-bold text-brand-charcoal">Node 0x05:</span> "Spend limit checks validated against on-chain oracle ruleset."
                </div>
              </div>

              {/* Item 6 */}
              <div className="bg-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-forest text-brand-pastelYellow border border-brand-charcoal flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0B130E]">
                      ✓
                    </span>
                    <span className="font-bold text-sm uppercase text-brand-charcoal font-sans">Audit Telemetry & Attestation</span>
                  </div>
                  <span className="font-mono text-xs bg-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                    VERIFIABLE LOGS
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-700 pl-8 leading-relaxed">
                  All decision rationales are continuously exported as Merkleized state transitions and broadcast to the UpdateSeal listener pool without payload obfuscation.
                </p>
                <div className="ml-8 bg-stone-100 border-l-4 border-brand-forest p-2 font-mono text-[11px] text-stone-700">
                  <span className="font-bold text-brand-charcoal">Consensus:</span> "Structured audit emitter correctly anchored to EVM event log."
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: State Proof Slip */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-brand-forest text-white border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-700">
                <span className="font-mono text-xs text-brand-pastelYellow uppercase font-bold tracking-wider">
                  CRYPTOGRAPHIC STATE PROOF
                </span>
                <span className="bg-emerald-400 text-brand-charcoal font-mono text-[10px] px-2 py-0.5 font-bold">
                  FINALIZED
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block mb-1">Package ID</span>
                  <div className="flex items-center justify-between bg-stone-900 p-2.5 border border-stone-800">
                    <span className="text-white">atlas-protocol/research-agent</span>
                    <CopyButton text="atlas-protocol/research-agent" label="" />
                  </div>
                </div>

                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block mb-1">Approved Commit SHA</span>
                  <div className="flex items-center justify-between bg-stone-900 p-2.5 border border-stone-800">
                    <span className="text-brand-pastelYellow break-all">61997402be49f812cc994017bca882e558a12009</span>
                    <CopyButton text="61997402be49f812cc994017bca882e558a12009" label="" />
                  </div>
                </div>

                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block mb-1">Consensus Root Inscription (Demo Record)</span>
                  <div className="flex items-center justify-between bg-stone-900 p-2.5 border border-stone-800">
                    <span className="text-brand-vibrantCyan break-all">0x74a1b2c849f82e9432faa2c34de8b998e19c4f</span>
                    <CopyButton text="0x74a1b2c849f82e9432faa2c34de8b998e19c4f" label="" />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">GenLayer Studio Next (61997)</span>
                  <span className="text-emerald-400 font-bold">Demo Verification</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-3 font-mono text-xs">
              <span className="uppercase text-stone-600 font-bold tracking-wider">Follow-Up Actions</span>
              <Link
                to="/verify"
                className="w-full bg-brand-orange hover:bg-brand-charcoal text-white font-bold p-3 text-center border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
              >
                Verify In RPC Query Tool →
              </Link>
              <Link
                to="/packages/atlas-research-agent"
                className="w-full bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-bold p-3 text-center border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
              >
                Back To Package Detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
