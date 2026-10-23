import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, ShieldAlert, Cpu, ExternalLink, RefreshCw } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';
import { DesignDemoBanner } from '../components/ui/DesignDemoBanner';

type SimulationState = 'pending' | 'approved' | 'review_required' | 'violation' | 'unavailable';

export const ReviewTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const [simulationState, setSimulationState] = useState<SimulationState>('pending');

  return (
    <div className="flex flex-col w-full pb-16">
      <DesignDemoBanner />
      {/* Top Breadcrumb & Status Ribbon */}
      <div className="w-full bg-[#FAF8F4] border-b-2 border-brand-charcoal py-3 px-4 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 uppercase tracking-wider text-stone-600 flex-wrap">
            <Link to="/packages/atlas-research-agent" className="text-brand-orange hover:underline font-bold flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              atlas-protocol / research-agent
            </Link>
            <span>/</span>
            <span className="text-brand-charcoal font-bold">Evaluation #61997-RC1</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping"></span>
              <span className="uppercase text-brand-charcoal font-bold">Studio Next Session 0x6199...e2f</span>
            </div>
            <div className="bg-white border border-brand-charcoal px-2.5 py-0.5 shadow-[1px_1px_0px_#0B130E]">
              <span className="text-stone-700 font-bold">Block Height: 61,997,482</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo State Simulator Toolbar */}
      <aside className="w-full bg-brand-pastelYellow border-b-2 border-brand-charcoal py-3 px-4 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <span className="bg-brand-charcoal text-brand-pastelYellow px-2.5 py-1 font-black uppercase tracking-wider shadow-[2px_2px_0px_#0B130E]">
              Demo preview
            </span>
            <span className="font-bold text-brand-charcoal">
              Simulate GenLayer multi-validator consensus outcomes in real time:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setSimulationState('pending')}
              className={`px-3 py-1 font-bold border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] transition-all cursor-pointer ${
                simulationState === 'pending'
                  ? 'bg-brand-forest text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              Consensus Pending
            </button>
            <button
              onClick={() => setSimulationState('approved')}
              className={`px-3 py-1 font-bold border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] transition-all cursor-pointer ${
                simulationState === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              0x01 Approved
            </button>
            <button
              onClick={() => setSimulationState('review_required')}
              className={`px-3 py-1 font-bold border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] transition-all cursor-pointer ${
                simulationState === 'review_required'
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              0x02 Review Required
            </button>
            <button
              onClick={() => setSimulationState('violation')}
              className={`px-3 py-1 font-bold border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] transition-all cursor-pointer ${
                simulationState === 'violation'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              0x03 Violation
            </button>
            <button
              onClick={() => setSimulationState('unavailable')}
              className={`px-3 py-1 font-bold border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] transition-all cursor-pointer ${
                simulationState === 'unavailable'
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              0x04 Unavailable
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-10 flex flex-col gap-10">
        {/* Editorial Hero Unit with Asymmetrical Layout */}
        <div className="relative bg-brand-forest text-white p-6 lg:p-12 border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] overflow-hidden">
          <div className="absolute -right-8 -bottom-12 opacity-10 pointer-events-none select-none text-[12rem] font-black font-mono">
            GEN
          </div>

          <div className="relative z-10 flex flex-col gap-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block transform -rotate-1 bg-brand-orange text-white font-mono text-xs uppercase px-3 py-1 shadow-[2px_2px_0px_#0B130E] font-bold tracking-widest border border-brand-charcoal">
                ✦ Demo Review Progress
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-xs uppercase px-2.5 py-1 font-bold border border-brand-charcoal">
                Consensus Engine v1.4-beta
              </span>
              <span className="font-mono text-xs text-brand-cream border border-stone-600 px-2 py-1 bg-brand-charcoal">
                Quorum Required: 4 / 5 Signatures
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white font-sans leading-none">
              {simulationState === 'pending' && 'GenLayer Consensus in Progress'}
              {simulationState === 'approved' && 'Consensus Reached: 0x01 Approved'}
              {simulationState === 'review_required' && 'Consensus Split: 0x02 Review Required'}
              {simulationState === 'violation' && 'Candidate Rejected: 0x03 Violation'}
              {simulationState === 'unavailable' && 'Evaluation Aborted: 0x04 Unavailable'}
            </h1>

            <p className="font-sans text-base text-stone-200 max-w-3xl leading-relaxed">
              Evaluating Candidate Release <strong className="text-brand-pastelYellow font-mono font-bold">v1.5.0-rc1</strong> against Frozen Charter <strong className="text-brand-pastelYellow font-mono font-bold">Sentinel-1</strong> for Autonomous Agent <span className="text-white font-bold underline">Atlas Research Agent</span>.
            </p>

            {/* Metadata Ribbon Inside Hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-2 bg-brand-charcoal/60 p-4 border border-stone-700 font-mono text-xs">
              <div className="flex flex-col">
                <span className="text-stone-400 uppercase text-[10px] font-bold">Candidate Commit</span>
                <span className="text-brand-pastelYellow font-bold mt-0.5">d9b2e04f...8a12</span>
              </div>
              <div className="flex flex-col">
                <span className="text-stone-400 uppercase text-[10px] font-bold">Execution Gas Limit</span>
                <span className="text-white font-bold mt-0.5">8,450,000 GEN</span>
              </div>
              <div className="flex flex-col">
                <span className="text-stone-400 uppercase text-[10px] font-bold">Active Quorum</span>
                <span className="text-brand-vibrantCyan font-bold mt-0.5">
                  {simulationState === 'pending' && '3 / 5 In Flight'}
                  {simulationState === 'approved' && '5 / 5 Approved'}
                  {simulationState === 'review_required' && '3 / 5 Escalated'}
                  {simulationState === 'violation' && '5 / 5 Rejected'}
                  {simulationState === 'unavailable' && '0 / 5 Oracle Fail'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-stone-400 uppercase text-[10px] font-bold">Max Clock Drift</span>
                <span className="text-white font-bold mt-0.5">±1.2 Seconds</span>
              </div>
            </div>

            {/* Immediate Direct Route Link based on simulated outcome */}
            {simulationState !== 'pending' && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (simulationState === 'approved') navigate('/decisions/approved');
                    if (simulationState === 'review_required') navigate('/decisions/review-required');
                    if (simulationState === 'violation') navigate('/decisions/capability-violation');
                    if (simulationState === 'unavailable') navigate('/decisions/evidence-unavailable');
                  }}
                  className="px-6 py-3 bg-brand-orange text-white font-mono text-xs uppercase font-black tracking-wider border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:bg-brand-orangeDark transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>INSPECT FULL DECISION REPORT →</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stepper Lifecycle: Stage Progress Trackers */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-brand-charcoal">
            <h2 className="font-black text-xl uppercase tracking-tight text-brand-charcoal font-sans flex items-center gap-2">
              <Cpu className="w-5 h-5 text-brand-orange" />
              Verification Lifecycle Phases
            </h2>
            <span className="font-mono text-xs text-stone-600 font-bold uppercase">
              Phase 3 of 5 In Flight
            </span>
          </div>

          {/* Horizontal Stepper Mosaic */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Stage 1 */}
            <div className="bg-brand-forest text-white p-4 flex flex-col justify-between border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold tracking-wider text-brand-pastelYellow uppercase">[01] PHASE</span>
                <CheckCircle2 className="w-4 h-4 text-brand-pastelYellow" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm uppercase tracking-wide text-white">Submission Accepted</h3>
                <p className="font-sans text-xs text-stone-300 mt-1">Confirmed on Block #61997480.</p>
              </div>
              <div className="mt-4 pt-2 bg-brand-charcoal p-2 font-mono text-[10px] text-stone-300 border border-stone-700 truncate">
                Tx: 0x78ab4991c2...
                <div className="text-[9px] text-brand-pastelYellow mt-0.5 font-bold">14:20:04 UTC • ATTESTED</div>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="bg-brand-forest text-white p-4 flex flex-col justify-between border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold tracking-wider text-brand-pastelYellow uppercase">[02] PHASE</span>
                <CheckCircle2 className="w-4 h-4 text-brand-pastelYellow" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm uppercase tracking-wide text-white">Evidence Ingestion</h3>
                <p className="font-sans text-xs text-stone-300 mt-1">4 files, 170 lines diff verified.</p>
              </div>
              <div className="mt-4 pt-2 bg-brand-charcoal p-2 font-mono text-[10px] text-stone-300 border border-stone-700 truncate">
                Tree Root: SHA256:88a...
                <div className="text-[9px] text-brand-pastelYellow mt-0.5 font-bold">AST HASH MATCHED</div>
              </div>
            </div>

            {/* Stage 3 (Active) */}
            <div className="bg-brand-pastelYellow text-brand-charcoal p-4 flex flex-col justify-between border-2 border-brand-charcoal shadow-[4px_4px_0px_#EF5313]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold tracking-wider text-brand-charcoal bg-white px-2 py-0.5 border border-brand-charcoal uppercase">[03] ACTIVE AUDIT</span>
                <span className="w-3 h-3 rounded-full bg-brand-orange animate-ping"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-brand-orange animate-spin" />
                  <h3 className="font-sans font-black text-sm text-brand-charcoal uppercase tracking-tight">Multi-Validator AST</h3>
                </div>
                <p className="font-sans text-xs text-stone-800 mt-1 font-medium">5 LLM validator nodes evaluating 6 capability boundaries.</p>
              </div>
              <div className="mt-4 bg-brand-charcoal p-2 font-mono text-[10px] text-brand-pastelYellow flex items-center justify-between border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> IN PROGRESS
                </span>
                <span className="text-white font-bold tracking-wider bg-brand-orange px-1.5 py-0.5">82% COMPUTED</span>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="bg-brand-cream text-brand-charcoal p-4 flex flex-col justify-between border-2 border-stone-400 shadow-[2px_2px_0px_#0B130E]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-stone-500 uppercase">[04] STAGE</span>
                <Clock className="w-4 h-4 text-stone-400" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-stone-800 uppercase tracking-wide">Consensus Tally</h3>
                <p className="font-sans text-xs text-stone-600 mt-1">Awaiting 4 of 5 consensus quorum signatures.</p>
              </div>
              <div className="mt-4 pt-2 bg-white p-2 font-mono text-[10px] text-stone-500 border border-stone-200">
                Threshold: 80.0%
                <div className="text-[9px] text-stone-400 mt-0.5 uppercase">STANDBY FOR ROUND END</div>
              </div>
            </div>

            {/* Stage 5 */}
            <div className="bg-brand-cream text-brand-charcoal p-4 flex flex-col justify-between border-2 border-stone-400 shadow-[2px_2px_0px_#0B130E]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-stone-500 uppercase">[05] FINALE</span>
                <span className="font-mono text-stone-400 text-xs">LOCK</span>
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-stone-800 uppercase tracking-wide">Registry Commit</h3>
                <p className="font-sans text-xs text-stone-600 mt-1">Release seal execution & immutable registry update.</p>
              </div>
              <div className="mt-4 pt-2 bg-white p-2 font-mono text-[10px] text-stone-500 border border-stone-200">
                Target State: UNRESOLVED
                <div className="text-[9px] text-stone-400 mt-0.5 uppercase">WAITING QUORUM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Validator Node Grid (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-2 border-b-2 border-brand-charcoal">
              <div>
                <h2 className="font-headline-md text-headline-md text-brand-charcoal uppercase tracking-tight font-black">
                  Validator Node Swarm
                </h2>
                <p className="font-body-sm text-body-sm text-stone-600 font-sans">
                  Decentralized LLM consensus workers actively computing AST delta safety.
                </p>
              </div>
              <span className="bg-brand-forest text-brand-pastelYellow px-3 py-1 font-mono text-xs uppercase font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                5 NODES ASSIGNED
              </span>
            </div>

            {/* Node 1 */}
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-orange animate-pulse"></span>
                  <span className="font-mono text-sm font-black text-brand-charcoal uppercase">Node 1</span>
                  <span className="font-mono text-xs text-stone-600 bg-stone-100 border border-stone-300 px-2 py-0.5">0x81a4...bc99</span>
                </div>
                <span className="bg-stone-100 text-stone-800 border border-brand-charcoal font-mono text-xs px-2.5 py-0.5 uppercase font-bold shadow-[1px_1px_0px_#0B130E]">
                  STATUS: RUNNING
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-brand-charcoal font-bold font-sans">Analyzing AST Network Egress Limits</span>
                  <span className="font-mono text-xs font-bold text-brand-orange">88%</span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 border border-brand-charcoal p-[1px]">
                  <div className="h-full bg-brand-orange" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600 font-mono pt-1 border-t border-stone-200">
                <span>LLM-Engine: <strong className="text-brand-charcoal">Llama-3-70b-GenConsensus</strong></span>
                <span className="bg-stone-100 px-2 py-0.5 font-bold text-stone-700">Latency: 142ms</span>
              </div>
            </div>

            {/* Node 2 (Breach Highlight) */}
            <div className="bg-white border-2 border-brand-orange p-5 shadow-[5px_5px_0px_#EF5313] flex flex-col gap-3 relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-brand-orange animate-ping"></span>
                  <span className="font-mono text-sm font-black text-brand-charcoal uppercase">Node 2</span>
                  <span className="font-mono text-xs text-brand-orange font-bold bg-stone-100 border border-brand-orange px-2 py-0.5">0x39fa...42e1</span>
                </div>
                <span className="bg-brand-orange text-white font-mono text-xs px-3 py-1 uppercase font-black tracking-wide shadow-[2px_2px_0px_#0B130E] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  DETECTED UNREGISTERED CALL
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-brand-charcoal font-black font-sans flex items-center gap-1.5">
                    <span className="text-brand-orange font-mono font-bold">[FLAGGED]</span> Verifying Shell/Process Invocations
                  </span>
                  <span className="font-mono text-xs font-black text-white bg-brand-orange px-1.5 py-0.5">VIOLATION CANDIDATE</span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 border border-brand-charcoal p-[1px]">
                  <div className="h-full bg-brand-orange" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="bg-stone-50 border-l-4 border-brand-orange p-3 font-mono text-xs text-brand-charcoal flex items-start gap-2 shadow-inner">
                <ShieldAlert className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-brand-orange uppercase text-[11px] tracking-wide">Boundary Breach Detected:</div>
                  <div className="mt-0.5 text-stone-800">
                    <code className="bg-stone-200 px-1 font-bold text-brand-charcoal">subprocess.Popen</code> found in <code className="text-brand-orange font-bold font-mono">src/tools/exec_sandbox.py:44</code>. Candidate not registered in Frozen Charter manifest.
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600 font-mono pt-1 border-t border-stone-200">
                <span>LLM-Engine: <strong className="text-brand-charcoal">Claude-3.5-Sonnet-Inspector</strong></span>
                <span className="bg-stone-100 px-2 py-0.5 font-bold text-brand-orange">Flagged in 98ms</span>
              </div>
            </div>

            {/* Node 3 */}
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-orange animate-pulse"></span>
                  <span className="font-mono text-sm font-black text-brand-charcoal uppercase">Node 3</span>
                  <span className="font-mono text-xs text-stone-600 bg-stone-100 border border-stone-300 px-2 py-0.5">0x0b44...90d2</span>
                </div>
                <span className="bg-stone-100 text-stone-800 border border-brand-charcoal font-mono text-xs px-2.5 py-0.5 uppercase font-bold shadow-[1px_1px_0px_#0B130E]">
                  STATUS: RUNNING
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-body-sm text-body-sm">
                  <span className="text-brand-charcoal font-bold font-sans">AST Semantic Equivalence Check</span>
                  <span className="font-mono text-xs font-bold text-brand-orange">94%</span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 border border-brand-charcoal p-[1px]">
                  <div className="h-full bg-brand-orange" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-600 font-mono pt-1 border-t border-stone-200">
                <span>LLM-Engine: <strong className="text-brand-charcoal">Mistral-Large-Auditor</strong></span>
                <span className="bg-stone-100 px-2 py-0.5 font-bold text-stone-700">Latency: 168ms</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Links to Canonical Verdict Reports (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-brand-charcoal">
                <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
                  CANONICAL RESOLUTIONS
                </span>
                <span className="bg-brand-charcoal text-white font-mono text-[10px] px-2 py-0.5 font-bold">
                  STUDIO NEXT
                </span>
              </div>
              <p className="font-sans text-xs text-stone-700 mb-6 leading-relaxed">
                When consensus completes, an immutable cryptographic decision report is written directly to GenLayer Studio Next. Inspect each possible canonical report below:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <Link
                  to="/decisions/approved"
                  className="p-3 bg-brand-vibrantCyan border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] hover:translate-x-1 transition-all flex items-center justify-between block"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-forest"></span>
                    <strong className="text-brand-charcoal font-bold">0x01 APPROVED</strong>
                  </div>
                  <span className="text-brand-forest font-bold flex items-center gap-1">VIEW <ExternalLink className="w-3.5 h-3.5" /></span>
                </Link>

                <Link
                  to="/decisions/review-required"
                  className="p-3 bg-brand-pastelYellow border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] hover:translate-x-1 transition-all flex items-center justify-between block"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-orange"></span>
                    <strong className="text-brand-charcoal font-bold">0x02 REVIEW REQUIRED</strong>
                  </div>
                  <span className="text-brand-charcoal font-bold flex items-center gap-1">VIEW <ExternalLink className="w-3.5 h-3.5" /></span>
                </Link>

                <Link
                  to="/decisions/capability-violation"
                  className="p-3 bg-[#FFAAA5] border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] hover:translate-x-1 transition-all flex items-center justify-between block"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <strong className="text-brand-charcoal font-bold">0x03 CAPABILITY VIOLATION</strong>
                  </div>
                  <span className="text-brand-charcoal font-bold flex items-center gap-1">VIEW <ExternalLink className="w-3.5 h-3.5" /></span>
                </Link>

                <Link
                  to="/decisions/evidence-unavailable"
                  className="p-3 bg-stone-200 border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] hover:translate-x-1 transition-all flex items-center justify-between block"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-700"></span>
                    <strong className="text-brand-charcoal font-bold">0x04 EVIDENCE UNAVAILABLE</strong>
                  </div>
                  <span className="text-brand-charcoal font-bold flex items-center gap-1">VIEW <ExternalLink className="w-3.5 h-3.5" /></span>
                </Link>
              </div>
            </div>

            {/* Cryptographic Session Summary */}
            <div className="bg-brand-charcoal text-white p-6 border-2 border-brand-charcoal shadow-[4px_4px_0px_#EF5313] font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
                <span className="text-brand-pastelYellow font-bold">SWARM ENCLAVE ATTESTATION</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="space-y-2 text-stone-300">
                <div className="flex justify-between">
                  <span className="text-stone-500">Contract Address:</span>
                  <span className="text-white">Contract integration pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Execution Mode:</span>
                  <span className="text-brand-pastelYellow">Estimated interface only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Round Consensus:</span>
                  <span className="text-brand-vibrantCyan">BFT Deterministic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
