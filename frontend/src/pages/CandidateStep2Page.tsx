import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Code2 } from 'lucide-react';
import { useCandidate } from '../features/candidate-release/CandidateContext';
import { CandidateStepper } from '../components/forms/CandidateStepper';

export const CandidateStep2Page: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, evidenceChecks, simulatedVerdict, setSimulatedVerdict } = useCandidate();

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      {/* Top Breadcrumbs */}
      <div className="bg-brand-cream border-b-2 border-brand-charcoal px-6 py-2.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <Link to="/registry" className="text-stone-500 hover:text-brand-charcoal">
            Registry
          </Link>
          <span className="text-stone-400">/</span>
          <Link to="/packages/atlas-research-agent" className="bg-white px-2 py-0.5 border border-brand-charcoal font-bold text-brand-charcoal">
            atlas-research-agent
          </Link>
          <span className="text-stone-400">/</span>
          <span className="sticker-badge bg-brand-orange text-white">SUBMIT CANDIDATE RELEASE</span>
        </div>
        <span className="font-bold text-stone-700 bg-brand-pastelYellow px-2 py-0.5 border border-brand-charcoal">
          EVIDENCE DIFF ENGINE
        </span>
      </div>

      <CandidateStepper currentStep={2} />

      {/* Title Banner */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                STAGE 02 / AUTOMATED EVIDENCE DIFF
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] -rotate-1">
                AST SYMBOLIC PROVER
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none text-brand-charcoal font-sans">
              STATIC AST &amp; CAPABILITY BOUNDARY DIFF
            </h1>
            <p className="text-sm text-stone-700 max-w-2xl leading-relaxed font-medium">
              The candidate Git tree was analyzed by GenLayer validator enclaves. Below are the deterministic capability checks compared directly against the frozen baseline charter.
            </p>
          </div>

          {/* Demo Testing Toggle */}
          <div className="bg-brand-charcoal text-white border-2 border-brand-charcoal p-4 shadow-[4px_4px_0px_#0B130E] font-mono text-xs space-y-2">
            <span className="text-brand-pastelYellow font-bold block uppercase">[DEMO PREVIEW CONTROL]</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulatedVerdict('0x03')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase border cursor-pointer ${
                  simulatedVerdict === '0x03'
                    ? 'bg-error text-white border-white'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                Simulate Violations (0x03)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedVerdict('0x01')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase border cursor-pointer ${
                  simulatedVerdict === '0x01'
                    ? 'bg-emerald-500 text-brand-charcoal border-white font-black'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                Simulate Clean (0x01)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Evidence Checks Workspace */}
      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-4xl mx-auto space-y-6">
          {simulatedVerdict === '0x03' ? (
            /* Failing Evidence State */
            <>
              <div className="bg-error/10 border-2 border-error p-4 flex items-start gap-3 shadow-[4px_4px_0px_#0B130E]">
                <XCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-mono text-sm font-black uppercase text-error">
                    BLOCKING EVIDENCE DETECTED (2 BREACHES)
                  </h3>
                  <p className="text-xs font-mono text-stone-800 mt-0.5">
                    Candidate introduces unchartered capability expansions. If broadcast on-chain, this candidate will be blocked by consensus (0x03 Capability Violation). UpdateSeal v1 does not custody funds or implement slashing.
                  </p>
                </div>
              </div>

              {/* Violation 01 Card */}
              <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-error text-white font-mono text-[11px] px-2 py-0.5 font-bold uppercase">
                      CRITICAL BREACH
                    </span>
                    <span className="font-mono text-xs font-bold text-brand-charcoal">
                      01 :: PROCESS_FORK_ATTEMPT
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-error">PROHIBITED BY RULE [03]</span>
                </div>

                <p className="text-xs text-stone-700 font-sans">
                  The candidate source imports <code className="font-mono bg-stone-100 px-1 border border-stone-300 font-bold">child_process</code> in <code className="font-mono font-bold">src/runners/process_exec.ts:L42</code> and calls <code className="font-mono bg-stone-100 px-1 border border-stone-300 font-bold">spawn('curl', [targetUrl])</code>.
                </p>

                {/* Code Diff Box */}
                <div className="bg-brand-forest text-stone-200 p-4 font-mono text-xs border border-brand-charcoal">
                  <div className="text-brand-pastelYellow pb-2 border-b border-stone-700 text-[11px]">
                    DIFF EXTRACT: src/runners/process_exec.ts
                  </div>
                  <pre className="pt-2 leading-relaxed">
                    <span className="text-stone-500">39  import &#123; AgentContext &#125; from '../types';</span>{'\n'}
                    <span className="text-stone-500">40  import &#123; validateTaskParameters &#125; from './validator';</span>{'\n'}
                    <span className="bg-brand-orange/30 text-white block px-2 py-0.5 font-bold border-l-2 border-brand-orange">
                      <span className="text-brand-pastelYellow mr-2 font-black">+</span>const proc = child_process.spawn('curl', [targetUrl]);
                    </span>
                    <span className="text-stone-500">43  return await pipeOutput(proc);</span>
                  </pre>
                </div>
              </div>

              {/* Violation 02 Card */}
              <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-orange text-white font-mono text-[11px] px-2 py-0.5 font-bold uppercase">
                      HIGH BREACH
                    </span>
                    <span className="font-mono text-xs font-bold text-brand-charcoal">
                      02 :: NEW_NETWORK_DOMAIN
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-brand-orange">NOT ON WHITELIST</span>
                </div>

                <p className="text-xs text-stone-700 font-sans">
                  The candidate attempts an unwhitelisted egress connection to <code className="font-mono bg-stone-100 px-1 border border-stone-300 font-bold">https://telemetry-collect-xyz.net/metrics</code>.
                </p>

                {/* Code Diff Box */}
                <div className="bg-brand-forest text-stone-200 p-4 font-mono text-xs border border-brand-charcoal">
                  <div className="text-brand-pastelYellow pb-2 border-b border-stone-700 text-[11px]">
                    DIFF EXTRACT: src/network/client.ts
                  </div>
                  <pre className="pt-2 leading-relaxed">
                    <span className="text-stone-500">86  async sendTelemetryPayload(data: Record&lt;string, any&gt;) &#123;</span>{'\n'}
                    <span className="bg-brand-orange/30 text-white block px-2 py-0.5 font-bold border-l-2 border-brand-orange">
                      <span className="text-brand-pastelYellow mr-2 font-black">+</span>  const telemetryHost = "https://telemetry-collect-xyz.net/metrics";
                    </span>
                    <span className="bg-brand-orange/30 text-white block px-2 py-0.5 font-bold border-l-2 border-brand-orange">
                      <span className="text-brand-pastelYellow mr-2 font-black">+</span>  await fetch(telemetryHost, &#123; method: "POST", body: JSON.stringify(data) &#125;);
                    </span>
                    <span className="text-stone-500">90  &#125;</span>
                  </pre>
                </div>
              </div>
            </>
          ) : (
            /* Clean Evidence State */
            <div className="bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-mono text-lg font-black uppercase text-brand-charcoal font-sans">
                NO CHARTER ESCALATIONS DETECTED (0 DRIFTS)
              </h3>
              <p className="text-xs font-mono text-stone-700 max-w-lg mx-auto leading-relaxed">
                AST analysis confirmed zero undeclared network calls, zero process forks, and full adherence to sandbox path constraints. Candidate is eligible for auto-approval.
              </p>
            </div>
          )}

          {/* Compliant Evidence Checklist */}
          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3 font-mono text-xs">
            <span className="font-bold uppercase text-stone-500 block">Baseline Boundary Checks Passed:</span>
            <div className="space-y-2">
              <div className="p-3 bg-stone-50 border border-brand-charcoal flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Filesystem Sandboxing Compliance (/tmp/workspace/* strictly enforced)</span>
                </span>
                <span className="text-emerald-700 font-bold uppercase">PASSED</span>
              </div>
              <div className="p-3 bg-stone-50 border border-brand-charcoal flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Airgapped Key Signature Verification (Zero private keys found)</span>
                </span>
                <span className="text-emerald-700 font-bold uppercase">PASSED</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal font-mono">
            <button
              type="button"
              onClick={() => navigate('/packages/atlas-research-agent/releases/new/identity')}
              className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Identity
            </button>

            <button
              type="button"
              onClick={() => navigate('/packages/atlas-research-agent/releases/new/confirm')}
              className="px-7 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal font-bold text-xs uppercase tracking-wider transition-colors border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Step 3 (Review &amp; Confirm)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
