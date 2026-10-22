import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const DecisionReviewRequiredPage: React.FC = () => {
  const [multisigFeedback, setMultisigFeedback] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);

  const handleMultisig = (_action: 'approve' | 'reject') => {
    void _action;
    setActionDone(true);
    setMultisigFeedback(
      'Demo decision updated locally. Contract integration pending; nothing was broadcast.'
    );
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="w-full bg-brand-cream border-b-2 border-brand-charcoal px-4 sm:px-8 lg:px-12 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-brand-charcoal font-mono text-xs">
          <div className="flex items-center gap-2 uppercase tracking-wider text-stone-600 flex-wrap">
            <Link to="/registry" className="text-brand-orange hover:underline font-bold">
              PACKAGES
            </Link>
            <span>/</span>
            <Link to="/packages/atlas-research-agent" className="text-brand-charcoal font-black uppercase">
              ATLAS-RESEARCH-AGENT
            </Link>
            <span>/</span>
            <span className="text-stone-500">RELEASES</span>
            <span>/</span>
            <span className="bg-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 text-brand-charcoal font-bold">
              v1.5.0-rc1
            </span>
            <span>/</span>
            <span className="text-brand-orange font-bold">DECISION-REPORT-0x02</span>
          </div>

          <div className="flex items-center gap-3 text-xs bg-white border border-brand-charcoal px-3 py-1.5 shadow-[2px_2px_0px_#0B130E]">
            <span className="inline-block w-2.5 h-2.5 bg-brand-orange animate-pulse"></span>
            <span className="text-brand-charcoal font-bold">GENLAYER: STUDIO NEXT</span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-600">BLOCK #61997428 (DEMO)</span>
          </div>
        </div>
      </div>

      {/* Hero: 0x02 Review Required */}
      <section className="w-full bg-brand-pastelYellow border-b-2 border-brand-charcoal text-brand-charcoal px-4 sm:px-8 lg:px-16 py-12 lg:py-16 relative overflow-hidden stepped-pattern">
        <div className="absolute -right-6 -bottom-10 opacity-15 select-none pointer-events-none">
          <span className="font-black text-[16rem] leading-none text-brand-forest font-mono tracking-tighter">0x02</span>
        </div>

        <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-brand-orange text-white px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest border border-brand-charcoal shadow-[3px_3px_0px_#0B130E] -rotate-1 inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>▲ CANONICAL VERDICT: 0x02 REVIEW_REQUIRED</span>
            </div>
            <div className="bg-brand-forest text-brand-pastelYellow px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              CONSENSUS LEVEL: HIGH-PRIORITY INTERLOCK
            </div>
            <div className="bg-white text-brand-charcoal font-mono text-xs px-3 py-1 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ml-auto">
              EVALUATOR HASH: <span className="font-bold text-brand-orange">0x88f2...ae11</span>
            </div>
          </div>

          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-brand-forest leading-none tracking-tight">
              HUMAN INTERLOCK REQUIRED: CAPABILITY EXPANSION DETECTED
            </h1>
            <p className="text-base lg:text-lg text-brand-charcoal mt-4 max-w-3xl font-medium leading-relaxed">
              GenLayer LLM Evaluators reached 4/5 consensus that candidate introduces new external endpoints not covered under frozen charter v1.4. Automated self-deployment is halted under multisig safeguard rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="bg-brand-forest text-white px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              STATUS: AWAITING MULTISIG EPOCH 19
            </div>
            <div className="text-xs font-mono font-bold text-brand-charcoal flex items-center gap-1.5 bg-white/80 px-3 py-1 border border-brand-charcoal">
              <Clock className="w-3.5 h-3.5 text-brand-orange" />
              <span>Window Opened: 2025-05-18 14:22:09 UTC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal px-4 sm:px-8 lg:px-16 py-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs bg-brand-forest text-brand-pastelYellow px-2 py-0.5 font-bold uppercase tracking-wider border border-brand-charcoal">
                  [METRIC 01]
                </span>
                <span className="material-symbols-outlined text-brand-charcoal font-bold">how_to_vote</span>
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold mb-1">CONSENSUS STAGE</div>
                <div className="text-2xl font-black text-brand-forest uppercase tracking-tight">Split Vote</div>
                <div className="text-sm text-brand-charcoal mt-1 font-bold">3 Approved, 2 Escalate</div>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-forest font-bold">
                Quorum standard met (5/5 validators responded).
              </div>
            </div>

            <div className="bg-brand-pastelPink border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs bg-brand-charcoal text-white px-2 py-0.5 font-bold uppercase tracking-wider border border-brand-charcoal">
                  [METRIC 02]
                </span>
                <AlertTriangle className="w-5 h-5 text-brand-charcoal" />
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-stone-800 font-bold mb-1">UNCHARTERED DELTAS</div>
                <div className="text-2xl font-black text-brand-charcoal uppercase tracking-tight">1 Flagged</div>
                <div className="text-sm text-brand-charcoal mt-1 font-bold">Egress network endpoint mismatch</div>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Baseline frozen at commit <span className="underline font-black">#4d98a0</span>.
              </div>
            </div>

            <div className="bg-brand-vibrantCyan border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs bg-brand-charcoal text-white px-2 py-0.5 font-bold uppercase tracking-wider border border-brand-charcoal">
                  [METRIC 03]
                </span>
                <Clock className="w-5 h-5 text-brand-charcoal" />
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-stone-800 font-bold mb-1">MULTISIG WINDOW</div>
                <div className="text-2xl font-black text-brand-charcoal uppercase tracking-tight">47h 12m</div>
                <div className="text-sm text-stone-900 mt-1 font-bold">Purge triggered upon expiry</div>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-charcoal font-bold">
                Ticking down to block 61998580.
              </div>
            </div>

            <div className="bg-brand-forest text-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-bold uppercase tracking-wider border border-brand-charcoal">
                  [METRIC 04]
                </span>
                <ShieldAlert className="w-5 h-5 text-brand-pastelYellow" />
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-brand-pastelYellow/80 font-bold mb-1">GOVERNANCE MODEL</div>
                <div className="text-2xl font-black text-brand-pastelYellow uppercase tracking-tight">Non-Custodial</div>
                <div className="text-sm text-stone-300 mt-1 font-bold">UpdateSeal v1 does not custody funds or implement slashing.</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 font-mono text-xs text-brand-pastelYellow font-bold">
                Evaluation enforced by frozen charter.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagged Anomaly Dossier */}
      <section className="w-full bg-white border-b-2 border-brand-charcoal px-4 sm:px-8 lg:px-16 py-12">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-brand-charcoal">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold block mb-1">
                SECTION 01 // EVIDENCE AUDIT
              </span>
              <h2 className="text-2xl lg:text-3xl uppercase text-brand-forest font-black tracking-tight">
                Flagged Anomaly Dossier
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs bg-stone-100 border border-brand-charcoal px-3 py-1 font-bold uppercase text-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                Target: src/retrievers/scholar.py
              </span>
              <span className="font-mono text-xs bg-brand-orange text-white border border-brand-charcoal px-3 py-1 uppercase font-black shadow-[2px_2px_0px_#0B130E]">
                VIOLATION CLASS: UNVERIFIED_EGRESS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-brand-cream border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
                <h3 className="text-lg uppercase text-brand-forest font-black flex items-center gap-2">
                  Charter Permission Mismatch
                </h3>
                <p className="text-sm text-stone-800 leading-relaxed font-medium">
                  The agent manifest and immutable charter specification state in Section 4.2 that external retrieval requests are strictly constrained to:
                </p>
                <div className="bg-white border-2 border-brand-charcoal p-3 font-mono text-xs text-brand-forest font-bold shadow-[2px_2px_0px_#0B130E]">
                  ALLOWLIST_URLS = ["https://export.arxiv.org/api/query"]
                </div>
                <p className="text-sm text-stone-800 leading-relaxed font-medium">
                  Candidate release <strong className="text-brand-charcoal font-black underline">v1.5.0-rc1</strong> includes executable code invoking the external endpoint:
                </p>
                <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-3 font-mono text-xs text-brand-charcoal font-bold break-all shadow-[2px_2px_0px_#0B130E]">
                  https://api.semantic-scholar.org/v1
                </div>
                <div className="bg-white border border-brand-charcoal p-4 flex flex-col gap-2 mt-1">
                  <span className="font-mono text-[11px] text-stone-600 uppercase font-black tracking-wider">IMPACT ASSESSMENT</span>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    While Semantic Scholar is a legitimate academic index, egress calls to this domain bypass established privacy filters and proxy-rate limits declared in Charter v1.4, presenting exfiltration vectors.
                  </p>
                </div>
              </div>

              {/* Evaluator Breakdown */}
              <div className="bg-brand-cream border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E]">
                <h4 className="text-base uppercase text-brand-forest font-black mb-3">
                  LLM Evaluator Breakdown
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-white border border-brand-charcoal">
                    <span className="text-brand-charcoal font-bold">Validator #01 (Claude 3.5 Sonnet Node)</span>
                    <span className="text-brand-orange font-black">ESCALATE (0x02)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white border border-brand-charcoal">
                    <span className="text-brand-charcoal font-bold">Validator #02 (GPT-4o Consensus Node)</span>
                    <span className="text-brand-orange font-black">ESCALATE (0x02)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white border border-brand-charcoal">
                    <span className="text-brand-charcoal font-bold">Validator #03 (Mistral Large Node)</span>
                    <span className="text-emerald-800 font-bold">APPROVE (BENIGN)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white border border-brand-charcoal">
                    <span className="text-brand-charcoal font-bold">Validator #04 (Llama 3.3 70B Node)</span>
                    <span className="text-emerald-800 font-bold">APPROVE (BENIGN)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white border border-brand-charcoal">
                    <span className="text-brand-charcoal font-bold">Validator #05 (DeepSeek R1 Arbiter)</span>
                    <span className="text-emerald-800 font-bold">APPROVE (BENIGN)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diff View */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-brand-forest text-stone-100 border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E] flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b-2 border-brand-charcoal bg-brand-charcoal text-white">
                  <span className="font-mono text-xs font-black uppercase tracking-wider">DIFF: COMMIT 8f391c vs CHARTER BASELINE</span>
                  <span className="bg-brand-pastelYellow text-brand-charcoal px-2.5 py-0.5 font-mono text-xs uppercase font-black border border-brand-charcoal">
                    1 file changed, +14 lines
                  </span>
                </div>
                <div className="font-mono text-xs overflow-x-auto leading-relaxed p-5 space-y-1 bg-[#0A1C14]">
                  <div className="text-stone-400 select-none pb-1 font-bold">--- a/src/retrievers/scholar.py (Frozen Charter v1.4)</div>
                  <div className="text-stone-400 select-none pb-3 font-bold">+++ b/src/retrievers/scholar.py (Candidate v1.5.0-rc1)</div>
                  <div className="text-emerald-400">@@ -18,6 +18,20 @@ class ResearchRetriever:</div>
                  <div className="text-stone-300">    def __init__(self, agent_context):</div>
                  <div className="text-stone-300">        self.context = agent_context</div>
                  <div className="text-stone-300">        self.arxiv_endpoint = "https://export.arxiv.org/api/query"</div>
                  <div className="bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-bold my-1 border-l-4 border-brand-orange">+       # EXPANSION FLAGGED BY VAL_01, VAL_02</div>
                  <div className="bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-bold my-0.5 border-l-4 border-brand-orange">+       self.semantic_scholar_endpoint = "https://api.semantic-scholar.org/v1"</div>
                  <div className="bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-bold my-0.5 border-l-4 border-brand-orange">+       self.auth_header = os.getenv("SEMANTIC_API_KEY", "")</div>
                  <div className="text-stone-300">    def fetch_papers(self, query_str: str) -&gt; list:</div>
                  <div className="text-stone-300">        """Dispatches academic queries to approved indices."""</div>
                  <div className="bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-bold my-0.5 border-l-4 border-brand-orange">+       if self.context.get("enable_expanded_graph"):</div>
                  <div className="bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-bold my-0.5 border-l-4 border-brand-orange">+           return self._query_semantic_scholar(query_str)</div>
                  <div className="text-stone-300">        return self._query_arxiv_safe(query_str)</div>
                </div>
                <div className="flex items-center gap-2 bg-white text-brand-charcoal p-3.5 border-t-2 border-brand-charcoal font-mono text-xs">
                  <span>Diff signature validated with SHA256 <span className="font-bold font-mono text-brand-forest">c42b7891...33d1</span>. Immutable audit snapshot stored on Arweave.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multisig Sign-off Console */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal px-4 sm:px-8 lg:px-16 py-12">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-brand-charcoal">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-forest font-bold block mb-1">
                SECTION 02 // GOVERNANCE INTERACTION
              </span>
              <h2 className="text-2xl lg:text-3xl uppercase text-brand-forest font-black tracking-tight">
                Multisig Sign-off Console
              </h2>
            </div>
            <div className="bg-brand-forest text-brand-pastelYellow px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              Threshold Rule: 2-of-3 Human Guardians Required
            </div>
          </div>

          <div className="bg-white border-2 border-brand-charcoal p-6 lg:p-8 shadow-[6px_6px_0px_#0B130E] flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Guardian 01 */}
              <div className="bg-brand-cream border-2 border-brand-charcoal p-5 shadow-[3px_3px_0px_#0B130E] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-stone-600 font-bold uppercase">GUARDIAN 01</span>
                  <span className="bg-brand-forest text-white px-2.5 py-0.5 font-mono text-[11px] font-black uppercase flex items-center gap-1 border border-brand-charcoal">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    CONFIRMED
                  </span>
                </div>
                <div>
                  <div className="font-mono text-lg text-brand-forest font-black">0x4b71...E802</div>
                  <div className="text-xs text-stone-700 mt-1 font-bold">Lead System Auditor (Atlas DAO)</div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal/20 font-mono text-[11px] text-stone-600">
                  Sig: 0x992fa...12e8 | Block #61997430
                </div>
              </div>

              {/* Guardian 02 (Active) */}
              <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-5 shadow-[3px_3px_0px_#0B130E] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-stone-700 font-bold uppercase">GUARDIAN 02</span>
                  <span className="bg-brand-orange text-white px-2.5 py-0.5 font-mono text-[11px] font-black uppercase flex items-center gap-1 border border-brand-charcoal shadow-[1px_1px_0px_#0B130E]">
                    <Clock className="w-3.5 h-3.5" />
                    ACTIVE SIGNER
                  </span>
                </div>
                <div>
                  <div className="font-mono text-lg text-brand-charcoal font-black">0x82fD...e109</div>
                  <div className="text-xs text-stone-800 mt-1 font-bold">External Security Delegate (Connected)</div>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-charcoal/30 font-mono text-xs text-brand-orange font-black uppercase tracking-wider">
                  Action Ready: Your wallet signature is active.
                </div>
              </div>

              {/* Guardian 03 */}
              <div className="bg-stone-50 border-2 border-stone-300 p-5 shadow-sm flex flex-col justify-between opacity-80">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-stone-500 font-bold uppercase">GUARDIAN 03</span>
                  <span className="bg-stone-200 text-stone-700 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase flex items-center gap-1 border border-stone-400">
                    PENDING
                  </span>
                </div>
                <div>
                  <div className="font-mono text-lg text-stone-700 font-bold">0x19a2...99C1</div>
                  <div className="text-xs text-stone-600 mt-1 font-medium">Protocol Council Multisig Node</div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-200 font-mono text-[11px] text-stone-500">
                  Standing by for Guardian 02 action.
                </div>
              </div>
            </div>

            {/* Actions Console */}
            <div className="bg-brand-cream border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1.5 max-w-xl">
                <h4 className="text-base uppercase text-brand-forest font-black tracking-tight">
                  Execute Consensus State Transition
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  Confirming will ratify Charter Addendum v1.4.1 allowing <code className="font-mono text-xs bg-white border border-brand-charcoal px-1.5 py-0.5 text-brand-forest font-bold">api.semantic-scholar.org</code> and unblock package distribution. Rejecting sets verdict permanently to <strong className="text-brand-orange font-black">0x03 VIOLATION</strong>. UpdateSeal v1 does not implement slashing.
                </p>
              </div>

              {!actionDone ? (
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleMultisig('reject')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-brand-charcoal text-white hover:bg-stone-800 transition-colors font-mono text-xs uppercase font-black tracking-wider border-2 border-brand-charcoal shadow-[3px_3px_0px_#EF5313] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-brand-orange" />
                    <span>REJECT CANDIDATE (0x03)</span>
                  </button>

                  <button
                    onClick={() => handleMultisig('approve')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-brand-orange text-white hover:bg-brand-orangeDark transition-colors font-mono text-xs uppercase font-black tracking-wider border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>SIGN TO APPROVE EXPANSION (2-OF-3) ✍️</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Interactive Feedback */}
            {multisigFeedback && (
              <div className="p-4 font-mono text-xs font-bold uppercase transition-all duration-300 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] bg-brand-pastelYellow text-brand-charcoal">
                {multisigFeedback}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
