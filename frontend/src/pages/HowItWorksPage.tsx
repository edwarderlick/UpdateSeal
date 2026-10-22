import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Terminal } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Topmost Monospaced Gazette Header */}
      <section className="w-full bg-[#FAF8F4] px-4 lg:px-12 py-10 border-b-2 border-brand-charcoal">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="bg-brand-forest text-brand-pastelYellow px-2.5 py-1 uppercase tracking-widest font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                [SPECIFICATION v1.0]
              </span>
              <span className="text-stone-600 font-bold uppercase tracking-wider">
                // THE UPDATE SEAL CONSENSUS PROTOCOL
              </span>
            </div>
            <div className="flex items-center gap-4 text-stone-600">
              <span className="flex items-center gap-1 font-bold text-brand-charcoal">
                <Shield className="w-3.5 h-3.5 text-brand-orange" />
                GENLAYER STD NEXT 61997
              </span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">RFC-0089-AUTONOMOUS-RELEASE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col">
              <div className="inline-block self-start mb-3">
                <span className="bg-brand-orange text-white font-mono text-xs uppercase px-3 py-1 font-bold -rotate-1 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  CRYPTOGRAPHIC RUNTIME BOUNDARIES
                </span>
              </div>
              <h1 className="font-sans font-black text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal uppercase tracking-tighter leading-none mb-4">
                How UpdateSeal Enforces Autonomous Agent Safety On-Chain
              </h1>
            </div>

            <div className="lg:col-span-4 flex flex-col pt-2 font-sans">
              <p className="text-stone-700 leading-relaxed mb-4 text-sm font-medium">
                Zero-trust release certification for self-updating AI systems. Non-custodial governance powered by GenLayer Studio Next intelligent contracts, multi-validator LLM evaluator swarms, and deterministic AST differential verification.
              </p>
              <div className="bg-white border-2 border-brand-charcoal p-4 flex items-center justify-between shadow-[3px_3px_0px_#0B130E]">
                <div className="flex flex-col font-mono text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Registry Contract</span>
                  <span className="text-sm font-black text-brand-charcoal">Contract integration pending</span>
                </div>
                <Terminal className="w-5 h-5 text-brand-orange" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Telemetry Ribbon */}
      <section className="w-full bg-brand-forest text-white px-4 lg:px-12 py-3 border-b-2 border-brand-charcoal font-mono text-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-brand-pastelYellow font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ● PROTOCOL CONSENSUS STATE: DEMO MODE
            </span>
            <span className="text-stone-300 hidden md:inline">GOVERNANCE: NON-CUSTODIAL (NO SLASHING)</span>
          </div>
          <div className="flex items-center gap-6 text-stone-300">
            <span>NETWORK: STUDIO NEXT (61997)</span>
            <span>VALIDATOR QUORUM: 5-OF-5</span>
            <span className="text-brand-pastelYellow font-bold">REPRODUCIBLE DECISIONS: ACTIVE</span>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-12 space-y-16">
        {/* Section 01: Core Architecture & How UpdateSeal Works */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b-2 border-brand-charcoal">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
                [SECTION 01: THE 5-STAGE GOVERNANCE LIFECYCLE]
              </span>
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
                How UpdateSeal Operates
              </h2>
            </div>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              STUDIO NEXT STANDARD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 01
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Package &amp; Frozen Charter
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  A publisher registers a package and its frozen release charter. This document establishes hard constraints across all 6 core operating vectors: network egress allowlists, filesystem sandboxing, process execution, cryptographic signing, spending limits, and external data export.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Frozen Charter Specification
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 02 &amp; 03
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Candidate Submission &amp; Swarm Evaluation
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  A candidate release is submitted with cryptographic evidence (commit SHA, Git tree, and boundary diff). Independent GenLayer validators evaluate the candidate against the frozen charter using AST diffing and LLM enclaves to detect any unchartered capability expansions.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Quorum: 5-of-5 Multi-Validator Consensus
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-brand-vibrantCyan border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 04 &amp; 05
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Decision Report &amp; Registry Inscription
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  A reproducible decision report is produced with full diagnostic telemetry. Approved release records can later be written to the registry contract. UpdateSeal v1 does not custody user funds and does not implement slashing.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Guarantee: Non-Custodial &amp; Zero Slashing
              </div>
            </div>
          </div>

          {/* Non-Custodial Notice Banner */}
          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-0.5 uppercase border border-brand-charcoal">
                  NON-CUSTODIAL SAFETY
                </span>
                <h4 className="font-sans font-black text-sm uppercase text-brand-charcoal">
                  UpdateSeal v1 Protocol Philosophy
                </h4>
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
                UpdateSeal v1 does not hold user deposits, lock operator bonds, or execute financial slashing. The protocol focuses purely on cryptographic runtime verification, semantic boundary auditing, and reproducible on-chain governance records.
              </p>
            </div>
          </div>
        </section>

        {/* Section 02: 4 Canonical Verdicts */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b-2 border-brand-charcoal">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
                [SECTION 02: THE 4 CANONICAL VERDICTS]
              </span>
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
                Universal Consensus Outcomes
              </h2>
            </div>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              REPRODUCIBLE DECISIONS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 0x01 Approved */}
            <article className="bg-white border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-brand-charcoal">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-1 font-bold">
                    0x01
                  </span>
                  <h3 className="font-sans font-black text-lg uppercase text-brand-charcoal">
                    APPROVED
                  </h3>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
                The candidate release diff introduces zero unchartered behaviors. All validator nodes concur that execution parameters, memory boundaries, and network requests conform to the immutable charter. The approved release record can later be written to the registry contract.
              </p>
              <div className="pt-2">
                <Link to="/decisions/approved" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View Sample 0x01 Report →
                </Link>
              </div>
            </article>

            {/* 0x02 Review Required */}
            <article className="bg-white border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-brand-charcoal">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-xs px-2.5 py-1 font-bold border border-brand-charcoal">
                    0x02
                  </span>
                  <h3 className="font-sans font-black text-lg uppercase text-brand-charcoal">
                    REVIEW REQUIRED
                  </h3>
                </div>
                <AlertTriangle className="w-5 h-5 text-brand-orange" />
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
                The candidate introduces legitimate expansions (e.g. adding a new academic data endpoint) that exceed the existing charter baseline. Automated execution is temporarily halted pending 2-of-3 human guardian multisig ratification.
              </p>
              <div className="pt-2">
                <Link to="/decisions/review-required" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View Sample 0x02 Report →
                </Link>
              </div>
            </article>

            {/* 0x03 Capability Violation */}
            <article className="bg-white border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-brand-charcoal">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-orange text-white font-mono text-xs px-2.5 py-1 font-bold">
                    0x03
                  </span>
                  <h3 className="font-sans font-black text-lg uppercase text-brand-charcoal">
                    CAPABILITY VIOLATION
                  </h3>
                </div>
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
                Critical safety violation detected: the candidate attempts unauthorized process execution, file escaping, or data exfiltration to unwhitelisted hosts. The release is irrevocably rejected, the candidate is quarantined, and the decision report records the capability breach.
              </p>
              <div className="pt-2">
                <Link to="/decisions/capability-violation" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View Sample 0x03 Report →
                </Link>
              </div>
            </article>

            {/* 0x04 Evidence Unavailable */}
            <article className="bg-white border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-brand-charcoal">
                <div className="flex items-center gap-2">
                  <span className="bg-stone-800 text-white font-mono text-xs px-2.5 py-1 font-bold">
                    0x04
                  </span>
                  <h3 className="font-sans font-black text-lg uppercase text-brand-charcoal">
                    EVIDENCE UNAVAILABLE
                  </h3>
                </div>
                <AlertCircle className="w-5 h-5 text-stone-600" />
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
                Oracle nodes were unable to clone the Git repository, the specified commit SHA does not exist on the remote host, or the manifest checksum failed cryptographic verification. Evaluation is aborted prior to AST inspection.
              </p>
              <div className="pt-2">
                <Link to="/decisions/evidence-unavailable" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View Sample 0x04 Report →
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* Section 03: CTA Footer Block */}
        <section className="bg-brand-cream border-2 border-brand-charcoal p-8 lg:p-12 shadow-[8px_8px_0px_#0B130E] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
              GET STARTED
            </span>
            <h2 className="font-sans font-black text-2xl lg:text-3xl uppercase tracking-tight text-brand-charcoal">
              Protect Your Autonomous Agent Pipeline
            </h2>
            <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
              Join leading autonomous systems securing their release lifecycles on GenLayer Studio Next. Prevent rogue prompt injections and maintain auditability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto font-mono text-xs">
            <Link
              to="/register/identity"
              className="w-full sm:w-auto px-6 py-3.5 bg-brand-orange hover:bg-brand-orangeDark text-white font-bold uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] text-center"
            >
              Register An Agent Charter →
            </Link>
            <Link
              to="/registry"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-stone-100 text-brand-charcoal font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] text-center"
            >
              Explore Public Registry
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
