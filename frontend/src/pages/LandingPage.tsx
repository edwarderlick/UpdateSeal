import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  ChevronRight,
  Globe,
  Key,
  Coins,
  ShieldAlert,
  HardDrive,
  CheckCheck,
  Terminal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      {/* Top Editorial Ticker */}
      <div className="bg-brand-pastelYellow border-b border-brand-charcoal py-2 px-6 text-xs font-mono font-bold tracking-tight flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-brand-orange"></span>
          <span>GENLAYER STUDIO-DEV REGISTRY: EVIDENCE-BASED RELEASE VERDICTS</span>
        </div>
        <div className="hidden md:flex gap-6">
          <span>STUDIO-DEV NETWORK • ILLUSTRATIVE EDITORIAL</span>
          <span>COMMIT-PINNED EVIDENCE</span>
        </div>
      </div>

      {/* HERO SECTION WITH EDITORIAL STEPPED GEOMETRY */}
      <section className="relative bg-brand-cream border-b-2 border-brand-charcoal overflow-hidden">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Hero Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r-2 border-brand-charcoal">
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="sticker-badge bg-brand-pastelPink text-brand-charcoal -rotate-2">
                  Frozen Charter Baseline
                </span>
                <span className="sticker-badge bg-brand-vibrantCyan text-brand-charcoal rotate-1">
                  Studio Next 61997
                </span>
                <span className="sticker-badge bg-brand-pastelYellow text-brand-charcoal">
                  Deterministic Releases
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.92] text-brand-charcoal mb-6 font-sans">
                The on-chain <br />
                <span className="relative inline-block">
                  approval registry
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-pastelYellow -z-10"></span>
                </span>
                <br />
                for autonomous software.
              </h1>
              <p className="text-lg md:text-xl font-normal text-stone-800 max-w-xl leading-relaxed mb-8">
                UpdateSeal detects and records potential capability drift in AI agents, tools, and autonomous plugins. Releases are evaluated against immutable charters on GenLayer Intelligent Contracts before an operator chooses to deploy.
              </p>
            </div>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-brand-charcoal">
              <Link
                to="/registry"
                className="bg-brand-orange text-white hover:bg-brand-charcoal transition-colors px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 shadow-[3px_3px_0px_#0B130E] border border-brand-charcoal font-mono cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>Browse Package Registry</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register/identity"
                className="bg-white text-brand-charcoal hover:bg-stone-100 transition-colors px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3 shadow-[3px_3px_0px_#0B130E] border border-brand-charcoal font-mono cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>Register Agent Charter</span>
                <Plus className="w-4 h-4" />
              </Link>
              <Link
                to="/verify"
                className="text-stone-700 hover:text-brand-orange text-xs font-mono font-bold uppercase px-3 py-2 flex items-center gap-1.5 underline underline-offset-4"
              >
                <span>Verify Release</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Hero Right Column: Graphic Stepped Visual of Agent Verification */}
          <div className="lg:col-span-5 bg-brand-surfaceLight flex flex-col justify-between p-8 stepped-pattern relative">
            <div className="border-2 border-brand-charcoal bg-white shadow-[4px_4px_0px_#0B130E] p-6 mb-8" data-testid="illustrative-workflow">
              <p className="mb-3 px-2 py-1 bg-brand-pastelYellow text-brand-charcoal text-[10px] font-mono font-bold uppercase tracking-wider border border-brand-charcoal" data-testid="illustrative-workflow-label">
                ILLUSTRATIVE WORKFLOW — NOT LIVE CONTRACT DATA
              </p>
              <div className="flex items-center justify-between border-b border-brand-charcoal pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-orange"></div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                    Runtime Interceptor Simulation
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-400">
                  STATUS: EVALUATING
                </span>
              </div>

              {/* Terminal-style Code Block */}
              <div className="bg-brand-charcoal text-stone-200 p-4 font-mono text-xs border border-brand-charcoal leading-relaxed space-y-2">
                <div className="text-stone-500">// Example consumer query after a stored verdict</div>
                <div>
                  <span className="text-brand-vibrantCyan">const</span> approved ={' '}
                  <span className="text-brand-pastelYellow">await</span> updateSeal.is_release_approved(
                </div>
                <div className="pl-4 text-stone-300">"agent:atlas-deep-research",</div>
                <div className="pl-4 text-stone-300">"sha256:d9b2e...558a"</div>
                <div>);</div>
                <div className="pt-2 text-stone-500">// Illustrative stored result:</div>
                <div className="p-2 bg-stone-900 border border-stone-800 text-emerald-400 flex items-center justify-between">
                  <span>Verdict: APPROVED</span>
                  <span className="text-stone-400 text-[10px]">consensus-backed status</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-stone-600 font-mono">
                <span>Target: Atlas Deep Research</span>
                <span className="font-bold text-brand-orange">Charter-bound example</span>
              </div>
            </div>

            {/* Stepped Mosaic Blocks */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-3 shadow-[2px_2px_0px_#0B130E]">
                <div className="text-[10px] font-mono text-stone-700 uppercase font-bold">Evidence</div>
                <div className="text-xl font-black mt-1 text-brand-charcoal font-sans">Schema v2</div>
                <div className="text-[11px] leading-tight text-stone-800 mt-1 font-medium">Commit-pinned document</div>
              </div>
              <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-3 shadow-[2px_2px_0px_#0B130E]">
                <div className="text-[10px] font-mono text-stone-700 uppercase font-bold">Charter</div>
                <div className="text-xl font-black mt-1 text-brand-charcoal font-sans">Schema v1</div>
                <div className="text-[11px] leading-tight text-stone-800 mt-1 font-medium">Frozen capability baseline</div>
              </div>
              <div className="bg-brand-vibrantCyan border-2 border-brand-charcoal p-3 shadow-[2px_2px_0px_#0B130E]">
                <div className="text-[10px] font-mono text-stone-700 uppercase font-bold">Network</div>
                <div className="text-xl font-black mt-1 text-brand-charcoal font-sans">Studio-dev</div>
                <div className="text-[11px] leading-tight text-stone-800 mt-1 font-medium">Preview network may reset</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL METRICS BAR */}
      <section className="bg-brand-cream border-b-2 border-brand-charcoal" data-purpose="metrics-strip" data-testid="illustrative-metrics">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-16 pt-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700" data-testid="illustrative-metrics-label">
            ILLUSTRATIVE METRICS — NOT ON-CHAIN COUNTS
          </p>
        </div>
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-brand-charcoal font-mono">
          <div className="p-8">
            <span className="block text-4xl sm:text-5xl font-black text-brand-charcoal tracking-tight font-sans">142+</span>
            <span className="block text-xs uppercase tracking-wider font-bold text-stone-600 mt-1">Autonomous Agents Registered</span>
          </div>
          <div className="p-8">
            <span className="block text-4xl sm:text-5xl font-black text-brand-charcoal tracking-tight font-sans">889</span>
            <span className="block text-xs uppercase tracking-wider font-bold text-stone-600 mt-1">Release Proposals Evaluated</span>
          </div>
          <div className="p-8">
            <span className="block text-4xl sm:text-5xl font-black text-brand-orange tracking-tight font-sans">19</span>
            <span className="block text-xs uppercase tracking-wider font-bold text-stone-600 mt-1">Illustrative drift findings recorded</span>
          </div>
          <div className="p-8">
            <span className="block text-4xl sm:text-5xl font-black text-brand-charcoal tracking-tight font-sans">61997</span>
            <span className="block text-xs uppercase tracking-wider font-bold text-stone-600 mt-1">Studio Next Network ID</span>
          </div>
        </div>
      </section>

      {/* DARK FOREST GREEN SECTION: MISSION & CAPABILITIES */}
      <section className="bg-brand-forest text-stone-100 py-16 px-6 lg:px-16 border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-4">
              <span className="sticker-badge bg-brand-orange text-white mb-4">
                ✦ The Autonomous Dilemma
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight font-sans">
                When agents self-update, who verifies their boundaries?
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-6 text-stone-300 text-base md:text-lg leading-relaxed">
              <p>
                In the emerging autonomous software ecosystem, agents autonomously pull plugins, fetch updated weights, and invoke dynamic APIs. If a release secretly expands network scopes, requests new private file system privileges, or alters safety prompt baselines, host orchestrators are blind until funds or credentials leak.
              </p>
              <p className="font-medium text-white border-l-2 border-brand-pastelYellow pl-4">
                UpdateSeal introduces <span className="text-brand-pastelYellow font-bold">Charter-Bound Releases</span>: on-chain declarations specifying what an agent is allowed to do. Every submitted candidate may be evaluated against its frozen charter.
              </p>
            </div>
          </div>

          {/* Capability Charter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-brand-cream text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-stone-500">01 / SCOPE</span>
                  <div className="w-8 h-8 bg-brand-orange text-white flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2 font-sans">Network Endpoint Whitelists</h3>
                <p className="text-xs text-stone-700 leading-normal">
                  Charter outbound HTTP/RPC domains. If submitted evidence shows an undeclared domain, the candidate is recorded as a potential charter mismatch.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-300 flex items-center justify-between text-[11px] font-mono">
                <span>Checked by consensus</span>
                <span className="text-brand-orange font-bold">Evaluated</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-brand-pastelYellow text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-stone-700">02 / SECRETS</span>
                  <div className="w-8 h-8 bg-brand-charcoal text-brand-pastelYellow flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2 font-sans">Credential Permissions</h3>
                <p className="text-xs text-stone-800 leading-normal">
                  Detects candidate evidence that inspects environment variables, private keys, or enterprise OAuth tokens without a matching charter declaration.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono">
                <span>Charter match</span>
                <span className="font-bold">Zero Escalation</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-brand-pastelPink text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-stone-700">03 / BUDGET</span>
                  <div className="w-8 h-8 bg-brand-charcoal text-white flex items-center justify-center font-bold">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2 font-sans">On-Chain Gas &amp; Spends</h3>
                <p className="text-xs text-stone-800 leading-normal">
                  Stipulate declared transaction limits per epoch in the frozen charter. Downstream operators may use the verdict when reviewing spend-scope drift.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono">
                <span>Max allowance</span>
                <span className="font-bold">Charter-declared</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-brand-vibrantCyan text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-stone-700">04 / PROMPT</span>
                  <div className="w-8 h-8 bg-brand-charcoal text-brand-vibrantCyan flex items-center justify-center font-bold">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2 font-sans">System Prompt Drift</h3>
                <p className="text-xs text-stone-800 leading-normal">
                  The contract evaluates bounded, commit-pinned, content-hashed Evidence Schema v2. It does not independently fetch or reconstruct the full Git diff. The evidence document contains submitter-authored diff_summary, changed_files, capabilities, domains, evidence items, and tests.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono">
                <span>Semantic Validator</span>
                <span className="font-bold">Active</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-stone-500">05 / FS ACCESS</span>
                  <div className="w-8 h-8 bg-stone-200 text-brand-charcoal flex items-center justify-center font-bold">
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2 font-sans">Filesystem Capabilities</h3>
                <p className="text-xs text-stone-700 leading-normal">
                  Submitted evidence may declare filesystem capabilities for charter comparison. UpdateSeal records a verdict from that evidence; it does not enforce a runtime filesystem sandbox.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-300 flex items-center justify-between text-[11px] font-mono">
                <span>Evidence-declared paths</span>
                <span className="text-emerald-700 font-bold">Charter check</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-brand-charcoal text-white p-6 border-2 border-brand-orange shadow-[4px_4px_0px_#EF5313] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-brand-pastelYellow">06 / VERDICT</span>
                  <div className="w-8 h-8 bg-brand-orange text-white flex items-center justify-center font-bold">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2 text-white font-sans">Cryptographic Verdict</h3>
                <p className="text-xs text-stone-300 leading-normal">
                  The stored result contains the consensus-backed status, findings, evaluation attempts, and decision hash. Studio-dev is a preview network that may reset.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-700 flex items-center justify-between text-[11px] font-mono">
                <span>Chain 61997</span>
                <span className="text-brand-pastelYellow font-bold">On-chain record</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL ORANGE SECTION: 4 THE VERDICTS SHOWCASE */}
      <section className="bg-brand-orange text-white py-16 px-6 lg:px-16 border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-white/30 pb-6">
            <div>
              <span className="sticker-badge bg-brand-charcoal text-white mb-2">Deterministic Outcomes</span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-sans">
                The 4 Canonical Verdicts
              </h2>
            </div>
            <p className="text-white/90 text-sm max-w-md mt-4 md:mt-0 font-medium">
              Every package evaluation produces a machine-readable on-chain verdict backed by GenLayer validator consensus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Verdict 1: Approved */}
            <Link
              to="/decisions/approved"
              className="bg-white text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 transition-transform group flex flex-col justify-between"
            >
              <div>
                <div className="h-2 w-full bg-emerald-500 mb-4"></div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                  Code 0x01
                </span>
                <h3 className="text-2xl font-black uppercase mt-3 mb-2 font-sans group-hover:text-brand-orange transition-colors">
                  APPROVED
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Full consensus achieved. Submitted evidence adheres to the frozen charter. Operators may choose to deploy using this verdict.
                </p>
              </div>
              <div className="font-mono text-[11px] bg-stone-100 p-2 border border-stone-200">
                Action: Verdict available to consumers →
              </div>
            </Link>

            {/* Verdict 2: Review Required */}
            <Link
              to="/decisions/review-required"
              className="bg-white text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 transition-transform group flex flex-col justify-between"
            >
              <div>
                <div className="h-2 w-full bg-amber-500 mb-4"></div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-300">
                  Code 0x02
                </span>
                <h3 className="text-2xl font-black uppercase mt-3 mb-2 font-sans group-hover:text-brand-orange transition-colors">
                  REVIEW REQ.
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Borderline semantic drift detected. Does not violate hard limits but introduces ambiguous prompt alterations.
                </p>
              </div>
              <div className="font-mono text-[11px] bg-stone-100 p-2 border border-stone-200">
                Action: Human review outside this contract →
              </div>
            </Link>

            {/* Verdict 3: Capability Violation */}
            <Link
              to="/decisions/capability-violation"
              className="bg-white text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 transition-transform group flex flex-col justify-between"
            >
              <div>
                <div className="h-2 w-full bg-red-600 mb-4"></div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 border border-red-300">
                  Code 0x03
                </span>
                <h3 className="text-2xl font-black uppercase mt-3 mb-2 font-sans group-hover:text-error transition-colors">
                  VIOLATION
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Direct capability escalation detected (e.g. undeclared domain call, secret extraction, elevated storage).
                </p>
              </div>
              <div className="font-mono text-[11px] bg-red-50 text-red-900 p-2 border border-red-200 font-bold">
                Action: Recorded violation verdict →
              </div>
            </Link>

            {/* Verdict 4: Evidence Unavailable */}
            <Link
              to="/decisions/evidence-unavailable"
              className="bg-white text-brand-charcoal p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 transition-transform group flex flex-col justify-between"
            >
              <div>
                <div className="h-2 w-full bg-stone-400 mb-4"></div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 bg-stone-100 px-2 py-0.5 border border-stone-300">
                  Code 0x04
                </span>
                <h3 className="text-2xl font-black uppercase mt-3 mb-2 font-sans group-hover:text-brand-orange transition-colors">
                  EVIDENCE 404
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  The contract verifies raw GitHub evidence bytes against the submitted SHA-256. This verdict is recorded when those bytes cannot be fetched or the hash does not match.
                </p>
              </div>
              <div className="font-mono text-[11px] bg-stone-100 p-2 border border-stone-200">
                Action: Resubmit valid bundle →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 5-STEP EDITORIAL WORKFLOW */}
      <section className="bg-brand-cream py-16 px-6 lg:px-16 border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="sticker-badge bg-brand-pastelYellow text-brand-charcoal">Operational Protocol</span>
              <span className="sticker-badge bg-brand-orange text-white">Current Registry Flow</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
              How UpdateSeal Secures The Pipeline
            </h2>
            <p className="text-sm font-mono text-stone-700 mt-2 font-bold">
              Live Studio-dev flow: register, submit commit-pinned evidence, evaluate, store a terminal verdict.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 bg-white border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <div className="text-2xl font-black text-brand-orange mb-2 font-mono">01</div>
              <h4 className="font-bold uppercase text-sm mb-2 font-sans">Define Charter</h4>
              <p className="text-xs text-stone-600 leading-normal">
                Agent creator will register initial capability declaration for Studio Next with strict boundary limits.
              </p>
            </div>
            <div className="p-5 bg-white border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <div className="text-2xl font-black text-brand-orange mb-2 font-mono">02</div>
              <h4 className="font-bold uppercase text-sm mb-2 font-sans">Commit Candidate</h4>
              <p className="text-xs text-stone-600 leading-normal">
                CI/CD pipeline will build new release tag, compute git commit SHA, and will submit proposal payload for verification.
              </p>
            </div>
            <div className="p-5 bg-white border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <div className="text-2xl font-black text-brand-orange mb-2 font-mono">03</div>
              <h4 className="font-bold uppercase text-sm mb-2 font-sans">Consensus Audit</h4>
              <p className="text-xs text-stone-600 leading-normal">
                GenLayer validators will evaluate code analysis and prompt comparison models to identify diff anomalies.
              </p>
            </div>
            <div className="p-5 bg-white border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <div className="text-2xl font-black text-brand-orange mb-2 font-mono">04</div>
              <h4 className="font-bold uppercase text-sm mb-2 font-sans">Stored Verdict</h4>
              <p className="text-xs text-stone-600 leading-normal">
                The stored result contains the consensus-backed status, findings, evaluation attempts, and decision hash. Individual validator signatures are not stored.
              </p>
            </div>
            <div className="p-5 bg-brand-charcoal text-white border-2 border-brand-charcoal shadow-[3px_3px_0px_#EF5313]">
              <div className="text-2xl font-black text-brand-pastelYellow mb-2 font-mono">05</div>
              <h4 className="font-bold uppercase text-sm mb-2 font-sans">Consumer Gate</h4>
              <p className="text-xs text-stone-300 leading-normal">
                Downstream systems may consume the stored on-chain verdict as a release-policy input. UpdateSeal does not itself halt external CI/CD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT FINAL CALL-TO-ACTION SECTION */}
      <section className="bg-brand-charcoal text-white border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x-2 divide-stone-800">
          <div className="p-8 lg:p-16 flex flex-col justify-between">
            <div>
              <span className="sticker-badge bg-brand-pastelYellow text-brand-charcoal mb-4">For Agent Developers</span>
              <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-4 font-sans">
                Register Your Agent’s Baseline Charter
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                A verdict provides auditable evidence for downstream release policy; it is not a guarantee that the software is vulnerability-free or incapable of future drift.
              </p>
            </div>
            <div>
              <Link
                to="/register/identity"
                className="bg-brand-orange hover:bg-white hover:text-brand-charcoal text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 transition-colors border border-stone-800 flex items-center gap-2 inline-flex font-mono"
              >
                <span>Start 4-Step Registration Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-8 lg:p-16 flex flex-col justify-between bg-brand-forestDark">
            <div>
              <span className="sticker-badge bg-brand-vibrantCyan text-brand-charcoal mb-4">For Orchestrators &amp; Runners</span>
              <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-4 font-sans">
                Integrate Zero-Trust Interceptor
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                Query our GenLayer Studio Next intelligent contract before launching any external sub-agent or plugin worker.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/verify"
                className="bg-brand-pastelYellow text-brand-charcoal hover:bg-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 transition-colors border border-brand-charcoal flex items-center gap-2 font-mono"
              >
                <span>Interactive Release Validator</span>
                <Terminal className="w-4 h-4" />
              </Link>
              <Link
                to="/decisions/capability-violation"
                className="text-white hover:text-brand-pastelYellow text-xs font-mono font-bold uppercase tracking-wider px-4 py-3 flex items-center gap-1"
              >
                <span>Inspect Example Violation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
