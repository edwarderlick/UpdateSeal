import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Terminal } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-16">
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
                  COMMIT-PINNED EVIDENCE VERDICTS
                </span>
              </div>
              <h1 className="font-sans font-black text-3xl sm:text-4xl lg:text-5xl text-brand-charcoal uppercase tracking-tighter leading-none mb-4">
                How UpdateSeal Records Autonomous Agent Release Verdicts On-Chain
              </h1>
            </div>

            <div className="lg:col-span-4 flex flex-col pt-2 font-sans">
              <p className="text-stone-700 leading-relaxed mb-4 text-sm font-medium">
                Evidence-based release registry for self-updating AI systems. GenLayer validators evaluate commit-pinned Evidence Schema v2 against a frozen capability charter and store a machine-readable on-chain verdict that external systems may consume.
              </p>
              <div className="bg-white border-2 border-brand-charcoal p-4 flex items-center justify-between shadow-[3px_3px_0px_#0B130E]">
                <div className="flex flex-col font-mono text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Registry Contract</span>
                  <span className="text-sm font-black text-brand-charcoal break-all">0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3</span>
                </div>
                <Terminal className="w-5 h-5 text-brand-orange" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-brand-forest text-white px-4 lg:px-12 py-3 border-b-2 border-brand-charcoal font-mono text-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-brand-pastelYellow font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ● PROTOCOL CONSENSUS STATE: STUDIO-DEV
            </span>
            <span className="text-stone-300 hidden md:inline">NO ON-CHAIN MULTISIG</span>
          </div>
          <div className="flex items-center gap-6 text-stone-300">
            <span>NETWORK: STUDIO NEXT (61997)</span>
            <span>GENLAYER VALIDATOR CONSENSUS</span>
            <span className="text-brand-pastelYellow font-bold">TERMINAL VERDICTS STORED</span>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-12 space-y-16">
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b-2 border-brand-charcoal">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
                [SECTION 01: THE 7-STAGE RELEASE LIFECYCLE]
              </span>
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
                How UpdateSeal Operates
              </h2>
            </div>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              STUDIO NEXT STANDARD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 01
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Publisher-Scoped Registration
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  A publisher wallet registers a package. Identity is <code className="font-mono text-[11px] font-bold">lowercase(publisher)/package_slug</code>. Only that publisher may later submit candidates.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Publisher-scoped package UID
              </div>
            </div>

            <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 02
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Immutable Baseline &amp; Charter
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  Registration stores an immutable baseline commit and capability charter. That charter is the frozen policy later evaluations compare against.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Frozen charter hash
              </div>
            </div>

            <div className="bg-brand-vibrantCyan border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 03
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Commit-Pinned Evidence v2
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  The publisher submits a candidate with a commit SHA, exact raw evidence URL, and SHA-256 of the Evidence Schema v2 document.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: PENDING candidate record
              </div>
            </div>

            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 04
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Deterministic Checks
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  The contract validates schema, candidate identity, and evidence hash before any nondeterministic evaluation runs.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Bounded, hashed evidence
              </div>
            </div>

            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 05
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  GenLayer Evaluation
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  GenLayer validators perform nondeterministic evidence evaluation against the frozen charter. Submitter-authored evidence cannot override evaluator instructions.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Validator consensus
              </div>
            </div>

            <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 06
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  On-Chain Verdict
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  The contract stores status, findings, attempts, and a decision hash. APPROVED, REVIEW_REQUIRED, and VIOLATION are terminal.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Decision hash
              </div>
            </div>

            <div className="bg-brand-vibrantCyan border-2 border-brand-charcoal p-6 shadow-[5px_5px_0px_#0B130E] flex flex-col justify-between space-y-6 md:col-span-2 lg:col-span-2">
              <div className="space-y-3">
                <span className="bg-brand-charcoal text-white font-mono text-xs font-bold px-2 py-0.5 inline-block uppercase">
                  Step 07
                </span>
                <h3 className="font-sans font-black text-xl uppercase tracking-tight text-brand-charcoal">
                  Public Independent Verification
                </h3>
                <p className="font-sans text-xs text-stone-800 leading-relaxed font-medium">
                  Anyone can read the stored verdict, recompute the decision hash, and optionally hash evidence bytes. External systems may consume the verdict as a release-policy input. UpdateSeal v1 does not implement an on-chain multisig and does not halt external CI/CD.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Output: Public registry record
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-0.5 uppercase border border-brand-charcoal">
                  CONSEQUENCE BOUNDARY
                </span>
                <h4 className="font-sans font-black text-sm uppercase text-brand-charcoal">
                  UpdateSeal v1 Protocol Philosophy
                </h4>
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
                UpdateSeal does not itself deploy software, halt external CI/CD systems, operate a multisig, hold escrow, or transfer funds. External release systems may choose to treat the on-chain verdict as a deployment gate.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8" id="verdicts">
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
                Evidence supports no unchartered capability relative to the frozen charter. The contract stores a terminal APPROVED verdict and decision hash. External systems may consume it.
              </p>
              <div className="pt-2">
                <Link to="/decisions/approved" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View design preview 0x01 →
                </Link>
              </div>
            </article>

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
                The contract records REVIEW_REQUIRED when the evidence does not support a confident approval or clear violation. Human operators or external release systems decide what to do next; UpdateSeal v1 does not implement an on-chain multisig.
              </p>
              <div className="pt-2">
                <Link to="/decisions/review-required" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View design preview 0x02 →
                </Link>
              </div>
            </article>

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
                Submitted evidence indicates a capability that exceeds the frozen charter. The contract stores a terminal VIOLATION verdict. Downstream systems may treat that record as a fail; UpdateSeal does not itself halt external deployment.
              </p>
              <div className="pt-2">
                <Link to="/decisions/capability-violation" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View design preview 0x03 →
                </Link>
              </div>
            </article>

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
                Evidence bytes could not be fetched or authenticated to the declared repository, commit, URL, and hash. EVIDENCE_UNAVAILABLE may be retried only below the three-attempt maximum.
              </p>
              <div className="pt-2">
                <Link to="/decisions/evidence-unavailable" className="font-mono text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  View design preview 0x04 →
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="bg-brand-cream border-2 border-brand-charcoal p-8 lg:p-12 shadow-[8px_8px_0px_#0B130E] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
              GET STARTED
            </span>
            <h2 className="font-sans font-black text-2xl lg:text-3xl uppercase tracking-tight text-brand-charcoal">
              Record Your Autonomous Agent Charter
            </h2>
            <p className="font-sans text-xs text-stone-700 leading-relaxed font-medium">
              Register a publisher-scoped package, submit commit-pinned evidence, and store a consensus-backed verdict that external systems may consume.
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
