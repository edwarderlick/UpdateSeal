import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  ArrowRight,
  Plus,
  Shield,
  CheckCircle,
  Copy,
  Terminal,
  Code2,
} from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';
import { DesignDemoBanner } from '../components/ui/DesignDemoBanner';

export const PackageDetailPage: React.FC = () => {
  const navigate = useNavigate();

  const copyAddress = () => {
    navigator.clipboard.writeText('0x74a1B289C82A2E1199a0342C9c4F');
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <DesignDemoBanner />
      {/* Top Dossier Bar with Breadcrumb Metadata */}
      <div className="bg-brand-charcoal text-white px-6 py-2.5 border-b-2 border-brand-charcoal flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/registry" className="text-stone-400 hover:text-white transition-colors">
            Registry
          </Link>
          <span className="text-stone-500">/</span>
          <span className="text-stone-400">Agents</span>
          <span className="text-stone-500">/</span>
          <span className="text-brand-pastelYellow font-bold">atlas-research-agent</span>
        </div>
        <div className="hidden md:flex items-center gap-3 font-mono text-xs">
          <span className="inline-block w-2.5 h-2.5 bg-brand-orange"></span>
          <span className="text-brand-cream font-semibold tracking-wider">
            GENLAYER RECORD: REG-61997-042
          </span>
        </div>
      </div>

      <section className="w-full bg-brand-cream px-6 lg:px-12 pt-8 pb-16 flex-grow">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
          {/* Header Hero Card: Solid Dark Green Editorial Block */}
          <div className="bg-brand-forest text-brand-cream border-2 border-brand-charcoal p-8 lg:p-10 shadow-[8px_8px_0px_#0B130E] relative">
            <div className="absolute -top-3.5 left-8 bg-brand-pastelYellow text-brand-charcoal font-mono text-xs font-bold px-3 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              ✦ CANONICAL CHARTER ACTIVE
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pt-2">
              <div className="flex flex-col gap-5 max-w-4xl">
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                  <span className="bg-brand-charcoal text-brand-cream border border-stone-600 px-3 py-1 font-bold uppercase tracking-wider">
                    REG-61997-042
                  </span>
                  <span className="bg-emerald-400 text-brand-charcoal px-3 py-1 uppercase font-bold flex items-center gap-1.5 border border-brand-charcoal">
                    <CheckCircle className="w-3.5 h-3.5 text-brand-charcoal" />
                    STATUS: APPROVED (0X01)
                  </span>
                  <span className="bg-brand-forest text-stone-300 border border-stone-700 px-3 py-1 uppercase">
                    SLOT: GENLAYER 61997
                  </span>
                </div>

                <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl text-white font-black tracking-tighter uppercase leading-none">
                  Atlas Research Agent
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 pt-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 uppercase">REPO:</span>
                    <a
                      href="https://github.com/atlas-protocol/research-agent"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-orange hover:text-brand-pastelYellow underline font-bold flex items-center gap-1"
                    >
                      <span>github.com/atlas-protocol/research-agent</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 uppercase">PUBLISHER:</span>
                    <span className="font-mono text-white font-bold">0x82fD...1C12</span>
                    <CopyButton text="0x82fDe1090c2941E5D8742A944813EbFc09C91C12" />
                    <span className="bg-brand-pastelYellow text-brand-charcoal border border-brand-charcoal px-1.5 py-0.5 text-[10px] uppercase font-bold">
                      Demo Signer
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 font-mono text-xs">
                <Link
                  to="/verify"
                  className="bg-brand-orange text-white hover:bg-white hover:text-brand-charcoal border-2 border-brand-charcoal px-6 py-4 font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#0B130E] transition-all cursor-pointer"
                >
                  <span>VERIFY THIS RELEASE</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/packages/atlas-research-agent/releases/new/identity"
                  className="bg-brand-charcoal text-brand-cream hover:bg-stone-800 border-2 border-brand-cream px-6 py-4 font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#EF5313] transition-all cursor-pointer"
                >
                  <span>SUBMIT CANDIDATE RELEASE</span>
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Metadata Matrix Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-2 border-brand-charcoal bg-white shadow-[4px_4px_0px_#0B130E] font-mono">
            <div className="flex flex-col gap-1 p-5 border-b md:border-b-0 md:border-r border-brand-charcoal bg-stone-50">
              <span className="text-xs uppercase text-stone-500 font-bold">Approved Baseline</span>
              <span className="font-sans text-2xl font-black text-brand-charcoal">v1.4.2</span>
              <span className="text-[11px] text-brand-orange font-bold uppercase tracking-wider">
                Immutable Head
              </span>
            </div>
            <div className="flex flex-col gap-1 p-5 border-b md:border-b-0 md:border-r border-brand-charcoal">
              <span className="text-xs uppercase text-stone-500 font-bold">Target Commit Hash</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-charcoal truncate max-w-[140px]">
                  d9b2e04f81c9...
                </span>
                <CopyButton text="d9b2e04f81c9a72b6c31048f9024cbb4901f4a9c" />
              </div>
              <span className="text-[11px] text-stone-500">Validated 12 Oct 2024</span>
            </div>
            <div className="flex flex-col gap-1 p-5 border-b md:border-b-0 md:border-r border-brand-charcoal bg-stone-50">
              <span className="text-xs uppercase text-stone-500 font-bold">Consensus Weight</span>
              <span className="font-sans text-2xl font-black text-emerald-800">99.84%</span>
              <span className="text-[11px] text-stone-600">5 Multi-LLM Validators</span>
            </div>
            <div className="flex flex-col gap-1 p-5">
              <span className="text-xs uppercase text-stone-500 font-bold">Re-eval Trigger Policy</span>
              <span className="text-sm font-black text-brand-orange uppercase">Strict Drift Stop</span>
              <span className="text-[11px] text-stone-500">Full charter comparison</span>
            </div>
          </div>

          {/* Section A: Frozen Capability Charter */}
          <div className="w-full">
            <div className="flex items-end justify-between pb-3 border-b-2 border-brand-charcoal mb-6">
              <div>
                <div className="font-mono text-xs text-brand-orange uppercase tracking-widest font-black">
                  Section A
                </div>
                <h2 className="font-sans text-3xl font-black uppercase text-brand-charcoal tracking-tight">
                  Frozen Capability Charter
                </h2>
              </div>
              <span className="font-mono text-xs bg-brand-charcoal text-brand-pastelYellow px-2.5 py-1 font-bold uppercase tracking-wider border border-brand-charcoal">
                SPEC v1.4 • IMMUTABLE STATE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Network */}
              <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E] relative">
                <div className="flex items-start justify-between mb-4 font-mono text-xs">
                  <span className="font-bold text-brand-charcoal">[01] NETWORK ACCESS</span>
                  <span className="bg-brand-forest text-brand-pastelYellow text-[11px] px-2 py-0.5 uppercase font-bold border border-brand-charcoal">
                    Allowed With Limits
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-lg font-black uppercase text-brand-charcoal mb-2">
                    Egress Destination Envelope
                  </h3>
                  <p className="text-xs text-stone-800 leading-relaxed mb-4 font-medium">
                    Strict outbound allowlist enforced via smart contract firewall hooks. All arbitrary socket creation blocked.
                  </p>
                  <div className="bg-white border border-brand-charcoal p-3 font-mono text-[11px] text-brand-charcoal flex flex-col gap-1">
                    <span className="text-brand-orange font-bold uppercase">Whitelisted Hosts:</span>
                    <span>• api.anthropic.com (HTTPS:443)</span>
                    <span>• api.genlayer.io (RPC:443)</span>
                    <span>• arxiv.org (HTTPS:443)</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal flex items-center justify-between text-stone-700 font-mono text-[10px] font-bold">
                  <span>DRIFT: ZERO</span>
                  <span>PORT: STRICT</span>
                </div>
              </div>

              {/* Card 2: Files */}
              <div className="bg-white border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E] relative">
                <div className="flex items-start justify-between mb-4 font-mono text-xs">
                  <span className="font-bold text-brand-charcoal">[02] FILE &amp; DATA ACCESS</span>
                  <span className="bg-brand-vibrantCyan text-brand-charcoal text-[11px] px-2 py-0.5 uppercase font-bold border border-brand-charcoal">
                    Allowed With Limits
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-lg font-black uppercase text-brand-charcoal mb-2">
                    Sandbox Storage Boundary
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed mb-4">
                    Containerized read/write constrained strictly to isolated workspace paths. Directory traversal attempts trigger immediate lock.
                  </p>
                  <div className="bg-stone-50 border border-brand-charcoal p-3 font-mono text-[11px] text-brand-charcoal flex flex-col gap-1">
                    <span className="text-emerald-800 font-bold uppercase">Permitted Root:</span>
                    <span>• /tmp/workspace/** (Max 250MB)</span>
                    <span className="text-error font-bold mt-1 uppercase">Prohibited Paths:</span>
                    <span>• /etc, /root, ~/.ssh, /var/run</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal flex items-center justify-between text-stone-600 font-mono text-[10px] font-bold">
                  <span>CHROOT ENFORCED</span>
                  <span>VOLATILE ONLY</span>
                </div>
              </div>

              {/* Card 3: Process */}
              <div className="bg-white border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E] relative">
                <div className="flex items-start justify-between mb-4 font-mono text-xs">
                  <span className="font-bold text-brand-charcoal">[03] SHELL &amp; PROCESS EXEC</span>
                  <span className="bg-error text-white text-[11px] px-2 py-0.5 uppercase font-bold border border-brand-charcoal">
                    Prohibited
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-lg font-black uppercase text-brand-charcoal mb-2">
                    Process Fork Suspension
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed mb-4">
                    Zero system subshell execution permitted. Agent must operate purely in runtime interpreter without subprocess spawn access.
                  </p>
                  <div className="bg-error-container/20 border border-error p-3 font-mono text-[11px] text-brand-charcoal flex flex-col gap-1">
                    <span className="text-error font-bold uppercase">Blocked Interfaces:</span>
                    <span>• child_process.spawn()</span>
                    <span>• exec(), /bin/sh, /bin/bash</span>
                    <span>• dlopen native modules</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal flex items-center justify-between text-stone-600 font-mono text-[10px] font-bold">
                  <span>SECCOMP LEVEL 3</span>
                  <span>NO FORKS</span>
                </div>
              </div>

              {/* Card 4: Signing */}
              <div className="bg-white border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E] relative">
                <div className="flex items-start justify-between mb-4 font-mono text-xs">
                  <span className="font-bold text-brand-charcoal">[04] WALLET &amp; SIGNING</span>
                  <span className="bg-error text-white text-[11px] px-2 py-0.5 uppercase font-bold border border-brand-charcoal">
                    Prohibited
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-lg font-black uppercase text-brand-charcoal mb-2">
                    Key Management Lockout
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed mb-4">
                    Agent runtime environment is strictly prohibited from holding private keys, seed phrases, or initiating digital signatures.
                  </p>
                  <div className="bg-stone-50 border border-brand-charcoal p-3 font-mono text-[11px] text-brand-charcoal flex flex-col gap-1">
                    <span className="text-error font-bold uppercase">Restricted Directives:</span>
                    <span>• eth_sign, personal_sign</span>
                    <span>• Storage of secp256k1 keys</span>
                    <span>• Autonomous tx broadcasts</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal flex items-center justify-between text-stone-600 font-mono text-[10px] font-bold">
                  <span>KEYLESS SANDBOX</span>
                  <span>PASSIVE READ</span>
                </div>
              </div>

              {/* Card 5: Spending */}
              <div className="bg-white border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E] relative">
                <div className="flex items-start justify-between mb-4 font-mono text-xs">
                  <span className="font-bold text-brand-charcoal">[05] PAYMENT &amp; SPENDING</span>
                  <span className="bg-brand-pastelYellow text-brand-charcoal text-[11px] px-2 py-0.5 uppercase font-bold border border-brand-charcoal">
                    Allowed With Limits
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-lg font-black uppercase text-brand-charcoal mb-2">
                    Micro-Debit Gas Envelope
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed mb-4">
                    Capped gas relay authorization for autonomous querying and LLM compute arbitration tokens.
                  </p>
                  <div className="bg-stone-50 border border-brand-charcoal p-3 font-mono text-[11px] text-brand-charcoal flex flex-col gap-1">
                    <span className="text-brand-orange font-bold uppercase">Authorized Cap:</span>
                    <span>• Max: 10.0 test GEN per 24 hours</span>
                    <span>• Cooldown: Resets 00:00 UTC</span>
                    <span>• Relayed via GenLayer Studio Next (Demo)</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal flex items-center justify-between text-stone-600 font-mono text-[10px] font-bold">
                  <span>HARD SPEND CAP</span>
                  <span>NON-CUSTODIAL</span>
                </div>
              </div>

              {/* Card 6: Export */}
              <div className="bg-white border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[4px_4px_0px_#0B130E] relative">
                <div className="flex items-start justify-between mb-4 font-mono text-xs">
                  <span className="font-bold text-brand-charcoal">[06] EXTERNAL DATA EXPORT</span>
                  <span className="bg-emerald-400 text-brand-charcoal text-[11px] px-2 py-0.5 uppercase font-bold border border-brand-charcoal">
                    Allowed
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-lg font-black uppercase text-brand-charcoal mb-2">
                    Structured Schema Output
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed mb-4">
                    Synthesis outputs may be transmitted downstream only if payload adheres to frozen JSON canonical schema definition.
                  </p>
                  <div className="bg-stone-50 border border-brand-charcoal p-3 font-mono text-[11px] text-brand-charcoal flex flex-col gap-1">
                    <span className="text-brand-charcoal font-bold uppercase">Schema Constraints:</span>
                    <span>• Format: schema_v2.json</span>
                    <span>• Raw memory leaks blocked</span>
                    <span>• Cryptographic signature check</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal flex items-center justify-between text-stone-600 font-mono text-[10px] font-bold">
                  <span>SCHEMA STRICT</span>
                  <span>SANITIZED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Release Timeline & Candidate History */}
          <div className="w-full">
            <div className="flex items-end justify-between pb-3 border-b-2 border-brand-charcoal mb-6">
              <div>
                <div className="font-mono text-xs text-brand-orange uppercase tracking-widest font-black">
                  Section B
                </div>
                <h2 className="font-sans text-3xl font-black uppercase text-brand-charcoal tracking-tight">
                  Release Timeline &amp; Candidate History
                </h2>
              </div>
              <span className="font-mono text-xs bg-brand-charcoal text-brand-cream px-2.5 py-1 font-bold uppercase tracking-wider border border-brand-charcoal">
                Consensus Ledger
              </span>
            </div>

            <div className="w-full bg-white border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E] overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-brand-forest text-brand-cream font-mono text-xs uppercase tracking-wider border-b-2 border-brand-charcoal">
                  <tr>
                    <th className="py-3.5 px-5">Release Version</th>
                    <th className="py-3.5 px-5">Commit Ref</th>
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-5">Verdict Code</th>
                    <th className="py-3.5 px-5">Validation Audit Rationale</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-brand-charcoal">
                  {/* Candidate v1.5.0 */}
                  <tr className="bg-stone-50 hover:bg-stone-100 transition-colors">
                    <td className="py-4 px-5 font-black text-sm text-error">
                      v1.5.0-rc1
                      <span className="block font-mono text-[10px] text-error font-bold tracking-wider">
                        CANDIDATE BRANCH
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-brand-charcoal font-bold">61997-402</td>
                    <td className="py-4 px-5 font-mono text-[11px] text-stone-600">Today 14:22 UTC</td>
                    <td className="py-4 px-5">
                      <span className="bg-brand-orange text-white font-mono text-[10px] px-2.5 py-1 uppercase font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                        0x03 VIOLATION
                      </span>
                    </td>
                    <td className="py-4 px-5 text-brand-charcoal">
                      <div className="font-bold text-error uppercase text-xs font-mono">
                        Unchartered child_process.spawn() detected
                      </div>
                      <div className="font-sans text-[11px] text-stone-600">
                        Attempted unchartered shell fork violates Rule [03]. Blocked at validator gate.
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to="/decisions/capability-violation"
                        className="bg-error text-white font-mono text-[11px] uppercase font-bold px-3 py-1.5 border border-brand-charcoal hover:bg-brand-charcoal transition-colors inline-flex items-center gap-1 shadow-[2px_2px_0px_#0B130E]"
                      >
                        <span>Inspect Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>

                  {/* Baseline v1.4.2 */}
                  <tr className="bg-white hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-5 font-black text-sm text-brand-charcoal">
                      v1.4.2
                      <span className="block font-mono text-[10px] text-brand-forest font-bold tracking-wider uppercase">
                        ACTIVE BASELINE
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-brand-charcoal font-bold">d9b2e...558a</td>
                    <td className="py-4 px-5 font-mono text-[11px] text-stone-600">12 Oct 2024</td>
                    <td className="py-4 px-5">
                      <span className="bg-emerald-400 text-brand-charcoal font-mono text-[10px] px-2.5 py-1 uppercase font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                        0x01 APPROVED
                      </span>
                    </td>
                    <td className="py-4 px-5 text-brand-charcoal">
                      <div className="font-bold text-emerald-800 text-xs font-mono uppercase">
                        Consensus 99.84% concur
                      </div>
                      <div className="font-sans text-[11px] text-stone-600">
                        Zero behavioral drift detected. arXiv query parser performance optimization.
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to="/decisions/approved"
                        className="bg-brand-forest text-brand-cream font-mono text-[11px] uppercase font-bold px-3 py-1.5 border border-brand-charcoal hover:bg-brand-orange transition-colors inline-flex items-center gap-1 shadow-[2px_2px_0px_#0B130E]"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>

                  {/* v1.4.1 */}
                  <tr className="bg-stone-50 hover:bg-stone-100 transition-colors">
                    <td className="py-4 px-5 font-black text-sm text-stone-700">
                      v1.4.1
                      <span className="block font-mono text-[10px] text-stone-500 font-bold uppercase">
                        ARCHIVED
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-brand-charcoal font-bold">88a10...90cc</td>
                    <td className="py-4 px-5 font-mono text-[11px] text-stone-600">28 Sep 2024</td>
                    <td className="py-4 px-5">
                      <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] px-2.5 py-1 uppercase font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                        0x02 REVIEW REQ
                      </span>
                    </td>
                    <td className="py-4 px-5 text-brand-charcoal">
                      <div className="font-bold text-brand-charcoal text-xs font-mono uppercase">
                        Illustrative human review (design demo)
                      </div>
                      <div className="font-sans text-[11px] text-stone-600">
                        Expanded arXiv rate limit from 10 req/m to 30 req/m. Manually approved.
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to="/decisions/review-required"
                        className="bg-white text-brand-charcoal font-mono text-[11px] uppercase font-bold px-3 py-1.5 border border-brand-charcoal hover:bg-brand-charcoal hover:text-white transition-colors inline-flex items-center gap-1 shadow-[2px_2px_0px_#0B130E]"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: On-Chain Machine Verification */}
          <div className="w-full">
            <div className="flex items-end justify-between pb-3 border-b-2 border-brand-charcoal mb-6">
              <div>
                <div className="font-mono text-xs text-brand-orange uppercase tracking-widest font-black">
                  Section C
                </div>
                <h2 className="font-sans text-3xl font-black uppercase text-brand-charcoal tracking-tight">
                  On-Chain Machine Verification
                </h2>
              </div>
              <span className="font-mono text-xs bg-brand-charcoal text-brand-cream px-2.5 py-1 font-bold uppercase tracking-wider border border-brand-charcoal">
                RPC: studio-next.genlayer.com (61997)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono">
              {/* SDK Code Terminal */}
              <div className="bg-brand-forest text-brand-cream border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[6px_6px_0px_#0B130E]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-700 mb-4 text-xs">
                    <span className="text-brand-pastelYellow uppercase font-bold tracking-wider">
                      TypeScript Client SDK
                    </span>
                    <span className="text-stone-400 text-[10px] uppercase">EVM + GenVM</span>
                  </div>
                  <pre className="text-xs leading-relaxed text-stone-200 select-all overflow-x-auto">
                    <code>{`import { UpdateSealClient } from '@updateseal/sdk';

const client = new UpdateSealClient({
  chainId: 61997,
  rpcUrl: 'https://studio-next.genlayer.com/rpc'
});

const isApproved = await client.isReleaseApproved({
  packageId: 'atlas-research-agent',
  commitSha: 'd9b2e04f81c9a72b6c31048f9024cbb4901f4a9c'
});

if (!isApproved) {
  throw new Error('Candidate failed capability charter check');
}`}</code>
                  </pre>
                </div>
              </div>

              {/* cURL Query Terminal */}
              <div className="bg-brand-charcoal text-white border-2 border-brand-charcoal p-6 flex flex-col justify-between shadow-[6px_6px_0px_#0B130E]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4 text-xs">
                    <span className="text-brand-orange uppercase font-bold tracking-wider">
                      cURL CLI Verification
                    </span>
                    <span className="text-stone-400 text-[10px] uppercase">JSON-RPC 2.0</span>
                  </div>
                  <pre className="text-xs leading-relaxed text-stone-300 select-all overflow-x-auto">
                    <code>{`curl -X POST https://studio-next.genlayer.com/rpc \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "updateseal_verifyRelease",
    "params": [
      "atlas-research-agent",
      "d9b2e04f81c9a72b6c31048f9024cbb4901f4a9c"
    ],
    "id": 1
  }'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
