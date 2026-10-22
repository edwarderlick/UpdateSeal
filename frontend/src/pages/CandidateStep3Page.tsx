import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidate } from '../features/candidate-release/CandidateContext';
import { useWallet } from '../features/wallet/useWallet';
import { CandidateStepper } from '../components/forms/CandidateStepper';
import { CopyButton } from '../components/ui/CopyButton';
import { CheckCircle2, ShieldAlert, Cpu, AlertTriangle, ArrowLeft, Wallet } from 'lucide-react';

export const CandidateStep3Page: React.FC = () => {
  const navigate = useNavigate();
  const { form, simulatedOutcome } = useCandidate();
  const { wallet, openWalletModal } = useWallet();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showPendingNotice, setShowPendingNotice] = useState(false);

  const handleDispatch = () => {
    if (!hasAgreed) return;

    if (!wallet.isConnected) {
      openWalletModal();
      return;
    }

    setShowPendingNotice(true);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Progress Header */}
      <section className="w-full bg-[#FAF8F4] py-8 border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-stone-600 block">
                Governance Pipeline • Stage 03
              </span>
              <h1 className="font-black text-3xl lg:text-4xl uppercase text-brand-charcoal tracking-tight font-sans">
                Candidate Release Finalization
              </h1>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand-charcoal bg-white border-2 border-brand-charcoal px-4 py-2 shadow-[2px_2px_0px_#0B130E]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                TARGET REPOSITORY: <strong className="text-brand-orange">{form.packageId || 'atlas-protocol/research-agent'}</strong>
              </span>
            </div>
          </div>

          {/* Stepper */}
          <CandidateStepper currentStep={3} />
        </div>
      </section>

      {/* State Notification Ribbon */}
      <aside className="w-full bg-brand-pastelYellow text-brand-charcoal py-2.5 px-4 lg:px-12 border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-brand-charcoal text-brand-pastelYellow px-2 py-0.5 font-bold uppercase tracking-wider text-[11px] shadow-[2px_2px_0px_#0B130E]">
              STATE CHECK
            </span>
            <span className="font-bold">
              Consensus epoch 4,921 synced. AST differential parser loaded with frozen manifest <code className="bg-brand-charcoal text-white px-1.5 py-0.5 font-bold">STD-014-GEN</code>.
            </span>
          </div>
          <div className="flex items-center gap-4 font-bold">
            <span>SWARM LATENCY: <strong className="bg-brand-charcoal text-emerald-400 px-1 py-0.5">142ms</strong></span>
            <span>PEERS ACTIVE: <strong className="bg-brand-charcoal text-white px-1 py-0.5">5/5 NODES</strong></span>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Bento Card 1: Pre-Flight Dossier */}
            <article className="bg-white border-2 border-brand-charcoal p-6 lg:p-8 shadow-[4px_4px_0px_#0B130E]">
              <header className="flex flex-col md:flex-row md:items-center justify-between pb-3 bg-brand-forest text-white px-5 py-3 mb-6 border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-brand-pastelYellow block">
                    Section 03.1 • Identity Check
                  </span>
                  <h2 className="font-sans font-black text-xl uppercase tracking-tight text-white">
                    Pre-Flight Release Dossier
                  </h2>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className={`inline-block font-mono font-bold text-xs px-2.5 py-1 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${
                    simulatedOutcome === '0x03'
                      ? 'bg-brand-orange text-white'
                      : 'bg-brand-pastelYellow text-brand-charcoal'
                  }`}>
                    {simulatedOutcome === '0x03' ? 'CRITICAL BREACHES [2]' : 'PASSING CHECKS [4/4]'}
                  </span>
                </div>
              </header>

              {/* Identification Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-cream border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-600 block mb-1">
                    Target Semantic Release
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-black text-2xl text-brand-charcoal">
                      {form.candidateVersion}
                    </span>
                    <span className="bg-brand-orange text-white font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal shadow-[1px_1px_0px_#0B130E]">
                      RELEASE CANDIDATE
                    </span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 mt-2">
                    Evaluator target version tagged against branch <code className="font-mono text-[11px] font-bold bg-white border border-brand-charcoal px-1.5 py-0.5">refs/tags/{form.candidateVersion}</code>
                  </p>
                </div>

                <div className="bg-brand-cream border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-600 block mb-1">
                    Target Commit SHA-256
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-brand-charcoal break-all">
                      {form.commitSha}
                    </span>
                    <CopyButton text={form.commitSha} label="" />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-stone-700">
                    <span>TREE ROOT: 0x489...e10</span>
                    <span className="bg-brand-charcoal text-brand-pastelYellow font-bold px-1.5 py-0.5">VERIFIED TREE</span>
                  </div>
                </div>
              </div>

              {/* Evidence Boundary Checklist Cards */}
              <h3 className="font-mono text-xs uppercase tracking-wider text-brand-charcoal font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-orange" />
                Evidence Boundary Parameter Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Metric 01: Scope */}
                <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-brand-charcoal/80 uppercase">METRIC 01 • SURGICAL SCOPE</span>
                      <span className="bg-brand-charcoal text-brand-pastelYellow font-mono font-bold text-[10px] px-1.5 py-0.5">PASSED</span>
                    </div>
                    <div className="font-sans font-black text-lg text-brand-charcoal">4 Files Altered</div>
                    <p className="font-sans text-xs text-stone-800 mt-1 leading-snug">
                      Upper ceiling allowance: 25 files. Modifies core runner and model weight validation adapters only.
                    </p>
                  </div>
                  <div className="w-full bg-white border border-brand-charcoal h-2.5 mt-4">
                    <div className="bg-brand-charcoal h-full" style={{ width: '16%' }}></div>
                  </div>
                </div>

                {/* Metric 02: Codebase Volatility */}
                <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-brand-charcoal/80 uppercase">METRIC 02 • CODEBASE VOLATILITY</span>
                      <span className="bg-brand-charcoal text-white font-mono font-bold text-[10px] px-1.5 py-0.5">PASSED</span>
                    </div>
                    <div className="font-sans font-black text-lg text-brand-charcoal">+142 / -28 Lines</div>
                    <p className="font-sans text-xs text-stone-800 mt-1 leading-snug">
                      Threshold limit: ±2,500 total lines. Delta accounts for 6.8% of permitted expansion budget.
                    </p>
                  </div>
                  <div className="w-full bg-white border border-brand-charcoal h-2.5 mt-4">
                    <div className="bg-brand-charcoal h-full" style={{ width: '6.8%' }}></div>
                  </div>
                </div>

                {/* Metric 03: Syntax Integrity */}
                <div className="bg-brand-vibrantCyan border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-brand-charcoal/80 uppercase">METRIC 03 • SYNTAX INTEGRITY</span>
                      <span className="bg-brand-charcoal text-brand-vibrantCyan font-mono font-bold text-[10px] px-1.5 py-0.5">MATCHED</span>
                    </div>
                    <div className="font-sans font-black text-lg text-brand-charcoal">AST Tree Hash Verified</div>
                    <p className="font-sans text-xs text-stone-900 mt-1 leading-snug">
                      Structural syntax hash coincides exactly with the offline determinism check report generated by node 0x98b.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-brand-charcoal mt-4 bg-white/70 border border-brand-charcoal px-2 py-1">
                    <span>ROOT: c9a48f...b299a</span>
                  </div>
                </div>

                {/* Metric 04: Boundary Isolation */}
                <div className={`border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E] flex flex-col justify-between ${
                  simulatedOutcome === '0x03' ? 'bg-[#FFAAA5]' : 'bg-brand-cream'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-stone-600 uppercase">METRIC 04 • BOUNDARY ISOLATION</span>
                      <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 border border-brand-charcoal ${
                        simulatedOutcome === '0x03'
                          ? 'bg-brand-orange text-white'
                          : 'bg-emerald-400 text-brand-charcoal'
                      }`}>
                        {simulatedOutcome === '0x03' ? 'BREACH DETECTED' : 'CLEAN'}
                      </span>
                    </div>
                    <div className="font-sans font-black text-lg text-brand-charcoal">
                      {simulatedOutcome === '0x03' ? 'Undeclared Socket' : 'Zero Egress Breaches'}
                    </div>
                    <p className="font-sans text-xs text-stone-700 mt-1 leading-snug">
                      {simulatedOutcome === '0x03'
                        ? 'Candidate triggers unlisted socket and child_process invocation.'
                        : 'No new outbound socket connections, HTTP client expansions, or arbitrary remote code fetches discovered.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold mt-4 bg-white border border-brand-charcoal px-2 py-1">
                    <span>{simulatedOutcome === '0x03' ? 'FAILED BOUNDARY AUDIT' : 'NO UNLISTED HOSTS'}</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Bento Card 2: Capability Charter Delta Matrix */}
            <article className="bg-white border-2 border-brand-charcoal p-6 lg:p-8 shadow-[4px_4px_0px_#0B130E]">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-6 bg-brand-forest text-white px-5 py-3 border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-brand-pastelYellow block">
                    Section 03.2 • Specification Compliance
                  </span>
                  <h2 className="font-sans font-black text-xl uppercase tracking-tight text-white">
                    Capability Charter Delta Matrix
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0 font-mono text-xs">
                  <span className="text-stone-300">BASELINE: <strong className="bg-white text-brand-charcoal px-2 py-0.5 font-bold border border-brand-charcoal">v1.4.2 [LOCKED]</strong></span>
                </div>
              </header>
              <p className="font-sans text-xs text-stone-700 mb-6">
                The multi-validator swarm matches the candidate commit diff against frozen charter permissions. Green indicates unaltered baseline compliance; amber denotes declared parameter adjustments.
              </p>

              {/* 6-Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-cream border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans font-black text-sm uppercase text-brand-charcoal">1. Network Egress Policy</span>
                    <span className="bg-brand-forest text-brand-pastelYellow font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal">UNCHANGED</span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 leading-relaxed">
                    Confined strictly to allowlisted RPC endpoints: <code className="font-mono text-[11px] font-bold text-brand-charcoal bg-white border border-brand-charcoal px-1">genlayer-studio-next</code>, <code className="font-mono text-[11px] font-bold text-brand-charcoal bg-white border border-brand-charcoal px-1">arweave.net</code>.
                  </p>
                </div>

                <div className="bg-brand-cream border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans font-black text-sm uppercase text-brand-charcoal">2. Storage & Filesystem</span>
                    <span className="bg-brand-forest text-brand-pastelYellow font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal">UNCHANGED</span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 leading-relaxed">
                    Read/Write access restricted to ephemeral directory sandbox <code className="font-mono text-[11px] font-bold text-brand-charcoal bg-white border border-brand-charcoal px-1">/tmp/agent/cache/*</code>. Root write denied.
                  </p>
                </div>

                <div className="bg-white border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans font-black text-sm uppercase text-brand-charcoal">3. System Prompt & Persona</span>
                    <span className="bg-brand-orange text-white font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal shadow-[1px_1px_0px_#0B130E]">MODIFIED (DECL)</span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 leading-relaxed">
                    Amends instruction block for higher reasoning chain output. Levenshtein similarity distance against baseline: <strong className="font-mono font-bold text-brand-charcoal bg-brand-pastelYellow px-1">92.4%</strong>.
                  </p>
                </div>

                <div className="bg-brand-cream border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans font-black text-sm uppercase text-brand-charcoal">4. Memory & Context State</span>
                    <span className="bg-brand-forest text-brand-pastelYellow font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal">UNCHANGED</span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 leading-relaxed">
                    Context horizon capped at 128k tokens. No vector DB schema migrations detected in SQLite embeddings file.
                  </p>
                </div>

                <div className="bg-white border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans font-black text-sm uppercase text-brand-charcoal">5. Autonomous Execution Hooks</span>
                    <span className="bg-brand-orange text-white font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal shadow-[1px_1px_0px_#0B130E]">MODIFIED (DECL)</span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 leading-relaxed">
                    Extends max step execution limit from 30 cycles to 45 cycles per scheduled trigger. Gas allowance elevated by <strong className="font-mono font-bold text-brand-charcoal bg-brand-pastelYellow px-1">0.001</strong>.
                  </p>
                </div>

                <div className="bg-brand-cream border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans font-black text-sm uppercase text-brand-charcoal">6. Human Interlock Multisig</span>
                    <span className="bg-brand-forest text-brand-pastelYellow font-mono font-bold text-[10px] px-2 py-0.5 border border-brand-charcoal">UNCHANGED</span>
                  </div>
                  <p className="font-sans text-xs text-stone-700 leading-relaxed">
                    2-of-3 threshold preserved for critical state actions. Emergency shutdown signer addresses remain strictly invariant.
                  </p>
                </div>
              </div>
            </article>

            {/* Information Callout Card: Non-Custodial Consensus Evaluation */}
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E]">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-brand-charcoal text-brand-pastelYellow p-3 flex-shrink-0 border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] bg-brand-charcoal text-white px-2 py-0.5 font-bold uppercase tracking-wider shadow-[1px_1px_0px_#0B130E]">
                      CONSENSUS ADVISORY
                    </span>
                    <span className="font-mono text-xs text-brand-charcoal font-black tracking-wider">
                      ZERO-TRUST EVALUATION
                    </span>
                  </div>
                  <h3 className="font-sans font-black text-lg uppercase tracking-tight text-brand-charcoal mb-2">
                    Non-Custodial AST Evaluation Protocol
                  </h3>
                  <p className="font-sans text-xs leading-relaxed text-stone-900 font-medium">
                    Submitting an undeclared capability breach, obfuscated executable payload, or unlisted external network socket triggers an instant{' '}
                    <strong className="font-mono bg-brand-charcoal text-white px-1.5 py-0.5 font-bold">0x03 CAPABILITY_VIOLATION</strong> verdict. In the future contract-backed flow, this result can be submitted to the Studio Next registry. This demonstration does not write on-chain.
                  </p>
                  <div className="mt-4 pt-2 flex flex-wrap items-center gap-4 font-mono text-[11px] text-brand-charcoal border-t border-brand-charcoal/40">
                    <span>SECURITY MODEL: <strong className="bg-white px-1.5 py-0.5 border border-brand-charcoal">NON-CUSTODIAL</strong></span>
                    <span>GOVERNANCE: <strong className="bg-brand-charcoal text-white px-1.5 py-0.5">MULTI-VALIDATOR SWARM</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Consensus Dispatch Panel (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-brand-forest text-white p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E]">
              <div className="flex items-center justify-between pb-2 mb-4 bg-brand-charcoal px-3 py-1.5 border border-stone-700 shadow-[2px_2px_0px_#0B130E]">
                <span className="font-mono text-[10px] text-brand-pastelYellow uppercase tracking-widest flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 bg-brand-orange rounded-full animate-ping"></span>
                  SWARM NODE ORCHESTRATION
                </span>
                <span className="font-mono text-[11px] text-stone-300 font-bold">PORT 61997</span>
              </div>
              <h3 className="font-sans font-black text-xl text-white uppercase tracking-tight mb-2">
                Node Consensus Dispatch
              </h3>
              <p className="font-sans text-xs text-stone-300 mb-6 leading-relaxed">
                Validators will run independent LLM-in-the-loop AST semantic checks across isolated container runners.
              </p>

              {/* Swarm Telemetry Stats */}
              <div className="flex flex-col gap-2 mb-6 font-mono text-xs">
                <div className="bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between">
                  <span className="text-stone-400 uppercase text-[10px]">TARGET NETWORK</span>
                  <span className="text-brand-pastelYellow font-bold">GenLayer Studio Next</span>
                </div>
                <div className="bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between">
                  <span className="text-stone-400 uppercase text-[10px]">CHAIN IDENTIFIER</span>
                  <span className="text-white font-bold">61997</span>
                </div>
                <div className="bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between">
                  <span className="text-stone-400 uppercase text-[10px]">ACTIVE EVALUATOR NODES</span>
                  <span className="text-brand-vibrantCyan font-bold">5 / 5 READY</span>
                </div>
                <div className="bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between">
                  <span className="text-stone-400 uppercase text-[10px]">REQUIRED QUORUM</span>
                  <span className="text-white font-bold">4-of-5 CONCURRENCE</span>
                </div>
                <div className="bg-stone-900 border border-stone-800 p-2.5 flex items-center justify-between">
                  <span className="text-stone-400 uppercase text-[10px]">ESTIMATED GAS LEVY</span>
                  <span className="text-brand-pastelYellow font-bold">0.008 test GEN</span>
                </div>
              </div>

              {/* Standby Participants */}
              <div className="bg-stone-900 border border-stone-800 p-3 mb-6">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-400 block mb-2">
                  VALIDATOR PARTICIPANTS (EPOCH 4,921)
                </span>
                <div className="space-y-1.5 font-mono text-xs text-stone-300">
                  {['0x82fD...e109 [Berlin]', '0x14C2...7701 [Tokyo]', '0x981A...31FA [Singapore]', '0x33e0...002C [Zurich]', '0x770a...b912 [Reykjavik]'].map((val, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 border-b border-stone-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-brand-orange"></span> {val}
                      </span>
                      <span className="text-brand-pastelYellow font-bold text-[11px]">STANDBY</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Signing Consent Box */}
              <div className="bg-brand-cream text-brand-charcoal border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E] mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded-none text-brand-orange border-2 border-brand-charcoal focus:ring-0 focus:outline-none cursor-pointer"
                  />
                  <span className="font-sans text-xs text-stone-900 select-none leading-relaxed">
                    I hereby attest that candidate commit <code className="font-mono font-bold bg-white border border-brand-charcoal px-1">{form.commitSha.substring(0, 8)}</code> is cryptographically signed by authorized key <strong className="font-mono text-brand-orange font-bold">0x9B88E...</strong> and all diffs conform strictly to frozen charter <strong className="font-mono font-bold">v1.4</strong>.
                  </span>
                </label>
              </div>

              {/* Pending Contract Disclosure Banner */}
              {showPendingNotice && (
                <div
                  className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 text-brand-charcoal space-y-2 font-mono text-xs shadow-[3px_3px_0px_#0B130E] mb-4"
                  role="alert"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-brand-orange uppercase">Contract Integration Pending</span>
                    <button
                      type="button"
                      onClick={() => setShowPendingNotice(false)}
                      className="px-1 text-brand-charcoal font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="font-sans text-xs text-stone-800 font-medium leading-relaxed">
                    The UpdateSeal intelligent contract is pending deployment on GenLayer Studio Next. Candidate evaluation records are simulated in demo mode. No transactions are submitted on-chain yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/reviews/review-atlas-150')}
                    className="w-full py-2 bg-brand-forest text-brand-pastelYellow font-bold uppercase border border-brand-charcoal mt-2 hover:bg-brand-orange hover:text-white transition-colors"
                  >
                    Preview Consensus Tracker →
                  </button>
                </div>
              )}

              {/* Primary Dispatch CTA */}
              <button
                type="button"
                disabled={!hasAgreed}
                onClick={handleDispatch}
                className={`w-full font-sans font-black text-sm uppercase py-4 px-4 text-center transition-all flex items-center justify-center gap-2 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] ${
                  hasAgreed
                    ? 'bg-brand-orange text-white hover:bg-brand-orangeDark cursor-pointer'
                    : 'bg-stone-700 text-stone-400 cursor-not-allowed'
                }`}
              >
                {!wallet.isConnected ? (
                  <>
                    <Wallet className="w-4 h-4 text-brand-pastelYellow" />
                    <span>CONNECT WALLET TO DISPATCH</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT CANDIDATE RELEASE</span>
                    <Cpu className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="font-mono text-[10px] text-stone-300 text-center mt-3">
                Contract integration pending • GenLayer Studio Next (61997)
              </p>
            </div>

            {/* Help / Guidance */}
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E]">
              <div className="flex items-center gap-2 font-sans font-black text-xs uppercase text-brand-charcoal mb-3">
                <AlertTriangle className="w-4 h-4 text-brand-orange" />
                <span>WHAT HAPPENS NEXT?</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 font-sans text-xs text-stone-700 font-medium">
                <li>5 Validator nodes pull candidate raw Git tree.</li>
                <li>AST differential parser maps semantic diff.</li>
                <li>Consensus engine tallies votes into on-chain block.</li>
                <li>Cryptographic approval seal is inscribed if quorum reached.</li>
              </ol>
            </div>

            {/* Navigation back */}
            <button
              type="button"
              onClick={() => navigate('/packages/atlas-research-agent/releases/new/evidence')}
              className="px-4 py-3 bg-white text-brand-charcoal border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] hover:bg-stone-100 font-mono text-xs uppercase font-bold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Evidence Diff
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};
