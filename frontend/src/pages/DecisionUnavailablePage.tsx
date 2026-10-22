import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft, ArrowRight, ShieldAlert, Terminal, Lock } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';

export const DecisionUnavailablePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Breadcrumb & Metadata */}
      <section className="max-w-[1440px] mx-auto w-full px-4 lg:px-12 py-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-brand-charcoal px-5 py-3 shadow-[4px_4px_0px_#0B130E] font-mono text-xs">
          <div className="flex items-center gap-2 uppercase tracking-wider text-stone-600 flex-wrap">
            <Link to="/registry" className="hover:text-brand-orange font-bold">Packages</Link>
            <span>/</span>
            <Link to="/packages/atlas-research-agent" className="text-brand-charcoal font-bold hover:text-brand-orange">atlas-research-agent</Link>
            <span>/</span>
            <span className="text-stone-600 font-bold">Releases</span>
            <span>/</span>
            <span className="bg-stone-100 border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold">v1.5.0-rc2</span>
            <span>/</span>
            <span className="bg-brand-orange text-white px-2 py-0.5 font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              VERDICT: 0x04
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="uppercase bg-brand-forest text-brand-pastelYellow border border-brand-charcoal px-2.5 py-1 font-bold shadow-[2px_2px_0px_#0B130E]">
              BLOCK #61,997,882
            </span>
            <span className="text-stone-700 font-bold">
              TX: <span className="text-brand-charcoal font-mono">0x9f1a...b401</span>
            </span>
          </div>
        </div>

        {/* Hero Banner: 0x04 Evidence Unavailable */}
        <div className="relative bg-brand-forest text-stone-100 p-8 lg:p-12 border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] overflow-hidden flex flex-col gap-6 stepped-pattern">
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-orange text-white px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest font-black border border-brand-charcoal shadow-[3px_3px_0px_#0B130E] -rotate-1">
              <AlertCircle className="w-4 h-4" />
              CANONICAL VERDICT: 0x04 EVIDENCE_UNAVAILABLE
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand-pastelYellow font-bold bg-brand-charcoal/80 border border-brand-charcoal px-3 py-1 shadow-[2px_2px_0px_#0B130E]">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping"></span>
              GENLAYER LLM CONSENSUS: REJECTED (ORACLE_PROBE_FAIL)
            </div>
          </div>

          <div className="flex flex-col gap-3 relative z-10 max-w-4xl">
            <h1 className="font-black text-3xl lg:text-4xl text-white tracking-tight leading-tight uppercase font-sans">
              Evaluation Halted: Cryptographic Evidence Unreachable
            </h1>
            <p className="font-sans text-base text-stone-300 leading-relaxed max-w-3xl">
              GenLayer Oracle nodes were unable to clone commit SHA <span className="bg-brand-charcoal text-brand-pastelYellow px-2 py-0.5 font-mono text-xs border border-stone-700 font-bold">99a12c449102bf8...</span> or Git tree manifest is corrupt. Validation lifecycle aborted prior to sandbox LLM inspection.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 relative z-10 font-mono">
            <div className="bg-brand-charcoal border border-stone-800 p-4 flex flex-col gap-1 shadow-[3px_3px_0px_#000000]">
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Required Node Quorum</span>
              <span className="text-2xl font-black text-white">5 / 5</span>
            </div>
            <div className="bg-brand-charcoal border border-stone-800 p-4 flex flex-col gap-1 shadow-[3px_3px_0px_#000000]">
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Successful Clones</span>
              <span className="text-2xl font-black text-brand-orange">0 Nodes (0%)</span>
            </div>
            <div className="bg-brand-charcoal border border-stone-800 p-4 flex flex-col gap-1 shadow-[3px_3px_0px_#000000]">
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Protocol Custody</span>
              <span className="text-2xl font-black text-brand-pastelYellow">Non-Custodial</span>
            </div>
            <div className="bg-brand-charcoal border border-stone-800 p-4 flex flex-col gap-1 shadow-[3px_3px_0px_#000000]">
              <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Financial Slashing</span>
              <span className="text-2xl font-black text-white">None (0 GEN)</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <article className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-brand-charcoal">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-brand-orange">
                  ORACLE FAILURE LOGS
                </span>
                <span className="bg-brand-charcoal text-white font-mono text-[10px] px-2 py-0.5 font-bold">
                  GIT_CLONE_TIMEOUT
                </span>
              </div>
              <p className="font-sans text-xs text-stone-700 leading-relaxed mb-4">
                During Stage 02 (Evidence Ingestion), all 5 evaluator nodes dispatched SSH and HTTPS fetch requests targeting the upstream repository. Upstream host returned HTTP 404 or connection reset after 30,000ms timeout.
              </p>

              <div className="bg-brand-charcoal text-emerald-400 p-4 font-mono text-xs border border-brand-charcoal overflow-x-auto space-y-1">
                <div className="text-stone-400"># GenLayer Ingress Oracle Node Telemetry</div>
                <div>[14:22:01] Node 1 (Tokyo): git clone --depth 1 git@github.com:atlas-protocol/research-agent.git</div>
                <div className="text-red-400">[14:22:31] Node 1: fatal: unable to access: Failed to connect to github.com port 443: Timed out</div>
                <div className="text-red-400">[14:22:32] Node 2 (Berlin): fatal: Remote branch 99a12c4491 not found in upstream origin</div>
                <div className="text-brand-pastelYellow">[14:22:33] Consensus consensus_abort(code=0x04, reason="EVIDENCE_UNAVAILABLE")</div>
              </div>
            </article>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-brand-cream border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] font-mono text-xs space-y-4">
              <span className="uppercase text-brand-charcoal font-black tracking-wider block">
                How to Resolve Verdict 0x04
              </span>
              <ol className="list-decimal list-inside space-y-2 text-stone-700 font-sans leading-relaxed">
                <li>Verify that the Git repository is public or granted read permissions to the GenLayer Oracle keys.</li>
                <li>Ensure the commit SHA is pushed to upstream origin and matches the 40-character hexadecimal format.</li>
                <li>Submit a candidate resubmission transaction once the tree is accessible.</li>
              </ol>

              <div className="pt-2 border-t border-brand-charcoal/20 flex flex-col gap-2">
                <Link
                  to="/packages/atlas-research-agent/releases/new/identity"
                  className="w-full bg-brand-orange hover:bg-brand-charcoal text-white font-bold p-3 text-center border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
                >
                  Resubmit Candidate Release →
                </Link>
                <Link
                  to="/packages/atlas-research-agent"
                  className="w-full bg-white hover:bg-stone-100 text-brand-charcoal font-bold p-3 text-center border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase transition-colors"
                >
                  Back to Package Detail
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
